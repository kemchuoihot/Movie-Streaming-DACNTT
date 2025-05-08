import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import { fetchMovieDetails } from "../../api/api";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Footer from "../Footer/Footer";
import { auth } from "../Login/Firebase"; // Import Firebase auth
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "../Layout/Navbar/NavBar";

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

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe(); // Cleanup
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn số sao!");
      return;
    }
    // Lưu đánh giá (tạm thời console.log, có thể gửi API sau)
    console.log("Rating:", rating, "Comment:", comment);
    setSubmitted(true);
    setComment("");
    setRating(0);
    // Reset sau 3 giây
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (!film) {
    return <div className="h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <>
      <Navbar/>
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
            {/* Phần Rating */}
            <div className="mt-4">
              {isLoggedIn ? (
                <>
                  {submitted && (
                    <div className="text-white text-center mb-4">
                      Thanks for your feedback!
                    </div>
                  )}
                  {!submitted && (
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
                          className="w-full h-24 p-2 bg-gray-800 text-white rounded-lg resize-none"
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
                  )}
                </>
              ) : (
                <div className="text-white text-center mt-4">
                  Please{' '}
                  <Link to="/login" className="text-indigo-500 hover:underline">
                    log in
                  </Link>{' '}
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
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Detail;