const express = require('express');
const router = express.Router();
const User = require('../models/User');
const admin = require('firebase-admin');

// Middleware kiểm tra token (tái sử dụng từ server.js)
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
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// API đăng ký user vào MongoDB
router.post('/register', authenticate, async (req, res) => {
  const { uid, email } = req.user;
  try {
    // Kiểm tra xem user đã tồn tại chưa
    let user = await User.findOne({ uid });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Tạo user mới
    user = new User({
      uid,
      email,
      favorites: [],
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});
router.get('/me', authenticate, async (req, res) => {
  const { uid } = req.user;
  try {
    const user = await User.findOne({ uid }).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

module.exports = router;