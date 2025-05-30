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
            const newDisplayName = prompt("Vui lòng nhập tên hiển thị của bạn:");
            if (newDisplayName) {
              displayName = newDisplayName;
              await auth.currentUser.updateProfile({ displayName: newDisplayName });
            }
          }
          setUserDisplayName(displayName);
          setIsAdmin(user.email === "admin@moviecity.com");
          checkFavorite(user);
          fetchUserRating(user.uid);
        } catch (err) {
          console.error("Error getting token:", err);
          setIsLoggedIn(false);
          navigate("/login");
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
      const response = await axios.get(`http://localhost:5000/api/movies/${slug}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      console.log('Fetched movie data:', response.data); // Log để debug
      const movie = response.data.movie;
      setFilm({ movie }); // Cập nhật film để hiển thị ratings
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
          ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
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
      const response = await axios.get("http://localhost:5000/api/movies/favorites", {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
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
        `http://localhost:5000/api/movies/${slug}/rating`,
        {
          rating,
          comment,
          displayName: userDisplayName,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        }
      );
      toast.success("Đánh giá của bạn đã được gửi!");
      setSubmitted(true);
      setHasRated(true);
      fetchUserRating(auth.currentUser.uid); // Cập nhật lại danh sách bình luận
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast.error(
        error.response?.data?.message || "Không thể gửi đánh giá. Vui lòng thử lại."
      );
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      navigate("/login");
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
          `http://localhost:5000/api/movies/favorites/${slug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFavorite(false);
        toast.success("Xóa khỏi yêu thích!");
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/movies/favorites",
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
        err.response?.data?.message || "Failed to update favorites. Please try again."
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
      await axios.delete(`http://localhost:5000/api/movies/${slug}/rating/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      toast.success("Bình luận đã được xóa!");
      fetchUserRating(auth.currentUser.uid); // Cập nhật lại danh sách bình luận
    } catch (error) {
      console.error("Error deleting rating:", error);
      toast.error("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  };

  if (!film) {
    return <div className="min-h-screen bg-[#06121e] text-white">Loading...</div>;
  }

  return (
    <>
      <NavBar />
      <div
        style={{ backgroundImage: `url(${film.movie.thumb_url})` }}
        className="h-[530px] bg-cover bg-center relative"
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      </div>
      <section className="bg-[#06121e] px-4">
        <div className="container max-w-screen-xl mx-auto flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 mb-8 lg:mb-0 relative -top-80">
            <LazyLoadImage
              effect="blur"
              src={film.movie.poster_url}
              alt="poster"
              className="w-full h-auto rounded-lg"
            />
            <Link to={`/watch/${slug}`}>
              <button className="relative w-full mt-10 inline-flex items-center justify-center p-5 px-12 py-3.5 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-lg shadow-xl group hover:ring-0 hover:ring-purple-500">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative text-white text-base font-semibold">
                  <i className="bx bx-play"></i> Xem Ngay
                </span>
              </button>
            </Link>
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
              className={`w-full mt-2 py-2 rounded-lg text-white font-semibold transition-colors ${
                isFavorite
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } ${isFavoriteLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isFavoriteLoading ? (
                "Loading..."
              ) : (
                <>
                  <i
                    className={`bx ${
                      isFavorite ? "bx-heart" : "bxs-heart"
                    } mr-2`}
                  ></i>
                  {isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                </>
              )}
            </button>
            {favoriteError && (
              <p className="text-red-500 mt-2 text-center">{favoriteError}</p>
            )}
            <div className="mt-4">
              {isLoggedIn ? (
                <>
                  {hasRated ? (
                    <div className="text-white text-center mb-4">
                      Bạn đã đánh giá phim này: {rating} sao{" "}
                      {comment && (
                        <>
                          - "{comment}"
                          <button
                            onClick={() => setHasRated(false)}
                            className="ml-2 text-indigo-500 hover:underline"
                          >
                            Sửa đánh giá
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    !submitted && (
                      <div className="flex flex-col items-center">
                        <div className="flex justify-center space-x-2 mb-4">
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
                                  className="bx bxs-star cursor-pointer text-3xl transition-colors duration-200"
                                  style={{
                                    color:
                                      ratingValue <= (hover || rating)
                                        ? "#ffc107"
                                        : "#e4e5e9",
                                  }}
                                  onMouseEnter={() => setHover(ratingValue)}
                                  onMouseLeave={() => setHover(null)}
                                ></i>
                              </label>
                            );
                          })}
                        </div>
                        <form onSubmit={handleSubmit} className="w-full max-w-md">
                          <textarea
                            className="w-full h-24 p-2 bg-gray-800 text-white rounded-lg resize-none focus:ring-2 focus:ring-indigo-600"
                            placeholder="Describe your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></textarea>
                          <button
                            type="submit"
                            className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Post
                          </button>
                        </form>
                      </div>
                    )
                  )}
                  {submitted && (
                    <div className="text-white text-center mb-4">
                      Thanks for your feedback!
                    </div>
                  )}
                </>
              ) : (
                <div className="text-white text-center mt-4">
                  Please{" "}
                  <Link to="/login" className="text-indigo-500 hover:underline">
                    log in
                  </Link>{" "}
                  to rate this film.
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:pl-12">
            <div className="relative -top-72">
              <h1 className="text-4xl text-white font-bold font-[Montserrat]">
                {film.movie.origin_name}
              </h1>
              <h1 className="text-xl text-gray-300 font-light mt-4">
                {film.movie.name}
              </h1>
              <h5 className="text-2xl text-white mt-2">({film.movie.year})</h5>
              <h4 className="text-lg text-white mt-2">
                {film.movie.time}{" "}
                <span className="bg-yellow-500 text-black px-2 py-1 rounded ml-10">
                  IMDB
                </span>{" "}
                <i className="bx bxs-star"></i>{" "}
                {film.movie.tmdb.vote_average === 0
                  ? "Chưa có đánh giá"
                  : film.movie.tmdb.vote_average}
              </h4>
              <div className="flex justify-between">
                <h3 className="text-lg text-white mt-2 mr-4">
                  <span className="">Đạo diễn:</span> {film.movie.director[0]}
                </h3>
                <h3 className="text-lg text-white mt-2 mr-4">
                  <span className="">Diễn viên:</span>{" "}
                  {film.movie.actor[0] + ", " + film.movie.actor[1] + "..."}
                </h3>
              </div>
            </div>
            <div className="relative -top-60">
              <h4 className="text-xl text-white mt-2">{film.movie.genre}</h4>
              <p className="text-base text-gray-300 mt-20">{film.movie?.content}</p>
              <div className="mt-8">
                <span className="text-xl text-white">Trailer:</span>
                <iframe
                  title="Movie Trailer"
                  className="w-full h-56 sm:w-4/5 sm:h-[420px] mt-4"
                  src={`https://youtube.com/embed/${trailerId}`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
            {/* Phần hiển thị danh sách đánh giá và bình luận */}
            {film.movie.ratings && film.movie.ratings.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl text-white font-bold mb-4">
                  Đánh giá và Bình luận
                </h2>
                {film.movie.ratings.map((rating, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 p-4 rounded-lg mb-4 text-white relative"
                  >
                    <p>
                      <strong>Tên người dùng:</strong>{" "}
                      {rating.displayName || "Người dùng ẩn danh"}
                    </p>
                    <p>
                      <strong>Rating:</strong>{" "}
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className="bx bxs-star text-xl"
                          style={{
                            color: i < rating.rating ? "#ffc107" : "#e4e5e9",
                          }}
                        ></i>
                      ))}
                    </p>
                    {rating.comment && (
                      <p>
                        <strong>Bình luận:</strong> {rating.comment}
                      </p>
                    )}
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {new Date(rating.createdAt).toLocaleString()}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRating(rating.userId)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <i className="bx bx-trash"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Detail;