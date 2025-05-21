const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String }, // Plain text for admin
  isAdmin: { type: Boolean, default: false },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  createdAt: { type: Date, default: Date.now },
  watchHistory: [
    {
      movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
      stoppedAt: { type: Number, default: 0 }, // Số phút đã xem
      lastWatched: { type: Date, default: Date.now }, // Thời gian lưu lịch sử
    },
  ],
});

module.exports = mongoose.model('User', userSchema);