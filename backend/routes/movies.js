const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const User = require('../models/User');
const admin = require('firebase-admin');

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
    console.error('Token verification error:', error);
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
    console.error('Error checking admin status:', error);
    res.status(500).json({ message: 'Error checking admin status', error: error.message });
  }
};

router.post('/:slug/rating', authenticate, async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating, comment, displayName } = req.body;
    const userId = req.user.uid;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const existingRating = movie.ratings.find((r) => r.userId === userId);
    if (existingRating) {
      existingRating.rating = rating;
      existingRating.comment = comment || '';
      existingRating.displayName = displayName || existingRating.displayName || userId; // Đảm bảo displayName được lưu
      existingRating.createdAt = new Date();
    } else {
      movie.ratings.push({
        userId,
        rating,
        comment: comment || '',
        displayName: displayName || userId, // Lưu displayName
      });
    }

    const totalRatings = movie.ratings.length;
    const averageRating =
      totalRatings > 0
        ? movie.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;
    movie.rating = Number(averageRating.toFixed(1));

    await movie.save();
    res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
});

router.delete('/:slug/rating/:userId', async (req, res) => {
  try {
    const { slug, userId } = req.params;

    const movie = await Movie.findOne({ slug });
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const ratingIndex = movie.ratings.findIndex((r) => r.userId === userId);
    if (ratingIndex === -1) {
      return res.status(404).json({ message: `Rating for user ${userId} not found` });
    }

    movie.ratings.splice(ratingIndex, 1); // Xóa đánh giá

    // Cập nhật lại average rating
    const totalRatings = movie.ratings.length;
    const averageRating =
      totalRatings > 0
        ? movie.ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;
    movie.rating = Number(averageRating.toFixed(1));

    await movie.save();
    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Error deleting rating', error: error.message });
  }
});
// Thêm phim vào yêu thích
router.post("/favorites", authenticate, async (req, res) => {
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
    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
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

router.get("/top-rated", async (req, res) => {
  try {
    const topRatedMovie = await Movie.findOne()
      .sort({ rating: -1 }) // Sắp xếp giảm dần theo rating
      .limit(1); // Lấy 1 phim có rating cao nhất
    if (!topRatedMovie) {
      return res.status(404).json({ status: "error", message: "No movies found" });
    }
    res.json({
      status: "success",
      movie: {
        name: topRatedMovie.name,
        slug: topRatedMovie.slug,
        thumb_url: topRatedMovie.thumbUrl,
        poster_url: topRatedMovie.posterUrl,
        year: topRatedMovie.year,
        rating: topRatedMovie.rating,
      },
    });
  } catch (error) {
    console.error("Error fetching top rated movie:", error);
    res.status(500).json({ status: "error", message: "Error fetching top rated movie" });
  }
});

router.get("/top-viewed", async (req, res) => {
  try {
    const topMovies = await Movie.find()
      .sort({ views: -1 }) // Sắp xếp giảm dần theo views
      .limit(5); // Lấy top 5
    res.json({
      status: "success",
      items: topMovies.map((movie) => ({
        name: movie.name,
        slug: movie.slug,
        thumb_url: movie.thumbUrl,
        poster_url: movie.posterUrl,
        year: movie.year,
        views: movie.views,
      })),
    });
  } catch (error) {
    console.error("Error fetching top viewed movies:", error);
    res.status(500).json({ status: "error", message: "Error fetching top movies" });
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
    if (!user || !user.favorites || !Array.isArray(user.favorites) || user.favorites.length === 0) {
      return res.json([]);
    }
    const validFavorites = user.favorites.filter(movie => movie !== null);
    res.json(validFavorites);
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
    if (!user || !user.watchHistory || !Array.isArray(user.watchHistory) || user.watchHistory.length === 0) {
      return res.json([]);
    }
    const history = user.watchHistory
      .filter(entry => entry.movie !== null)
      .map(entry => ({
        slug: entry.movie.slug,
        name: entry.movie.name,
        posterUrl: entry.movie.posterUrl,
        stoppedAt: entry.stoppedAt,
        lastWatched: entry.lastWatched,
        duration: parseDuration(entry.movie.time),
      }))
      .sort((a, b) => b.lastWatched - a.lastWatched);
    res.json(history);
  } catch (error) {
    console.error("Error fetching watch history:", error);
    res.status(500).json({ message: "Error fetching watch history", error: error.message });
  }
});

// Hàm hỗ trợ chuyển đổi duration thành phút
function parseDuration(time) {
  if (!time) return 0;
  const minuteMatch = time.match(/^(\d+)\s*phút$/i);
  if (minuteMatch) {
    return parseInt(minuteMatch[1], 10) || 0;
  }
  if (time.includes("h")) {
    const hours = parseInt(time.split("h")[0]) || 0;
    const minutes = time.includes("m") ? parseInt(time.split("h")[1].split("m")[0]) || 0 : 0;
    return hours * 60 + minutes;
  }
  if (time.includes("tập")) {
    const episodes = parseInt(time.split("tập")[0]) || 1;
    return episodes * 45;
  }
  return 0;
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
        ratings: movie.ratings || [], // Thêm trường ratings
      },
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching movie', error: error.message });
  }
});


router.put("/:slug/view", async (req, res) => {
  try {
    const { slug } = req.params;

    const movie = await Movie.findOneAndUpdate(
      { slug },
      {
        $inc: { views: 1 }, // Tăng views lên 1
        $push: { viewHistory: { timestamp: new Date(), count: 1 } }, // Thêm vào lịch sử xem
      },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (!movie) {
      return res.status(404).json({ status: "error", message: "Movie not found" });
    }

    res.json({
      status: "success",
      message: "View incremented successfully",
      movie: {
        slug: movie.slug,
        views: movie.views,
      },
    });
  } catch (error) {
    console.error("Error incrementing view:", error);
    res.status(500).json({
      status: "error",
      message: "Error incrementing view",
      error: error.message,
    });
  }
});


module.exports = router;