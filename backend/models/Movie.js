const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, default: '' },
  displayName: { type: String, default: '' }, // Thêm trường displayName
  createdAt: { type: Date, default: Date.now },
});

const movieSchema = new mongoose.Schema({
  name: { type: String, required: true },
  originName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  thumbUrl: { type: String, required: true },
  posterUrl: { type: String, required: true },
  year: { type: Number, required: true },
  time: { type: String, required: true },
  quality: { type: String, default: 'HD' },
  status: { type: String, default: 'completed' },
  genres: [{ type: String }],
  directors: [{ type: String }],
  actors: [{ type: String }],
  rating: { type: Number, default: 0 }, // Điểm trung bình
  description: { type: String, required: true },
  trailerUrl: { type: String },
  videoUrl: { type: String },
  ratings: [ratingSchema], // Mảng ratings với schema con
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Movie', movieSchema);