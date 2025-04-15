// src/components/AdminAddMovie.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminAddMovie() {
  const [movie, setMovie] = useState({
    slug: '',
    originName: '',
    name: '',
    year: '',
    time: '',
    quality: '',
    status: 'completed',
    genres: [],
    directors: [],
    actors: [],
    rating: 0,
    description: '',
    thumbUrl: '',
    posterUrl: '',
    trailerUrl: '',
    videoUrl: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      await axios.post('http://localhost:5000/api/movies/admin', movie, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Movie added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding movie:', error);
      setError(error.response?.data?.message || 'Failed to add movie');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['genres', 'directors', 'actors'].includes(name)) {
      setMovie({ ...movie, [name]: value.split(', ').filter((v) => v) });
    } else {
      setMovie({ ...movie, [name]: value });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#06121e] p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-6">Add New Movie</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="slug"
            placeholder="Slug (e.g., movie-title)"
            value={movie.slug}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
            required
          />
          <input
            name="originName"
            placeholder="Origin Name (e.g., The Matrix)"
            value={movie.originName}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
            required
          />
          <input
            name="name"
            placeholder="Name (e.g., Ma Trận)"
            value={movie.name}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
            required
          />
          <input
            name="year"
            type="number"
            placeholder="Year (e.g., 1999)"
            value={movie.year}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="time"
            placeholder="Time (e.g., 2h 15m)"
            value={movie.time}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="quality"
            placeholder="Quality (e.g., HD)"
            value={movie.quality}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <select
            name="status"
            value={movie.status}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          >
            <option value="completed">Hoàn Thành</option>
            <option value="ongoing">Đang Chiếu</option>
          </select>
          <input
            name="genres"
            placeholder="Genres (e.g., Action, Sci-Fi)"
            value={movie.genres.join(', ')}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="directors"
            placeholder="Directors (e.g., Wachowski)"
            value={movie.directors.join(', ')}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="actors"
            placeholder="Actors (e.g., Keanu Reeves, Laurence Fishburne)"
            value={movie.actors.join(', ')}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="rating"
            type="number"
            step="0.1"
            placeholder="Rating (e.g., 8.7)"
            value={movie.rating}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={movie.description}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="thumbUrl"
            placeholder="Thumb URL"
            value={movie.thumbUrl}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="posterUrl"
            placeholder="Poster URL"
            value={movie.posterUrl}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="trailerUrl"
            placeholder="Trailer URL (e.g., https://youtube.com/watch?v=...)"
            value={movie.trailerUrl}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <input
            name="videoUrl"
            placeholder="Video URL (e.g., embed link or .m3u8)"
            value={movie.videoUrl}
            onChange={handleChange}
            className="w-full rounded-md bg-white px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-3 py-3 text-white hover:bg-indigo-500"
          >
            Add Movie
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminAddMovie;