const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const User = require('../models/User');
const admin = require('firebase-admin');

// Middleware kiểm tra token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token has expired, please log in again' });
    }
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Middleware kiểm tra admin
const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: 'Error checking admin status', error: error.message });
  }
};

// Thêm phim vào yêu thích
router.post("/favorites", async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ message: "Slug is required" });
    }
    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      user = new User({ uid: req.user.uid, email: req.user.email, favorites: [] });
    }
    if (!user.favorites.includes(movie._id)) {
      user.favorites.push(movie._id);
      await user.save();
    }
    res.status(201).json({ message: "Movie added to favorites" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Error adding favorite", error: error.message });
  }
});

// Xóa phim khỏi yêu thích
router.delete("/favorites/:slug", authenticate, async (req, res) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.favorites = user.favorites.filter((fav) => !fav.equals(movie._id));
    await user.save();
    res.json({ message: "Movie removed from favorites" });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: "Error removing favorite", error: error.message });
  }
});

// Lấy danh sách yêu thích
router.get("/favorites", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).populate('favorites', 'slug name posterUrl');
    if (!user || !user.favorites.length) {
      return res.json([]);
    }
    res.json(user.favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Error fetching favorites", error: error.message });
  }
});


// Lưu lịch sử xem phim
router.post("/history", authenticate, async (req, res) => {
  try {
    const { slug, stoppedAt } = req.body;
    if (!slug || stoppedAt === undefined) {
      return res.status(400).json({ message: "Slug and stoppedAt are required" });
    }
    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }
    let user = await User.findOne({ uid: req.user.uid });
    if (!user) {
      user = new User({ uid: req.user.uid, email: req.user.email, watchHistory: [] });
    }
    // Đảm bảo watchHistory luôn là mảng
    if (!Array.isArray(user.watchHistory)) {
      user.watchHistory = [];
    }
    const historyEntry = user.watchHistory.find(entry => entry.movie.equals(movie._id));
    if (historyEntry) {
      historyEntry.stoppedAt = stoppedAt;
      historyEntry.lastWatched = new Date();
    } else {
      user.watchHistory.push({
        movie: movie._id,
        stoppedAt,
        lastWatched: new Date(),
      });
    }
    await user.save();
    res.status(201).json({ message: "Watch history updated" });
  } catch (error) {
    console.error("Error saving watch history:", error);
    res.status(500).json({ message: "Error saving watch history", error: error.message });
  }
});

// Lấy lịch sử xem phim
router.get("/history", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).populate('watchHistory.movie', 'slug name posterUrl time');
    // Kiểm tra user và watchHistory kỹ hơn
    if (!user || !user.watchHistory || !Array.isArray(user.watchHistory) || user.watchHistory.length === 0) {
      return res.json([]);
    }
    const history = user.watchHistory
      .filter(entry => entry.movie !== null) // Bỏ qua các entry có movie là null
      .map(entry => ({
        slug: entry.movie.slug,
        name: entry.movie.name,
        posterUrl: entry.movie.posterUrl,
        stoppedAt: entry.stoppedAt,
        lastWatched: entry.lastWatched,
        duration: parseDuration(entry.movie.time),
      }))
      .sort((a, b) => b.lastWatched - a.lastWatched); // Sắp xếp theo thời gian xem gần nhất
    res.json(history);
  } catch (error) {
    console.error("Error fetching watch history:", error);
    res.status(500).json({ message: "Error fetching watch history", error: error.message });
  }
});


// Hàm hỗ trợ chuyển đổi duration thành phút
function parseDuration(time) {
  if (!time) return 0;

  // Xử lý định dạng "119 phút"
  const minuteMatch = time.match(/^(\d+)\s*phút$/i);
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10) || 0;
  }

  // Xử lý định dạng "2h 30m" hoặc "2h"
  if (time.includes("h")) {
    const hours = parseInt(time.split("h")[0]) || 0;
    const minutes = time.includes("m") ? parseInt(time.split("h")[1].split("m")[0]) || 0 : 0;
    return hours * 60 + minutes;
  }

  // Xử lý định dạng "10 tập"
  if (time.includes("tập")) {
    const episodes = parseInt(time.split("tập")[0]) || 1;
    return episodes * 45; // Giả định mỗi tập 45 phút
  }

  return 0; // Trả về 0 nếu không parse được
}

