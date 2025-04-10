const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Lấy danh sách phim
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Thêm phim (cho quản trị viên)
router.post('/', async (req, res) => {
  const { title, description, genre, videoUrl } = req.body;
  try {
    const movie = new Movie({ title, description, genre, videoUrl });
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Error adding movie' });
  }
});

module.exports = router;