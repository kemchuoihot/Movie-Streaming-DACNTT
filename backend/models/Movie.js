// backend/models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  originName: { type: String, required: true },
  name: { type: String, required: true },
  year: { type: Number },
  time: { type: String },
  quality: { type: String }, // Chất lượng (e.g., "HD", "FullHD")
  status: { type: String, enum: ['ongoing', 'completed'], default: 'completed' },
  genres: [{ type: String }],
  directors: [{ type: String }],
  actors: [{ type: String }],
  rating: { type: Number, default: 0 },
  description: { type: String },
  thumbUrl: { type: String },
  posterUrl: { type: String },
  trailerUrl: { type: String },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Movie', movieSchema);