// Lấy danh sách phim mới cập nhật
router.get('/new', async (req, res) => {
  try {
    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({
      status: 'success',
      items: movies.map((movie) => ({
        name: movie.name,
        slug: movie.slug,
        thumb_url: movie.thumbUrl,
        poster_url: movie.posterUrl,
        year: movie.year,
        time: movie.time,
        genre: movie.genres.join(', '),
      })),
    });
  } catch (error) {
    console.error("Error fetching new movies:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching movies', error: error.message });
  }
});

// Lấy phim theo danh mục
router.get('/category/:category', async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    let query = {};
    if (category === 'phim-le') {
      query.time = { $regex: '^[0-9]+h.*$' };
    } else if (category === 'phim-bo') {
      query.time = { $regex: '.*tập.*' };
    } else {
      query.genres = category;
    }

    const totalItems = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: {
        items: movies.map((movie) => ({
          name: movie.name,
          slug: movie.slug,
          thumb_url: movie.thumbUrl,
          poster_url: movie.posterUrl,
          year: movie.year,
          time: movie.time,
          genre: movie.genres.join(', '),
        })),
        pagination: {
          totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching category movies:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching movies', error: error.message });
  }
});

// Tìm kiếm phim
router.get('/search', async (req, res) => {
  const { keyword, limit = 100 } = req.query;
  try {
    const query = keyword
      ? { name: { $regex: keyword, $options: 'i' } }
      : {};
    const movies = await Movie.find(query).limit(parseInt(limit));
    res.json({
      status: 'success',
      data: {
        items: movies.map((movie) => ({
          name: movie.name,
          slug: movie.slug,
          thumb_url: movie.thumbUrl,
          poster_url: movie.posterUrl,
          year: movie.year,
          time: movie.time,
          genre: movie.genres.join(', '),
        })),
      },
    });
  } catch (error) {
    console.error("Error searching movies:", error);
    res.status(500).json({ status: 'error', message: 'Error searching movies', error: error.message });
  }
});

// CRUD Phim (Admin)
router.get('/admin/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json({ status: 'success', movies });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching movies', error: error.message });
  }
});

router.post('/admin/movies', async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json({ status: 'success', message: 'Movie added successfully', movie });
  } catch (error) {
    console.error("Error adding movie:", error);
    res.status(500).json({ status: 'error', message: 'Error adding movie', error: error.message });
  }
});

router.put('/admin/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      return res.status(404).json({ status: 'error', message: 'Movie not found' });
    }
    res.json({ status: 'success', message: 'Movie updated successfully', movie });
  } catch (error) {
    console.error("Error updating movie:", error);
    res.status(500).json({ status: 'error', message: 'Error updating movie', error: error.message });
  }
});

router.delete('/admin/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ status: 'error', message: 'Movie not found' });
    }
    res.json({ status: 'success', message: 'Movie deleted successfully' });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({ status: 'error', message: 'Error deleting movie', error: error.message });
  }
});

router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.isAdmin || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = await admin.auth().createCustomToken(user.uid);
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Lấy chi tiết phim
router.get('/:slug', async (req, res) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug });
    if (!movie) {
      return res.status(404).json({ status: 'error', message: 'Movie not found' });
    }
    res.json({
      status: 'success',
      movie: {
        name: movie.name,
        origin_name: movie.originName,
        slug: movie.slug,
        thumb_url: movie.thumbUrl,
        poster_url: movie.posterUrl,
        year: movie.year,
        time: movie.time,
        quality: movie.quality || 'HD',
        status: movie.status || 'completed',
        genre: movie.genres.join(', '),
        director: movie.directors,
        actor: movie.actors,
        tmdb: { vote_average: movie.rating },
        content: movie.description,
        trailer_url: movie.trailerUrl,
        video_url: movie.videoUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching movie', error: error.message });
  }
});

module.exports = router;