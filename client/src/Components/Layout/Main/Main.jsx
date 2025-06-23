import React, { useState, useEffect, useRef } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { fetchDataFromAPI, fetchMovieDetails } from "../../../api/api.js";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Slide from "./Slide.jsx";
import Section from "../Section/Section.jsx";
import axios from "axios";
import { auth } from "../../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";

const Main = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [highlightMovies, setHighlightMovies] = useState([]);
  const [error, setError] = useState(null);
  const [slug, setSlug] = useState(null);
  const [movie, setMovie] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [dramaMovies, setDramaMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [psychologicalMovies, setPsychologicalMovies] = useState([]);
  const historyScrollRef = useRef(null);
  const [topViewedMovies, setTopViewedMovies] = useState([]);
  const [topRatedMovie, setTopRatedMovie] = useState(null);

  // New state for recommendations
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Recommendation algorithm
  const generateRecommendations = async (
    userHistory,
    userFavorites,
    allMovies
  ) => {
    try {
      setLoadingRecommendations(true);

      // Get user's preferred genres from history and favorites
      const watchedMovies = [
        ...userHistory,
        ...userFavorites.map((slug) => ({ slug })),
      ];
      const genrePreferences = {};
      const countryPreferences = {};
      const yearPreferences = {};

      // Analyze user preferences
      for (const item of watchedMovies) {
        try {
          const movieDetails = await fetchMovieDetails(item.slug);
          if (movieDetails && movieDetails.movie) {
            const movie = movieDetails.movie;

            // Count genres
            if (movie.category) {
              movie.category.forEach((cat) => {
                genrePreferences[cat.name] =
                  (genrePreferences[cat.name] || 0) + 1;
              });
            }

            // Count countries
            if (movie.country) {
              movie.country.forEach((country) => {
                countryPreferences[country.name] =
                  (countryPreferences[country.name] || 0) + 1;
              });
            }

            // Count years (prefer recent movies)
            if (movie.year) {
              const yearRange = Math.floor(movie.year / 5) * 5; // Group by 5-year ranges
              yearPreferences[yearRange] =
                (yearPreferences[yearRange] || 0) + 1;
            }
          }
        } catch (err) {
          console.error(`Error fetching details for ${item.slug}:`, err);
        }
      }

      // Get top preferences
      const topGenres = Object.entries(genrePreferences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      const topCountries = Object.entries(countryPreferences)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 2)
        .map(([country]) => country);

      // Filter movies based on preferences
      const watchedSlugs = new Set([
        ...userHistory.map((h) => h.slug),
        ...userFavorites,
      ]);
      const candidates = allMovies.filter(
        (movie) => !watchedSlugs.has(movie.slug)
      );

      // Score movies based on preferences
      const scoredMovies = await Promise.all(
        candidates.slice(0, 50).map(async (movie) => {
          // Limit to first 50 for performance
          try {
            const details = await fetchMovieDetails(movie.slug);
            if (!details || !details.movie) return null;

            const movieData = details.movie;
            let score = 0;

            // Genre matching (highest weight)
            if (movieData.category) {
              const movieGenres = movieData.category.map((cat) => cat.name);
              const genreMatches = movieGenres.filter((genre) =>
                topGenres.includes(genre)
              );
              score += genreMatches.length * 3;
            }

            // Country matching
            if (movieData.country) {
              const movieCountries = movieData.country.map(
                (country) => country.name
              );
              const countryMatches = movieCountries.filter((country) =>
                topCountries.includes(country)
              );
              score += countryMatches.length * 2;
            }

            // Prefer newer movies
            if (movieData.year) {
              const currentYear = new Date().getFullYear();
              const yearDiff = currentYear - movieData.year;
              if (yearDiff <= 3) score += 2;
              else if (yearDiff <= 5) score += 1;
            }

            // Boost high-quality movies
            if (
              movieData.quality &&
              (movieData.quality.includes("HD") ||
                movieData.quality.includes("FHD"))
            ) {
              score += 1;
            }

            return {
              ...movie,
              score,
              details: movieData,
            };
          } catch (err) {
            return null;
          }
        })
      );

      // Filter out null results and sort by score
      const validMovies = scoredMovies
        .filter((movie) => movie !== null && movie.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setRecommendedMovies(validMovies);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setRecommendedMovies([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem("authToken", token);
          setUser(currentUser);
          await fetchHistory(token);
          await fetchFavorites(token);
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Generate recommendations when user data is loaded
  useEffect(() => {
    if (user && history.length > 0 && data.length > 0) {
      generateRecommendations(history, favorites, data);
    }
  }, [user, history, favorites, data]);

  const fetchHistory = async (token) => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(response.data || []);
    } catch (err) {
      console.error("Error fetching watch history:", err);
      setError("Không thể tải lịch sử xem phim.");
    }
  };

  const fetchFavorites = async (token) => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/favorites`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorites(response.data.map((item) => item.slug) || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setError("Không thể tải danh sách yêu thích.");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchDataFromAPI();
        if (response && response.items && isMounted) {
          const movies = response.items;
          setData(movies);
          const highlight = movies.slice(0, 3);
          const detailedMovies = await Promise.all(
            highlight.map(async (movie) => {
              const details = await fetchMovieDetails(movie.slug);
              return details.movie;
            })
          );
          setHighlightMovies(detailedMovies);
          if (movies.length > 0) {
            setSlug(movies[0].slug);
          }
        } else {
          throw new Error("No items found in response");
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
          console.error("Error fetching data:", error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchActionMovies = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/category/Hành Động`,
          {
            params: { limit: 10 },
          }
        );
        setActionMovies(response.data.data.items || []);
      } catch (error) {
        console.error("Error fetching Hành Động movies:", error);
        setActionMovies([]);
      }
    };
    fetchActionMovies();
  }, []);

  useEffect(() => {
    const fetchDramaMovies = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/category/Chính Kịch`,
          {
            params: { limit: 10 },
          }
        );
        setDramaMovies(response.data.data.items || []);
      } catch (error) {
        console.error("Error fetching Chính Kịch movies:", error);
        setDramaMovies([]);
      }
    };
    fetchDramaMovies();
  }, []);

  useEffect(() => {
    const fetchPsychologicalMovies = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/category/Tâm Lý`,
          {
            params: { limit: 10 },
          }
        );
        setPsychologicalMovies(response.data.data.items || []);
      } catch (error) {
        console.error("Error fetching Tâm Lý movies:", error);
        setPsychologicalMovies([]);
      }
    };
    fetchPsychologicalMovies();
  }, []);

  useEffect(() => {
    const fetchTopViewedMovies = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/top-viewed`
        );
        setTopViewedMovies(response.data.items || []);
        console.log("Top Viewed Movies:", response.data.items);
      } catch (error) {
        console.error(
          "Lỗi khi lấy top phim xem nhiều:",
          error.response?.data || error.message
        );
      }
    };
    fetchTopViewedMovies();
  }, []);

  useEffect(() => {
    const fetchTopRatedMovie = async () => {
      try {
        const response = await axios.get(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/top-rated`
        );
        setTopRatedMovie(response.data.movie);
        console.log("Top Rated Movie:", response.data.movie);
      } catch (error) {
        console.error(
          "Lỗi khi lấy phim đánh giá cao nhất:",
          error.response?.data || error.message
        );
      }
    };
    fetchTopRatedMovie();
  }, []);

  useEffect(() => {
    if (highlightMovies.length > 0) {
      const preloadImages = () => {
        highlightMovies.forEach((movie) => {
          const thumbImg = new Image();
          thumbImg.src = movie.thumb_url;
          const posterImg = new Image();
          posterImg.src = movie.poster_url;
        });
      };
      preloadImages();
    }
  }, [highlightMovies]);

  useEffect(() => {
    if (!slug) return;
    const getMovieDetails = async () => {
      try {
        const data = await fetchMovieDetails(slug);
        if (data && data.movie) {
          setMovie(data);
        } else {
          throw new Error("No movie details found");
        }
      } catch (error) {
        setError(error.message);
        console.error("Error fetching movie details:", error.message);
      }
    };
    getMovieDetails();
  }, [slug]);

  const historyScrollLeft = () => {
    historyScrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const historyScrollRight = () => {
    historyScrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  const getProgressPercentage = (stoppedAt, duration) => {
    if (!stoppedAt || !duration) return 0;
    const totalMins =
      typeof duration === "number" ? duration : parseDuration(duration);
    return Math.min((stoppedAt / totalMins) * 100, 100);
  };

  const parseDuration = (time) => {
    if (!time) return 0;
    if (typeof time === "number") return time;
    const minuteMatch = time.match(/^(\d+)\s*phút$/i);
    if (minuteMatch) {
      return parseInt(minuteMatch[1], 10) || 0;
    }
    if (time.includes("h")) {
      const hours = parseInt(time.split("h")[0]) || 0;
      const minutes = time.includes("m")
        ? parseInt(time.split("h")[1].split("m")[0]) || 0
        : 0;
      return hours * 60 + minutes;
    }
    if (time.includes("tập")) {
      const episodes = parseInt(time.split("tập")[0]) || 1;
      return episodes * 45;
    }
    return 0;
  };

  if (loading) {
    return (
      <SkeletonTheme baseColor="#1a1a2e" highlightColor="#3d4466">
        <div className="relative h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute left-0 w-full h-full bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center justify-between px-4 lg:px-40">
            <div className="relative w-full lg:w-1/2 space-y-4">
              <Skeleton className="!w-3/4 !h-8 md:!h-12 rounded-xl" />
              <Skeleton className="!w-1/2 !h-6 md:!h-8 rounded-xl" />
              <Skeleton count={3} className="!h-4 md:!h-6 rounded-xl" />
              <Skeleton className="!w-1/3 !h-4 md:!h-6 rounded-xl" />
              <Skeleton className="!w-32 !h-12 md:!w-40 md:!h-14 rounded-2xl" />
            </div>
            <div className="hidden lg:block relative w-1/2 flex justify-end">
              <Skeleton className="!w-80 !h-[500px] rounded-2xl" />
            </div>
          </div>
        </div>
      </SkeletonTheme>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-900 h-screen text-white flex items-center justify-center">
        <div className="text-center p-8 bg-white/10 backdrop-blur rounded-2xl border border-red-500/30">
          <i className="bx bx-error text-6xl text-red-400 mb-4"></i>
          <h2 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h2>
          <p className="text-red-300">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Slide
        movies={highlightMovies}
        showFullContent={showFullContent}
        toggleContent={toggleContent}
      />

      {/* Continue Watching Section */}
      {user && history.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 py-8 lg:py-16">
          <div className="container max-w-screen-xl mx-auto  px-4 sm:px-6 lg:px-8 relative">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-[Montserrat] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center">
                <i className="bx bx-history mr-3 text-purple-400"></i>
                TIẾP TỤC XEM
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"></div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={historyScrollLeft}
              className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <i className="bx bx-chevron-left text-2xl"></i>
            </button>

            <div
              ref={historyScrollRef}
              className="overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex space-x-4 pb-4">
                {history.map((entry, index) => (
                  <Link
                    key={entry.slug}
                    to={`/watch/${entry.slug}?t=${entry.stoppedAt}`}
                    className="flex-shrink-0 group"
                  >
                    <div className="relative bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 w-48 sm:w-56">
                      <div className="relative">
                        <LazyLoadImage
                          effect="blur"
                          src={entry.posterUrl}
                          alt={entry.name}
                          className="w-full h-64 sm:h-72 object-cover rounded-xl"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button className="bg-white/90 backdrop-blur text-black rounded-full p-4 hover:bg-white transition-colors shadow-lg">
                            <i className="bx bx-play text-2xl"></i>
                          </button>
                        </div>

                        {/* Badges */}
                        {favorites.includes(entry.slug) && (
                          <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            <i className="bx bxs-heart"></i>
                          </span>
                        )}

                        {/* Progress Bar */}
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden backdrop-blur">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${getProgressPercentage(
                                  entry.stoppedAt,
                                  entry.duration
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Movie Info */}
                      <div className="mt-4">
                        <h3 className="text-white font-semibold text-sm sm:text-base truncate group-hover:text-purple-400 transition-colors">
                          {entry.name}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                          Đã xem:{" "}
                          {Math.round(
                            getProgressPercentage(
                              entry.stoppedAt,
                              entry.duration
                            )
                          )}
                          %
                        </p>
                      </div>

                      {/* Mobile Index */}
                      <div className="lg:hidden absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={historyScrollRight}
              className="hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <i className="bx bx-chevron-right text-2xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {user && recommendedMovies.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 py-8 lg:py-16">
          <div className="max-w-screen-xl mx-auto">
            <Section
              title="ĐỀ XUẤT CHO BẠN"
              subtitle="Dựa trên sở thích và lịch sử xem phim của bạn"
              movies={recommendedMovies}
              link="/"
              favorites={favorites}
              layout="horizontal"
            />
          </div>
        </div>
      )}
      {user &&
        !loadingRecommendations &&
        recommendedMovies.length === 0 &&
        history.length > 0 && (
          <div className="text-center py-12">
            <i className="bx bx-movie-play text-6xl text-gray-500 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Đang chuẩn bị đề xuất cho bạn
            </h3>
            <p className="text-gray-400">
              Hãy xem thêm một vài bộ phim để chúng tôi hiểu rõ sở thích của bạn
              hơn!
            </p>
          </div>
        )}

      {/* Top Movies Section */}
      <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 py-12 lg:py-20">
        <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
            {/* Top Viewed Movies */}
            <section className="bg-white/10 backdrop-blur rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-3 rounded-2xl mr-4">
                  <i className="bx bx-trending-up text-2xl text-white"></i>
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                    Thịnh Hành Nhất
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Phim được xem nhiều nhất tuần này
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {topViewedMovies.slice(0, 5).map((movie, index) => (
                  <Link
                    key={movie.slug}
                    to={`/detail/${movie.slug}`}
                    className="group flex items-center bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 hover:bg-white/10 hover:border-red-400/50 transition-all duration-300"
                  >
                    <div className="relative flex-shrink-0 mr-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-300 to-gray-400 text-black"
                            : index === 2
                            ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white"
                            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div className="w-14 h-20 flex-shrink-0 mr-4">
                      <LazyLoadImage
                        effect="blur"
                        src={movie.poster_url || movie.thumb_url}
                        alt={movie.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm lg:text-base truncate group-hover:text-red-400 transition-colors">
                        {movie.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">{movie.year}</p>
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      {index === 0 && (
                        <div className="flex items-center text-red-400">
                          <i className="bx bx-trending-up text-xl mr-1"></i>
                          <span className="text-xs font-semibold">HOT</span>
                        </div>
                      )}
                      {index === 1 && (
                        <i className="bx bx-up-arrow-alt text-xl text-green-400"></i>
                      )}
                      {index === 2 && (
                        <i className="bx bx-up-arrow-alt text-xl text-blue-400"></i>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Rated Movie */}
            <section className="bg-white/10 backdrop-blur rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/20">
              <div className="flex items-center mb-8">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-2xl mr-4">
                  <i className="bx bxs-star text-2xl text-black"></i>
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    Đánh Giá Cao Nhất
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Phim được yêu thích nhất
                  </p>
                </div>
              </div>

              {topRatedMovie && (
                <Link
                  to={`/detail/${topRatedMovie.slug}`}
                  className="group block bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-yellow-400/50 transition-all duration-300"
                >
                  <div className="relative mx-auto w-48 sm:w-56 lg:w-64">
                    <LazyLoadImage
                      effect="blur"
                      src={topRatedMovie.poster_url || topRatedMovie.thumb_url}
                      alt={topRatedMovie.name}
                      className="w-full aspect-[2/3] object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-white/90 backdrop-blur text-black rounded-full p-4 hover:bg-white transition-colors shadow-lg">
                        <i className="bx bx-play text-2xl"></i>
                      </button>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
                      <i className="bx bxs-star mr-1"></i>
                      {topRatedMovie.rating?.toFixed(1)}
                    </div>

                    {/* Crown */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                      👑 #1
                    </div>
                  </div>

                  <div className="text-center mt-6">
                    <h3 className="text-white text-lg lg:text-xl font-bold group-hover:text-yellow-400 transition-colors">
                      {topRatedMovie.name}
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                      Năm: {topRatedMovie.year}
                    </p>
                  </div>
                </Link>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Movie Categories */}
      {actionMovies.length > 0 && (
        <Section
          title="PHIM HÀNH ĐỘNG"
          movies={actionMovies}
          link="/category/Hành Động/1"
          favorites={favorites}
          layout="vertical"
        />
      )}

      {dramaMovies.length > 0 && (
        <Section
          title="PHIM CHÍNH KỊCH"
          movies={dramaMovies}
          link="/category/Chính Kịch/1"
          favorites={favorites}
          layout="horizontal"
        />
      )}

      {psychologicalMovies.length > 0 && (
        <Section
          title="PHIM TÂM LÝ"
          movies={psychologicalMovies}
          link="/category/Tâm Lý/1"
          favorites={favorites}
          layout="vertical"
        />
      )}
    </>
  );
};

export default Main;
