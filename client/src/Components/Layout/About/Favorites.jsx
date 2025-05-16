import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import "boxicons/css/boxicons.min.css";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const Favorites = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem("authToken", token);
          setUser(currentUser);
          fetchFavorites();
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Failed to authenticate. Please log in again.");
          navigate("/login");
        }
      } else {
        setUser(null);
        setError("Please log in to view favorites.");
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found");
      }
      const response = await axios.get("http://localhost:5000/api/movies/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(response.data);
      setError("");
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError(err.response?.data?.message || "Failed to load favorites. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (slug) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found");
      }
      await axios.delete(`http://localhost:5000/api/movies/favorites/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((movie) => movie.slug !== slug));
      setError("");
    } catch (err) {
      console.error("Error removing favorite:", err);
      setError(err.response?.data?.message || "Failed to remove favorite. Please try again.");
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-[#06121e] text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#06121e] flex relative">
      <Link
        to="/"
        className="bx bx-home absolute top-4 right-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline z-10"
      ></Link>
      <div className="bg-[#0e274073] text-white w-64 py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6">Quản lý tài khoản</h2>
        <Link to="/favorites" className="block py-2 bg-[#153a61] rounded">
          <span className="text-yellow-500 mr-2">●</span> Yêu thích
        </Link>
        <Link to="/watchlist" className="block py-2 hover:bg-[#153a61] rounded">
          Danh sách
        </Link>
        <Link to="/history" className="block py-2 hover:bg-[#153a61] rounded">
          Lịch sử
        </Link>
        <Link to="/taikhoan" className="block py-2 hover:bg-[#153a61] rounded">
          Tài khoản
        </Link>
      </div>
      <div className="flex-1 p-8">
        <div className="bg-[#0e274073] text-white rounded-md shadow-md p-5 mt-6">
          <h2 className="text-xl font-semibold mb-4">Phim yêu thích</h2>
          <p className="text-gray-400 mb-4">Danh sách phim bạn đã thêm vào yêu thích</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : favorites.length === 0 ? (
            <p className="text-gray-300">Bạn chưa có phim yêu thích nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mx-auto max-w-screen-xl">
              {favorites.map((movie) => (
                <div key={movie.slug} className="relative group">
                  <Link to={`/detail/${movie.slug}`}>
                    <LazyLoadImage
                      effect="blur"
                      src={movie.posterUrl}
                      alt={movie.name}
                      className="w-full h-64 object-cover rounded-lg group-hover:opacity-80 transition-opacity"
                    />
                    <h3 className="mt-2 text-white text-sm truncate">{movie.name}</h3>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(movie.slug)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                    title="Xóa khỏi yêu thích"
                  >
                    <i className="bx bx-trash text-lg"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;