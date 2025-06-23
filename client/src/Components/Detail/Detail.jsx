import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import { fetchMovieDetails } from "../../api/api";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Footer from "../Footer/Footer";
import { auth } from "../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../Layout/Navbar/NavBar";

const Detail = () => {
  const { slug } = useParams();
  const [film, setFilm] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [trailerId, setTrailerId] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        try {
          const token = await user.getIdToken();
          localStorage.setItem("authToken", token);
          console.log("User is logged in:", user.displayName || user.email);
          console.log("User ID:", user.uid);
          let displayName = user.displayName || user.email || "Người dùng";
          if (!user.displayName) {
            const newDisplayName = prompt(
              "Vui lòng nhập tên hiển thị của bạn:"
            );
            if (newDisplayName) {
              displayName = newDisplayName;
              await auth.currentUser.updateProfile({
                displayName: newDisplayName,
              });
            }
          }
          setUserDisplayName(displayName);
          setIsAdmin(user.email === "admin@moviecity.com");
          checkFavorite(user);
          fetchUserRating(user.uid);
        } catch (err) {
          console.error("Error getting token:", err);
          setIsLoggedIn(false);
          navigate("/signin");
        }
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem("authToken");
        setIsFavorite(false);
        setHasRated(false);
        setUserDisplayName("");
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUserRating = async (userId) => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/${slug}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      console.log("Fetched movie data:", response.data);
      const movie = response.data.movie;
      setFilm({ movie });
      const ratings = movie.ratings || [];
      const userRating = ratings.find((r) => r.userId === userId);
      if (userRating) {
        setRating(userRating.rating);
        setComment(userRating.comment || "");
        setHasRated(true);
      } else {
        setHasRated(false);
      }
      const averageRating =
        ratings.length > 0
          ? (
              ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            ).toFixed(1)
          : 0;
      setFilm((prevFilm) => ({
        ...prevFilm,
        movie: { ...prevFilm.movie, tmdb: { vote_average: averageRating } },
      }));
    } catch (err) {
      console.error("Error fetching user rating:", err);
    }
  };

  const checkFavorite = async (user) => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/favorites`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setIsFavorite(response.data.some((movie) => movie.slug === slug));
    } catch (err) {
      console.error("Error checking favorite:", err);
    }
  };

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const filmData = await fetchMovieDetails(slug);
        setFilm(filmData);
        setTrailerId(filmData.movie.trailer_url?.split("?v=")[1]);
      } catch (error) {
        console.error("Failed to fetch film:", error);
      }
    };

    fetchFilm();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao!");
      return;
    }
    try {
      await axios.post(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/${slug}/rating`,
        {
          rating,
          comment,
          displayName: userDisplayName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      toast.success("Đánh giá của bạn đã được gửi!");
      setSubmitted(true);
      setHasRated(true);
      fetchUserRating(auth.currentUser.uid);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast.error(
        error.response?.data?.message ||
          "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      navigate("/signin");
      return;
    }
    setFavoriteError("");
    setIsFavoriteLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found");
      }
      if (isFavorite) {
        const response = await axios.delete(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/favorites/${slug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFavorite(false);
        toast.success("Xóa khỏi yêu thích!");
      } else {
        const response = await axios.post(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/favorites`,
          { slug },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFavorite(true);
        toast.success("Thêm vào yêu thích!");
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setFavoriteError(
        err.response?.data?.message ||
          "Failed to update favorites. Please try again."
      );
      toast.error(err.response?.data?.message || "Failed to update favorites.");
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleDeleteRating = async (userId) => {
    if (!isAdmin) {
      toast.error("Bạn không có quyền xóa bình luận!");
      return;
    }
    try {
      await axios.delete(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/${slug}/rating/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      toast.success("Bình luận đã được xóa!");
      fetchUserRating(auth.currentUser.uid);
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  };

  if (!film) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang tải thông tin phim...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavBar />
      <div
        style={{ backgroundImage: `url(${film.movie.thumb_url})` }}
        className="h-[530px] bg-cover bg-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-transparent to-slate-900/60"></div>
      </div>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 px-4">
        <div className="container max-w-screen-xl mx-auto flex flex-col lg:flex-row">
          {/* Poster và Controls */}
          <div className="w-full lg:w-1/3 mb-8 lg:mb-0 relative -top-80">
            <div className="group relative">
              <LazyLoadImage
                effect="blur"
                src={film.movie.poster_url}
                alt="poster"
                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Nút Xem Ngay */}
            <Link to={`/watch/${slug}`}>
              <button className="group relative w-full mt-10 inline-flex items-center justify-center p-5 px-12 py-3.5 overflow-hidden font-medium text-white transition duration-300 ease-out rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative text-white text-lg font-semibold flex items-center">
                  <i className="bx bx-play-circle text-2xl mr-2"></i>
                  Xem Ngay
                </span>
              </button>
            </Link>

            {/* Nút Yêu thích */}
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              className={`w-full mt-4 py-4 rounded-2xl text-white font-semibold transition-all duration-300 transform hover:scale-105 ${
                isFavorite
                  ? "bg-gradient-to-r from-red-500 to-pink-600 shadow-lg hover:shadow-red-500/25"
                  : "bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20"
              } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isFavoriteLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i
                    className={`bx ${
                      isFavorite ? "bxs-heart" : "bx-heart"
                    } text-xl mr-2`}
                  ></i>
                  {isFavorite ? "Đã yêu thích" : "Thêm vào yêu thích"}
                </div>
              )}
            </button>

            {favoriteError && (
              <p className="text-red-400 mt-2 text-center bg-red-500/20 p-2 rounded-lg border border-red-500/30">
                {favoriteError}
              </p>
            )}

            {/* Rating Section */}
            <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              {isLoggedIn ? (
                <>
                  {hasRated ? (
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl p-4 border border-green-500/30 mb-4">
                        <p className="text-white mb-2">
                          Bạn đã đánh giá: {rating} sao
                        </p>
                        {comment && (
                          <p className="text-gray-300 mb-3">"{comment}"</p>
                        )}
                        <button
                          onClick={() => setHasRated(false)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm hover:shadow-lg transition-all duration-300"
                        >
                          Sửa đánh giá
                        </button>
                      </div>
                    </div>
                  ) : (
                    !submitted && (
                      <div className="space-y-4">
                        <h3 className="text-white font-semibold text-center mb-4">
                          Đánh giá phim
                        </h3>
                        <div className="flex justify-center space-x-1 mb-4">
                          {[...Array(5)].map((_, i) => {
                            const ratingValue = i + 1;
                            return (
                              <label key={i}>
                                <input
                                  type="radio"
                                  name="rating"
                                  value={ratingValue}
                                  className="hidden"
                                  onChange={() => setRating(ratingValue)}
                                />
                                <i
                                  className="bx bxs-star cursor-pointer text-3xl transition-all duration-200 hover:scale-110"
                                  style={{
                                    color:
                                      ratingValue <= (hover || rating)
                                        ? "#ffc107"
                                        : "#4a5568",
                                  }}
                                  onMouseEnter={() => setHover(ratingValue)}
                                  onMouseLeave={() => setHover(null)}
                                ></i>
                              </label>
                            );
                          })}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <textarea
                            className="w-full h-24 p-3 bg-white/10 text-white rounded-xl border border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none backdrop-blur placeholder-gray-400"
                            placeholder="Chia sẻ cảm nhận của bạn..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></textarea>
                          <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
                          >
                            Gửi đánh giá
                          </button>
                        </form>
                      </div>
                    )
                  )}
                  {submitted && (
                    <div className="text-center py-4">
                      <i className="bx bx-check-circle text-3xl text-green-400 mb-2"></i>
                      <p className="text-white">Cảm ơn bạn đã đánh giá!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="bx bx-user-circle text-3xl text-gray-400 mb-2"></i>
                  <p className="text-gray-300 mb-3">
                    Vui lòng đăng nhập để đánh giá
                  </p>
                  <Link
                    to="/signin"
                    className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm hover:shadow-lg transition-all duration-300"
                  >
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Thông tin phim */}
          <div className="w-full lg:pl-12">
            <div className="relative -top-72">
              <h1 className="text-4xl text-white font-bold font-[Montserrat] mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
                {film.movie.origin_name}
              </h1>
              <h2 className="text-xl text-gray-300 font-light mt-4">
                {film.movie.name}
              </h2>
              <h5 className="text-2xl text-white mt-2">({film.movie.year})</h5>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="text-lg text-white">{film.movie.time}</span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full font-bold flex items-center">
                  <i className="bx bxs-star mr-1"></i>
                  {film.movie.tmdb.vote_average === 0
                    ? "N/A"
                    : film.movie.tmdb.vote_average}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                  <h3 className="text-white font-semibold mb-2 flex items-center">
                    <i className="bx bx-user mr-2 text-purple-400"></i>
                    Đạo diễn:
                  </h3>
                  <p className="text-gray-300">{film.movie.director[0]}</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                  <h3 className="text-white font-semibold mb-2 flex items-center">
                    <i className="bx bx-group mr-2 text-pink-400"></i>
                    Diễn viên:
                  </h3>
                  <p className="text-gray-300">
                    {film.movie.actor[0] + ", " + film.movie.actor[1] + "..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative -top-60">
              <div className="mb-6">
                <h4 className="text-xl text-white mb-3 flex items-center">
                  <i className="bx bx-category mr-2 text-blue-400"></i>
                  Thể loại:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {film.movie.genre.split(", ").map((genre, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white px-3 py-1 rounded-full border border-purple-500/30 text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20 mb-8">
                <h3 className="text-xl text-white font-semibold mb-4">
                  Nội dung phim
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {film.movie?.content}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl text-white font-semibold">Trailer</h3>
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm hover:shadow-lg transition-all duration-300"
                  >
                    Xem toàn màn hình
                  </button>
                </div>
                <iframe
                  title="Movie Trailer"
                  className="w-full h-56 sm:h-[420px] rounded-xl"
                  src={`https://youtube.com/embed/${trailerId}`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>

            {/* Danh sách đánh giá */}
            {film.movie.ratings && film.movie.ratings.length > 0 && (
              <div className="mb-10 bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl text-white font-bold mb-6 flex items-center">
                  <i className="bx bx-message-square-dots mr-2 text-purple-400"></i>
                  Đánh giá & Bình luận ({film.movie.ratings.length})
                </h2>
                <div className="space-y-6">
                  {film.movie.ratings.map((ratingItem, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 relative group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold uppercase shadow-lg">
                            {ratingItem.displayName
                              ? ratingItem.displayName.charAt(0)
                              : "U"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white text-lg">
                              {ratingItem.displayName || "Người dùng ẩn danh"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(
                                ratingItem.createdAt
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          {ratingItem.comment && (
                            <p className="text-gray-300 mb-3 leading-relaxed">
                              "{ratingItem.comment}"
                            </p>
                          )}
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className="bx bxs-star text-xl"
                                style={{
                                  color:
                                    i < ratingItem.rating
                                      ? "#ffc107"
                                      : "#4a5568",
                                }}
                              ></i>
                            ))}
                            <span className="ml-2 text-sm text-gray-400 font-semibold">
                              {ratingItem.rating}/5
                            </span>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() =>
                              handleDeleteRating(ratingItem.userId)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-red-500/20"
                            title="Xóa bình luận"
                          >
                            <i className="bx bx-trash text-xl"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      {isTrailerOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-4xl mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">
                Trailer - {film.movie.name}
              </h3>
              <button
                onClick={() => setIsTrailerOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <i className="bx bx-x text-3xl"></i>
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                title="Movie Trailer"
                className="w-full h-full rounded-xl"
                src={`https://youtube.com/embed/${trailerId}?autoplay=1`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Detail;
