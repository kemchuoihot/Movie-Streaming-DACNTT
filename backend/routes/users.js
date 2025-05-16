const express = require('express');
const router = express.Router();
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

// Lấy danh sách người dùng
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ status: 'success', users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ status: 'error', message: 'Error fetching users', error: error.message });
  }
});

// Tạo người dùng
router.post('/', async (req, res) => {
  try {
    const { email, isAdmin } = req.body;
    const user = new User({
      uid: `uid_${Date.now()}`,
      email,
      isAdmin: isAdmin || false,
    });
    await user.save();
    res.status(201).json({ status: 'success', message: 'User created successfully', user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ status: 'error', message: 'Error creating user', error: error.message });
  }
});

// Cập nhật người dùng
router.put('/:id', async (req, res) => {
  try {
    const { email, isAdmin } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { email, isAdmin }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', message: 'User updated successfully', user });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ status: 'error', message: 'Error updating user', error: error.message });
  }
});

// Xóa người dùng
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', message: 'User deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ status: 'error', message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;