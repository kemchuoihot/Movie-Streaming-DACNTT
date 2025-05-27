import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import Hls from "hls.js";
import { fetchMovieDetails } from "../../api/api";
import "boxicons/css/boxicons.min.css";
import Footer from "../Footer/Footer";
import NavBar from "../Layout/Navbar/NavBar";
import axios from "axios";
import { toast } from "react-toastify";
import { auth } from "../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";

const Watch = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [film, setFilm] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 là auto
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  // Volume and Mute States
  const [volume, setVolume] = useState(1); // 0 (mute) to 1 (max volume)
  const [isMuted, setIsMuted] = useState(false); // True if volume is 0
  const [previousVolume, setPreviousVolume] = useState(1); // To restore volume after unmuting

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  // Xác thực người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem("authToken", token);
          setUser(currentUser);
          await fetchFilm();
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          navigate("/signin");
        }
      } else {
        setUser(null);
        setError("Vui lòng đăng nhập để xem phim.");
        navigate("/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchFilm = async () => {
    try {
      const filmData = await fetchMovieDetails(slug);
      console.log("Film data:", filmData);
      setFilm(filmData);
    } catch (error) {
      console.error("Failed to fetch film:", error);
      setError("Không thể tải thông tin phim.");
      toast.error("Không thể tải thông tin phim.");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tua video đến thời gian dừng và lưu lịch sử xem phim
  useEffect(() => {
    if (film?.movie?.video_url && videoRef.current) {
      const video = videoRef.current;
      const videoSrc = film.movie.video_url;

      video.volume = volume;
      video.muted = isMuted;

      // Tua video đến thời gian dừng từ query param
      const query = new URLSearchParams(location.search);
      const startTime = parseFloat(query.get("t")) || 0;
      if (startTime > 0) {
        video.currentTime = startTime * 60; // Chuyển phút thành giây
      }

      const setupHls = (src) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          setHlsInstance(hls);
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setQualityLevels(hls.levels);
            video.play().catch((error) => console.error("Auto-play failed:", error));
            setIsPlaying(true);
          });
          hls.on(Hls.Events.ERROR, (event, data) => console.error("HLS error:", data));
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          video.addEventListener("loadedmetadata", () => {
            video.play().catch((error) => console.error("Auto-play failed:", error));
            setIsPlaying(true);
          });
        } else {
          console.error("HLS is not supported in this browser");
        }
      };

      setupHls(videoSrc);

      const updateTime = () => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration || 0);
        setProgress((videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100);
      };

      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", updateTime);

      const handleFullscreenChange = () => {
        setIsFullscreen(
          !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
          )
        );
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);

      // Lưu lịch sử xem phim tự động mỗi 10 giây
      const saveWatchHistory = async () => {
        if (!user || !film) return;
        const currentTime = videoRef.current?.currentTime || 0;
        const stoppedAt = Math.floor(currentTime / 60); // Chuyển giây thành phút
        try {
          const token = localStorage.getItem("authToken");
          await axios.post(
            "http://localhost:5000/api/movies/history",
            { slug, stoppedAt },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.error("Error saving watch history:", err);
          toast.error("Không thể lưu lịch sử xem phim.");
        }
      };

      const interval = setInterval(saveWatchHistory, 10000); // Lưu mỗi 10 giây

      // Lưu khi rời trang hoặc tạm dừng (để đảm bảo không bỏ sót)
      window.addEventListener("beforeunload", saveWatchHistory);

      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", updateTime);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
        document.removeEventListener("msfullscreenchange", handleFullscreenChange);
        window.removeEventListener("beforeunload", saveWatchHistory);
        clearInterval(interval); // Cleanup interval khi component unmount
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      };
    }
  }, [film, user, slug, location]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const newTime = Math.max(0, videoRef.current.currentTime - 10);
      videoRef.current.currentTime = newTime;
    }
  };

  const handleFastForward = () => {
    if (videoRef.current && duration > 0) {
      const newTime = Math.min(duration, videoRef.current.currentTime + 10);
      videoRef.current.currentTime = newTime;
    } else if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (!isMuted) {
        setPreviousVolume(volume);
        setVolume(0);
        videoRef.current.volume = 0;
        videoRef.current.muted = false;
        setIsMuted(true);
      } else {
        const newVolume = previousVolume > 0 ? previousVolume : 1;
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        videoRef.current.muted = false;
        setIsMuted(false);
        if (previousVolume === 0) setPreviousVolume(1);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = false;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleQualityOptions = () => {
    setShowQualityOptions(!showQualityOptions);
  };

  const setVideoLevel = (levelIndex) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
      setShowQualityOptions(false);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleProgressClick = (e) => {
    if (videoRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = videoContainerRef.current;
    if (videoContainer) {
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } else {
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
          videoContainer.mozRequestFullScreen();
        } else if (videoContainer.msRequestFullscreen) {
          videoContainer.msRequestFullscreen();
        }
      }
    }
  };

  if (error) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        {error}
      </div>
    );
  }

  if (!film) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        Đang tải...
      </div>
    );
  }

  let volumeIconClass = "bx-volume-full";
  if (isMuted || volume === 0) {
    volumeIconClass = "bx-volume-mute";
  } else if (volume <= 0.5) {
    volumeIconClass = "bx-volume-low";
  }

  return (
    <div>
      <NavBar />
      <div
        className="lg:h-screen bg-center h-96 relative bg-cover"
        style={{ backgroundImage: `url(${film.movie.thumb_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#06121e] bg-black bg-opacity-40"></div>
        {film.movie.video_url ? (
          <div
            ref={videoContainerRef}
            className={`absolute inset-0 mt-28 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%] flex flex-col justify-center items-center rounded-2xl ${
              isFullscreen ? "fullscreen" : ""
            }`}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              poster={film.movie.poster_url}
              onClick={togglePlay}
            />
            <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 text-white p-2 flex items-center">
              {/* Rewind Button */}
              <button onClick={handleRewind} className="mr-2" title="Tua lùi 10s">
                <i className="bx bx-rewind text-2xl"></i>
              </button>

              <button
                onClick={togglePlay}
                className="mr-2"
                title={isPlaying ? "Tạm dừng" : "Phát"}
              >
                <i className={`bx ${isPlaying ? "bx-pause" : "bx-play"} text-2xl`}></i>
              </button>

              {/* Fast Forward Button */}
              <button onClick={handleFastForward} className="mr-2" title="Tua tiến 10s">
                <i className="bx bx-fast-forward text-2xl"></i>
              </button>

              <button
                onClick={toggleMute}
                className="mr-1"
                title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
              >
                <i className={`bx ${volumeIconClass} text-2xl`}></i>
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-12 md:w-20 h-1.5 bg-gray-700 rounded-lg cursor-pointer mr-2 accent-red-500"
                title={`Âm lượng: ${Math.round(volume * 100)}%`}
              />

              <div className="text-sm mr-2 whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <div
                className="flex-grow cursor-pointer bg-gray-600 rounded-full h-2 overflow-hidden mx-2"
                onClick={handleProgressClick}
                title="Tua video"
              >
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {qualityLevels.length > 1 && (
                <div className="relative mr-2">
                  <button onClick={toggleQualityOptions} className="text-sm" title="Thay đổi chất lượng">
                    {currentLevel === -1
                      ? "Tự động"
                      : qualityLevels[currentLevel]?.height
                      ? `${qualityLevels[currentLevel]?.height}p`
                      : "SD"}{" "}
                    <i className="bx bx-chevron-down"></i>
                  </button>
                  {showQualityOptions && (
                    <div className="absolute bottom-full right-0 bg-black bg-opacity-80 p-2 rounded z-10 whitespace-nowrap">
                      <button
                        onClick={() => setVideoLevel(-1)}
                        className={`block w-full text-left text-sm hover:bg-gray-700 p-1 ${
                          currentLevel === -1 ? "font-bold" : ""
                        }`}
                      >
                        Tự động
                      </button>
                      {qualityLevels.map((level, index) => (
                        <button
                          key={index}
                          onClick={() => setVideoLevel(index)}
                          className={`block w-full text-left text-sm hover:bg-gray-700 p-1 ${
                            currentLevel === index ? "font-bold" : ""
                          }`}
                        >
                          {level.height ? `${level.height}p` : `Level ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                <i
                  className={`bx ${
                    isFullscreen ? "bx-exit-fullscreen" : "bx-fullscreen"
                  } text-2xl`}
                ></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 mt-20 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%] bg-gray-800 flex items-center justify-center text-white">
            Không có video
          </div>
        )}
      </div>
      <div className="bg-[#06121e] h-auto pb-10">
        <div className="container mx-auto max-w-screen-xl p-3">
          <div>
            <h1 className="text-3xl text-white font-bold font-[Montserrat] mt-10">
              {film.movie.name}
              {film.movie.quality && (
                <span className="bg-yellow-500 text-black rounded ml-5 text-2xl px-2 py-1">
                  {film.movie.quality}
                </span>
              )}
            </h1>
            <h1 className="text-xl text-gray-300 font-light my-2 block">
              {film.movie.origin_name}
              <h3 className="text-red-700 inline font-medium ml-2">
                ({film.movie.year})
              </h3>
            </h1>
            <h6 className="text-white border-2 p-1 inline text-sm rounded-lg border-red-600 mr-10">
              {film.movie.status === "ongoing" ? "Đang chiếu" : "Hoàn Thành"}
            </h6>
            <h3 className="text-white inline mr-10">{film.movie.time}</h3>
            <p
              className="text-white my-5"
              dangerouslySetInnerHTML={{ __html: film.movie.content }}
            ></p>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Đạo diễn: </span>
              {Array.isArray(film.movie.director)
                ? film.movie.director.join(", ")
                : film.movie.director}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Diễn viên: </span>
              {Array.isArray(film.movie.actor)
                ? film.movie.actor.slice(0, 4).join(", ") +
                  (film.movie.actor.length > 4 ? "..." : "")
                : film.movie.actor}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Thể loại: </span>
              {Array.isArray(film.movie.category)
                ? film.movie.category.map((c) => c.name).join(", ")
                : film.movie.genre || "N/A"}
            </h3>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Watch;