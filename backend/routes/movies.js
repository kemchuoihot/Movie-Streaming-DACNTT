const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Middleware kiểm tra admin
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
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token has expired, please log in again' });
    }
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const checkAdmin = async (req, res, next) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    if (user.customClaims && user.customClaims.admin) {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status', error: error.message });
  }
};

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
    res.status(500).json({ status: 'error', message: 'Error fetching movies', error: error.message });
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
        quality: movie.quality || 'HD', // Mặc định nếu không có
        status: movie.status || 'completed', // Mặc định nếu không có
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
    res.status(500).json({ status: 'error', message: 'Error fetching movie', error: error.message });
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
    res.status(500).json({ status: 'error', message: 'Error searching movies', error: error.message });
  }
});

// Thêm phim (chỉ admin)
router.post('/admin', authenticate, async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json({ status: 'success', message: 'Movie added successfully', movie });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error adding movie', error: error.message });
  }
});

module.exports = router;