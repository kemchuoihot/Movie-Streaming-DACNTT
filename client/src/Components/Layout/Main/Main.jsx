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
  const [actionMovies, setActionMovies] = useState([]); // Thêm state cho phim hành động
  const historyScrollRef = useRef(null);

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

  const fetchHistory = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/movies/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(response.data || []);
    } catch (err) {
      console.error("Error fetching watch history:", err);
      setError("Không thể tải lịch sử xem phim.");
    }
  };

  const fetchFavorites = async (token) => {
    try {
      const response = await axios.get("http://localhost:5000/api/movies/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // Fetch phim hành động
  useEffect(() => {
    const fetchActionMovies = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/movies/category/Hành Động", {
          params: { limit: 10 },
        });
        console.log("API Response for Hành Động:", response.data); // Debug log
        setActionMovies(response.data.data.items || []);
      } catch (error) {
        console.error("Error fetching Hành Động movies:", error);
        setActionMovies([]);
      }
    };

    fetchActionMovies();
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
    const totalMins = typeof duration === "number" ? duration : parseDuration(duration);
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
      const minutes = time.includes("m") ? parseInt(time.split("h")[1].split("m")[0]) || 0 : 0;
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
      <SkeletonTheme baseColor="#151d25" highlightColor="#525252">
        <div className="relative h-[600px] md:h-[800px]">
          <div className="absolute left-0 w-full h-full bg-gradient-to-r from-gray-950 bg-gray-950 bg-opacity-60 flex items-center justify-between lg:px-40 space-y-4">
            <div className="relative w-1/2 ml-10 lg:ml-0">
              <Skeleton className="mb-4 !w-[180px] !h-[30px] md:!w-[300px] md:!h-[40px]" />
              <Skeleton className="mb-4 !w-[100px] !h-[20px] md:!w-[200px] md:!h-[30px]" />
              <Skeleton count={3} className="mb-4" />
              <Skeleton className="mb-5 !w-[60px] !h-[15px] md:!w-[100px] md:!h-[20px]" />
              <Skeleton
                width={150}
                height={50}
                className="rounded-lg !w-[100px] !h-[30px] md:!w-[150px] md:!h-[50px]"
              />
            </div>
            <div className="relative w-1/2 mx-auto flex justify-center">
              <Skeleton
                className="rounded-lg mx-auto !h-[250px] !w-[150px] md:!h-[400px] md:!w-[300px] lg:!h-[530px] lg:!w-[400px]"
              />
            </div>
          </div>
        </div>
      </SkeletonTheme>
    );
  }

  if (error) {
    return (
      <div className="bg-[#06121e] h-screen text-white flex items-center justify-center">
        Error: {error}
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
      {user && history.length > 0 && (
        <div className="bg-[#0e1d2e] h-auto sm:p-10 relative">
          <div className="relative sm:rounded-lg sm:px-5 container max-w-screen-xl mx-auto">
            <div className="flex justify-between pt-5">
              <div className="inline-block">
                <h1 className="text-lg md:text-2xl font-bold font-[Montserrat] sm:ml-5 relative bg-gradient-to-br from-[#ff8a00] to-[#ff2070] inline-block text-transparent bg-clip-text animate-gradient">
                  TIẾP TỤC XEM:
                </h1>
                <div className="w-full h-[1px] text-transparent bg-gradient-to-br from-[#ff8a00] to-[#ff2070] sm:ml-5"></div>
              </div>
            </div>
            <button
              onClick={historyScrollLeft}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:scale-110 transition-transform duration-300 absolute -left-10 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10"
            >
              <i className="bx bx-chevron-left text-2xl"></i>
            </button>
            <div
              ref={historyScrollRef}
              className="overflow-x-auto whitespace-nowrap py-4 no-scrollbar snap-mandatory snap-x"
            >
              {history.map((entry, index) => (
                <Link key={entry.slug} to={`/watch/${entry.slug}?t=${entry.stoppedAt}`}>
                  <div className="inline-block p-2 snap-start">
                    <div className="relative rounded-lg shadow-lg group" style={{ willChange: "transform, opacity" }}>
                      <LazyLoadImage
                        effect="blur"
                        src={entry.posterUrl}
                        alt={entry.name}
                        className="w-full h-80 md:w-[200px] md:h-80 object-cover rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105 backface-visibility-hidden"
                      />
                      {favorites.includes(entry.slug) && (
                        <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                          <i className="bx bxs-heart"></i>
                        </span>
                      )}
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        HD
                      </span>
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 rounded-lg">
                        <button className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors">
                          <i className="bx bx-play text-2xl"></i>
                        </button>
                        <h3 className="text-white text-sm font-medium text-center mt-2">{entry.name}</h3>
                        <p className="text-gray-300 text-xs mt-1">
                          Đã xem: {Math.round(getProgressPercentage(entry.stoppedAt, entry.duration))}%
                        </p>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full px-2">
                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(entry.stoppedAt, entry.duration)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="sm:hidden block">
                        <h1 className="text-2xl font-bold font-[Montserrat] italic bg-gradient-to-br from-[#fecf59] to-[#fff1cc] inline-block text-transparent bg-clip-text">
                          {index + 1}
                        </h1>
                        <h1 className="max-w-40 text-xl font-[Montserrat] italic text-ellipsis overflow-hidden whitespace-nowrap font-bold inline-block text-white relative ml-1 top-2">
                          {entry.name}
                        </h1>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <button
              onClick={historyScrollRight}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:scale-110 transition-transform duration-300 absolute -right-10 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10"
            >
              <i className="bx bx-chevron-right text-2xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Section Phim Mới Cập Nhật */}
      {data.length > 0 && (
        <Section
          title="PHIM MỚI CẬP NHẬT:"
          movies={data.slice(0, 10)}
          link="/category/all/1"
          favorites={favorites}
        />
      )}

      {/* Section Phim Hành Động */}
      {actionMovies.length > 0 && (
        <Section
          title="PHIM HÀNH ĐỘNG:"
          movies={actionMovies} // Sử dụng state thay vì Promise
          link="/category/Hành Động/1"
          favorites={favorites}
        />
      )}
    </>
  );
};

export default Main;