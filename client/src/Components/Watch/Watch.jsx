import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  const videoRef = useRef(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  // New states for improvements
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);

  // User authentication (giữ nguyên)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem("authToken", token);
          setUser(currentUser);
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          setUser(null);
          navigate("/signin", { state: { from: location } });
        }
      } else {
        setUser(null);
        setError("Vui lòng đăng nhập để xem phim.");
        navigate("/signin", { state: { from: location } });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate, location]);

  // Fetch film when user or slug changes (giữ nguyên)
  useEffect(() => {
    if (loading) return;
    if (user && slug) {
      fetchFilm();
    }
  }, [user, slug, location, navigate, loading]);

 
  useEffect(() => {
    const incrementView = async () => {
      try {
        const baseUrl =
          process.env.REACT_APP_BASE_URL || "http://localhost:5000";
        await axios.put(
          `${baseUrl}/api/movies/${slug}/view`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`, 
            },
          }
        );
        console.log("View count incremented for movie:", slug);
      } catch (error) {
        console.error("Lỗi khi tăng view:", error);
      }
    };

    if (slug) {
      incrementView();
    }
  }, [slug]);

  const fetchFilm = async () => {
    if (!slug) return;
    setFilm(null);
    setError("");
    try {
      const filmData = await fetchMovieDetails(slug);
      setFilm(filmData);
    } catch (error) {
      console.error("Failed to fetch film:", error);
      setError(
        "Không thể tải thông tin phim. Phim có thể không tồn tại hoặc đã bị xóa."
      );
      toast.error("Không thể tải thông tin phim.");
    }
  };

  // Enhanced video setup with controls timeout
  useEffect(() => {
    if (film?.movie?.video_url && videoRef.current && user) {
      const video = videoRef.current;
      const videoSrc = film.movie.video_url;

      video.volume = volume;
      video.muted = isMuted;

      const query = new URLSearchParams(location.search);
      const startTime = parseFloat(query.get("t")) || 0;

      const applyStartTime = () => {
        if (
          startTime > 0 &&
          video.duration &&
          video.currentTime < startTime * 60
        ) {
          if (startTime * 60 < video.duration) {
            video.currentTime = startTime * 60;
          }
        }
      };

      const setupHls = (src) => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
        if (Hls.isSupported()) {
          const hlsConfig = {
            maxBufferLength: 30,
          };
          const hls = new Hls(hlsConfig);
          setHlsInstance(hls);
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            setQualityLevels(hls.levels);
            setCurrentLevel(hls.autoLevelEnabled ? -1 : hls.currentLevel);
            applyStartTime();
            if (video.paused) {
              video
                .play()
                .catch((e) =>
                  console.error("Auto-play failed after manifest parsed:", e)
                );
            }
          });
          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            setCurrentLevel(data.level);
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("HLS error:", data.type, data.details, data.fatal);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error(
                    "Fatal network error encountered, trying to recover HLS."
                  );
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error(
                    "Fatal media error encountered, trying to recover HLS."
                  );
                  hls.recoverMediaError();
                  break;
                default:
                  console.error(
                    "Unrecoverable HLS error, destroying HLS instance."
                  );
                  hls.destroy();
                  setHlsInstance(null);
                  setError("Lỗi phát video. Vui lòng thử lại.");
                  break;
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
        } else {
          console.error("HLS is not supported in this browser");
          setError("Trình duyệt không hỗ trợ phát video này (HLS).");
        }
      };

      setupHls(videoSrc);

      const updateTime = () => {
        if (!videoRef.current || !isFinite(videoRef.current.duration)) return;
        setCurrentTime(videoRef.current.currentTime);
        setDuration(videoRef.current.duration);
        setProgress(
          (videoRef.current.currentTime / videoRef.current.duration) * 100
        );
      };

      const updateBuffered = () => {
        if (
          !videoRef.current ||
          !isFinite(videoRef.current.duration) ||
          videoRef.current.duration === 0
        ) {
          setBuffered(0);
          return;
        }
        const bufferedTimeRanges = videoRef.current.buffered;
        if (bufferedTimeRanges.length > 0) {
          const lastBufferedTime = bufferedTimeRanges.end(
            bufferedTimeRanges.length - 1
          );
          setBuffered((lastBufferedTime / videoRef.current.duration) * 100);
        } else {
          setBuffered(0);
        }
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        applyStartTime();
        if (video.paused && Hls.isSupported() && !hlsInstance?.media) {
        } else if (video.paused && !Hls.isSupported() && video.src) {
          video
            .play()
            .catch((e) =>
              console.error("Auto-play failed on loadedmetadata:", e)
            );
        }
      };

      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("progress", updateBuffered);
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("play", handlePlay);
      video.addEventListener("pause", handlePause);
      video.addEventListener("ended", handlePause);

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
      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);

      // Dòng 287-299: Fix URL construction
      const saveWatchHistory = async () => {
        if (
          !user ||
          !film ||
          !videoRef.current ||
          !isFinite(videoRef.current.currentTime)
        )
          return;
        const currentVideoTime = videoRef.current.currentTime;
        if (currentVideoTime === 0) return;

        const stoppedAt = Math.floor(currentVideoTime / 60);
        try {
          const token = localStorage.getItem("authToken");
          if (!token) return;

          // ✅ FIXED: Proper URL construction
          const baseUrl =
            process.env.REACT_APP_BASE_URL || "http://localhost:5000";
          await axios.post(
            `${baseUrl}/api/movies/history`,
            { slug, stoppedAt },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.warn("Could not save watch history:", err.message);
        }
      };

      const historyInterval = setInterval(saveWatchHistory, 10000);
      window.addEventListener("beforeunload", saveWatchHistory);

      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("progress", updateBuffered);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handlePause);
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "mozfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "msfullscreenchange",
          handleFullscreenChange
        );
        window.removeEventListener("beforeunload", saveWatchHistory);
        clearInterval(historyInterval);
        if (hlsInstance) {
          hlsInstance.destroy();
          setHlsInstance(null);
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute("src");
          videoRef.current.load();
        }
      };
    }
  }, [film, user, slug, location, navigate]);

  // Enhanced controls visibility with timeout
  const showControlsWithTimeout = () => {
    setShowControls(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
    const timeout = setTimeout(() => {
      if (isPlaying && !isFullscreen) {
        setShowControls(false);
      }
    }, 3000);
    setControlsTimeout(timeout);
  };

  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    }
  }, [isPlaying]);

  // New functions for enhanced features
  const toggleLights = () => {
    setIsLightsOff(!isLightsOff);
  };

  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPictureInPicture(true);
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error);
      toast.error("Trình duyệt không hỗ trợ Picture-in-Picture");
    }
  };

  // Existing functions (giữ nguyên tất cả)
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current
          .play()
          .catch((e) => console.error("Play error (togglePlay):", e));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime - 10
      );
    }
  };

  const handleFastForward = () => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = Math.min(
        duration,
        videoRef.current.currentTime + 10
      );
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      if (!isMuted) {
        setPreviousVolume(volume);
        setVolume(0);
        video.volume = 0;
        setIsMuted(true);
      } else {
        const newVolume = previousVolume > 0 ? previousVolume : 0.5;
        setVolume(newVolume);
        video.volume = newVolume;
        setIsMuted(false);
        if (previousVolume === 0) setPreviousVolume(0.5);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  const toggleQualityOptions = () => {
    setShowQualityOptions(!showQualityOptions);
    if (showSpeedOptions) setShowSpeedOptions(false);
  };

  const setVideoLevel = (levelIndex) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = levelIndex;
    }
    setCurrentLevel(levelIndex);
    setShowQualityOptions(false);
  };

  const toggleSpeedOptions = () => {
    setShowSpeedOptions(!showSpeedOptions);
    if (showQualityOptions) setShowQualityOptions(false);
  };

  const handleSetPlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSpeedOptions(false);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60)
      .toString()
      .padStart(2, "0");
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  };

  const handleProgressClick = (e) => {
    if (videoRef.current && duration > 0) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPositionInPixels = e.clientX - rect.left;
      const percentage = clickPositionInPixels / rect.width;
      videoRef.current.currentTime = percentage * duration;
    }
  };

  const toggleFullscreen = () => {
    const elem = videoContainerRef.current;
    if (!elem) return;

    if (
      !document.fullscreenElement &&
      !document.webkitFullscreenElement &&
      !document.mozFullScreenElement &&
      !document.msFullscreenElement
    ) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Loading state (giữ nguyên nhưng cải thiện giao diện)
  if (loading) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-600 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="mt-4 text-lg font-medium">Đang xác thực...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Error state (cải thiện giao diện)
  if (error && !film) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gradient-to-br  from-red-900/20 via-slate-900 to-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-red-500/30 max-w-md">
            <i className="bx bx-error-circle text-red-400 mb-4 text-6xl"></i>
            <h2 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h2>
            <p className="text-red-300 mb-6">{error}</p>
            {error.includes("đăng nhập") && (
              <button
                onClick={() =>
                  navigate("/signin", { state: { from: location } })
                }
                className="w-full mb-3 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white transition-all duration-300 font-medium"
              >
                Đăng nhập
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="w-full px-6 py-3 bg-white/10 backdrop-blur hover:bg-white/20 rounded-xl text-white transition-all duration-300 border border-white/20"
            >
              Về trang chủ
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Loading film state
  if (!film && !error) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-600 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="mt-4 text-lg font-medium">Đang tải thông tin phim...</p>
        </div>
        <Footer />
      </>
    );
  }

  let volumeIconClass = "bx-volume-full";
  if (isMuted || volume === 0) {
    volumeIconClass = "bx-volume-mute";
  } else if (volume <= 0.5) {
    volumeIconClass = "bx-volume-low";
  }

  const speedOptionsList = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      className={`min-h-screen flex flex-col transition-all duration-500  ${
        isLightsOff
          ? "bg-black"
          : "bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900"
      }`}
    >
      <div className={isLightsOff ? "opacity-30" : "opacity-100"}>
        <NavBar />
      </div>

      <main className="flex-grow">
        {film && (
          <>
            {/* Enhanced Video Section */}
            <div
              className={`relative ${
                isLightsOff
                  ? "bg-black"
                  : "bg-gradient-to-b from-slate-900/50 to-slate-900"
              }`}
            >
              <div className="pt-[var(--navbar-height,80px)] pb-8 md:pb-12">
                {film.movie.video_url ? (
                  <div
                    ref={videoContainerRef}
                    className={`group relative mx-auto w-[98%] sm:w-[95%] md:w-[90%] lg:w-[85%] aspect-video flex flex-col justify-center items-center rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-white/10 ${
                      isFullscreen
                        ? "fixed top-0 left-0 w-full h-full z-[5000] rounded-none !m-0 !max-h-full !max-w-full border-none"
                        : ""
                    }`}
                    onMouseMove={showControlsWithTimeout}
                    onMouseEnter={showControlsWithTimeout}
                  >
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      poster={film.movie.poster_url || film.movie.thumb_url}
                      onClick={togglePlay}
                      onDoubleClick={toggleFullscreen}
                      playsInline
                    />

                    {/* Enhanced Controls */}
                    <div
                      className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white p-3 sm:p-4 flex flex-col transition-all duration-300 ${
                        showControls || !isPlaying
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-full"
                      }`}
                    >
                      {/* Progress Bar */}
                      <div className="w-full px-2 mb-3">
                        <div
                          className="w-full cursor-pointer bg-white/20 rounded-full h-2 sm:h-2.5 group/progress overflow-hidden relative backdrop-blur"
                          onClick={handleProgressClick}
                          title="Tua video"
                        >
                          {/* Buffered progress */}
                          <div
                            className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-200"
                            style={{ width: `${buffered}%` }}
                          />
                          {/* Playback progress */}
                          <div
                            className="bg-gradient-to-r from-red-500 to-pink-500 h-full rounded-full relative transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform scale-0 group-hover/progress:scale-100 transition-transform duration-200" />
                          </div>
                        </div>
                      </div>

                      {/* Main Controls */}
                      <div className="w-full flex items-center justify-between px-2">
                        {/* Left Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleRewind}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title="Tua lùi 10s"
                          >
                            <i className="bx bx-rewind text-xl sm:text-2xl"></i>
                          </button>
                          <button
                            onClick={togglePlay}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title={isPlaying ? "Tạm dừng" : "Phát"}
                          >
                            <i
                              className={`bx ${
                                isPlaying ? "bx-pause" : "bx-play"
                              } text-2xl sm:text-3xl`}
                            ></i>
                          </button>
                          <button
                            onClick={handleFastForward}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title="Tua tiến 10s"
                          >
                            <i className="bx bx-fast-forward text-xl sm:text-2xl"></i>
                          </button>

                          {/* Volume Controls */}
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={toggleMute}
                              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                              title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
                            >
                              <i
                                className={`bx ${volumeIconClass} text-xl sm:text-2xl`}
                              ></i>
                            </button>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={volume}
                              onChange={handleVolumeChange}
                              className="w-16 sm:w-20 h-2 bg-white/20 rounded-lg cursor-pointer accent-red-500"
                              title={`Âm lượng: ${Math.round(volume * 100)}%`}
                            />
                          </div>

                          {/* Time Display */}
                          <div className="text-sm sm:text-base ml-3 font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>

                        {/* Right Controls */}
                        <div className="flex items-center gap-1">
                          {/* Lights Toggle */}
                          <button
                            onClick={toggleLights}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title={isLightsOff ? "Bật đèn" : "Tắt đèn"}
                          >
                            <i
                              className={`bx ${
                                isLightsOff ? "bx-bulb" : "bx-moon"
                              } text-xl`}
                            ></i>
                          </button>

                          {/* Picture in Picture */}
                          <button
                            onClick={togglePictureInPicture}
                            className="hidden sm:block p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title="Picture in Picture"
                          >
                            <i className="bx bx-dock-right text-xl"></i>
                          </button>

                          {/* Speed Control */}
                          <div className="relative">
                            <button
                              onClick={toggleSpeedOptions}
                              className="text-sm font-medium p-2 hover:bg-white/20 rounded transition-all duration-200"
                              title="Tốc độ phát"
                            >
                              {playbackRate === 1 ? "1x" : `${playbackRate}x`}
                              <i className="bx bxs-down-arrow text-xs ml-1"></i>
                            </button>
                            {showSpeedOptions && (
                              <div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-sm p-2 rounded-xl z-30 shadow-2xl border border-white/20">
                                {speedOptionsList.map((rate) => (
                                  <button
                                    key={rate}
                                    onClick={() => handleSetPlaybackRate(rate)}
                                    className={`block w-full text-left text-sm hover:bg-white/20 p-2 rounded transition-all duration-200 ${
                                      playbackRate === rate
                                        ? "bg-red-500/20 text-red-400 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {rate === 1 ? "Bình thường" : `${rate}x`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quality Control */}
                          {qualityLevels.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={toggleQualityOptions}
                                className="text-sm font-medium p-2 hover:bg-white/20 rounded transition-all duration-200"
                                title="Chất lượng"
                              >
                                {currentLevel === -1
                                  ? "Auto"
                                  : qualityLevels[currentLevel]?.height
                                  ? `${qualityLevels[currentLevel]?.height}p`
                                  : "SD"}
                                <i className="bx bxs-down-arrow text-xs ml-1"></i>
                              </button>
                              {showQualityOptions && (
                                <div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-sm p-2 rounded-xl z-30 shadow-2xl border border-white/20">
                                  <button
                                    onClick={() => setVideoLevel(-1)}
                                    className={`block w-full text-left text-sm hover:bg-white/20 p-2 rounded transition-all duration-200 ${
                                      currentLevel === -1
                                        ? "bg-red-500/20 text-red-400 font-bold"
                                        : ""
                                    }`}
                                  >
                                    Tự động
                                  </button>
                                  {qualityLevels.map((level, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setVideoLevel(index)}
                                      className={`block w-full text-left text-sm hover:bg-white/20 p-2 rounded transition-all duration-200 ${
                                        currentLevel === index
                                          ? "bg-red-500/20 text-red-400 font-bold"
                                          : ""
                                      }`}
                                    >
                                      {level.height
                                        ? `${level.height}p`
                                        : `Mức ${index + 1}`}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Fullscreen */}
                          <button
                            onClick={toggleFullscreen}
                            className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                            title={
                              isFullscreen
                                ? "Thoát toàn màn hình"
                                : "Toàn màn hình"
                            }
                          >
                            <i
                              className={`bx ${
                                isFullscreen
                                  ? "bx-exit-fullscreen"
                                  : "bx-fullscreen"
                              } text-xl`}
                            ></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-[98%] sm:w-[95%] md:w-[90%] lg:w-[85%] aspect-video flex flex-col items-center justify-center text-white rounded-2xl shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10">
                    <i className="bx bx-video-off text-gray-400 mb-4 text-6xl"></i>
                    <p className="text-xl font-medium">
                      Không có video để phát
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Phim này hiện chưa có nguồn phát video
                    </p>
                    {error && (
                      <p className="text-sm text-red-400 mt-2">{error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Movie Info Section */}
            <div
              className={`relative pb-12 transition-all duration-500 ${
                isLightsOff
                  ? "bg-black opacity-30"
                  : "bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900"
              }`}
            >
              <div className="container mx-auto max-w-screen-xl p-4 md:p-6">
                <div className="bg-white/10 backdrop-blur rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                  {/* Movie Title */}
                  <div className="mb-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl text-white font-bold font-[Montserrat] mb-3">
                      {film.movie.name}
                      {film.movie.quality && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl ml-3 text-sm sm:text-base px-3 py-1 font-medium">
                          {film.movie.quality}
                        </span>
                      )}
                    </h1>
                    <h2 className="text-lg sm:text-xl text-gray-300 font-light">
                      {film.movie.origin_name}
                      {film.movie.year && (
                        <span className="text-red-400 font-medium ml-3">
                          ({film.movie.year})
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Movie Metadata */}
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    {film.movie.status && (
                      <span className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                        {film.movie.status === "ongoing"
                          ? "Đang cập nhật"
                          : "Hoàn thành"}
                      </span>
                    )}
                    {film.movie.episode_current && (
                      <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {film.movie.episode_current}
                      </span>
                    )}
                    {film.movie.time && (
                      <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {film.movie.time}
                      </span>
                    )}
                  </div>

                  {/* Movie Description */}
                  {film.movie.content && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Nội dung phim
                      </h3>
                      <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                        <p
                          className="text-gray-300 text-base leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: film.movie.content,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Movie Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm sm:text-base">
                    {film.movie.director?.length > 0 && (
                      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                        <h4 className="text-cyan-400 font-semibold mb-2 flex items-center">
                          <i className="bx bx-user-circle mr-2 text-lg"></i>
                          Đạo diễn
                        </h4>
                        <p className="text-gray-300">
                          {Array.isArray(film.movie.director)
                            ? film.movie.director.join(", ")
                            : film.movie.director}
                        </p>
                      </div>
                    )}

                    {film.movie.actor?.length > 0 && (
                      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                        <h4 className="text-pink-400 font-semibold mb-2 flex items-center">
                          <i className="bx bx-group mr-2 text-lg"></i>
                          Diễn viên
                        </h4>
                        <p className="text-gray-300">
                          {Array.isArray(film.movie.actor)
                            ? film.movie.actor.slice(0, 6).join(", ") +
                              (film.movie.actor.length > 6 ? ", ..." : "")
                            : film.movie.actor}
                        </p>
                      </div>
                    )}

                    {film.movie.category?.length > 0 && (
                      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                        <h4 className="text-orange-400 font-semibold mb-2 flex items-center">
                          <i className="bx bx-category mr-2 text-lg"></i>
                          Thể loại
                        </h4>
                        <p className="text-gray-300">
                          {Array.isArray(film.movie.category)
                            ? film.movie.category.map((c) => c.name).join(", ")
                            : film.movie.category}
                        </p>
                      </div>
                    )}

                    {film.movie.country?.length > 0 && (
                      <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
                        <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                          <i className="bx bx-globe mr-2 text-lg"></i>
                          Quốc gia
                        </h4>
                        <p className="text-gray-300">
                          {Array.isArray(film.movie.country)
                            ? film.movie.country.map((c) => c.name).join(", ")
                            : film.movie.country}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <div className={isLightsOff ? "opacity-30" : "opacity-100"}>
        <Footer />
      </div>
    </div>
  );
};

export default Watch;
