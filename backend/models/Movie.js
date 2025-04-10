const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  genre: { type: String },
  videoUrl: { type: String }, // URL của file .m3u8
  rating: { type: Number, default: 0 },
});

module.exports = mongoose.model('Movie', movieSchema);