import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { toast } from "react-toastify";
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
          await fetchFavorites(token);
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          navigate("/signin");
        }
      } else {
        setUser(null);
        setError("Vui lòng đăng nhập để xem danh sách yêu thích.");
        navigate("/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchFavorites = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Favorites response:", response.data); // Debug log
      setFavorites(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching favorites:", err.response?.data || err);
      const message =
        err.response?.data?.message ||
        "Không thể tải danh sách yêu thích. Vui lòng thử lại.";
      setError(message);
      toast.error(message);
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
      await axios.delete(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/favorites/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorites(favorites.filter((movie) => movie.slug !== slug));
      toast.success("Đã xóa phim khỏi danh sách yêu thích!");
      setError("");
    } catch (err) {
      console.error("Error removing favorite:", err);
      const message =
        err.response?.data?.message ||
        "Không thể xóa phim khỏi danh sách yêu thích.";
      setError(message);
      toast.error(message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06121e] text-white">Đang tải...</div>
    );
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
        <Link to="/history" className="block py-2 hover:bg-[#153a61] rounded">
          Lịch sử
        </Link>
        <Link to="/taikhoan" className="block py-2 hover:bg-[#153a61] rounded">
          Tài khoản
        </Link>
      </div>
      <div className="flex-1 p-8">
        <div className="bg-transparent text-white rounded-lg shadow-none p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">Phim yêu thích</h2>
          <p className="text-gray-400 mb-6">
            Danh sách phim bạn đã thêm vào yêu thích
          </p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading ? (
            <p className="text-white text-center py-4">Đang tải...</p>
          ) : favorites.length === 0 ? (
            <p className="text-gray-300 text-center py-4">
              Bạn chưa có phim yêu thích nào.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto max-w-screen-xl">
              {favorites.map((movie) => (
                <div
                  key={movie.slug}
                  className="flex flex-col items-center border border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-4 bg-transparent group"
                >
                  <Link
                    to={`/detail/${movie.slug}`}
                    className="w-full flex justify-center rounded-3xl"
                  >
                    <div className="w-full h-80 flex items-center justify-center overflow-hidden mb-2 rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                      <LazyLoadImage
                        effect="blur"
                        src={movie.posterUrl}
                        alt={movie.name}
                        className="object-contain w-full h-full overflow-hidden"
                      />
                    </div>
                  </Link>
                  <h3 className="text-white text-sm font-medium text-center truncate w-full mb-2">
                    {movie.name}
                  </h3>
                  <button
                    onClick={() => handleRemoveFavorite(movie.slug)}
                    className="bg-red-600 text-white rounded-full p-2 transition-colors duration-300 ease-in-out shadow-md hover:bg-red-700 hover:shadow-lg"
                    title="Xóa khỏi yêu thích"
                  >
                    <i className="bx bx-trash text-xl"></i>
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
