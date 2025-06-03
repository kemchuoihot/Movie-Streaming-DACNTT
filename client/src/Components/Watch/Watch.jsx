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
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 là auto
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading
  const [error, setError] = useState("");

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef(null);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);

  // Xác thực người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Bắt đầu trạng thái loading
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
      setLoading(false); // Kết thúc trạng thái loading sau khi xác thực
    });
    return () => unsubscribe();
  }, [navigate, location]);

  // Fetch film khi user hoặc slug thay đổi
  useEffect(() => {
    if (loading) return; // Chờ xác thực xong
    if (user && slug) {
      fetchFilm();
    }
  }, [user, slug, location, navigate, loading]);

  const fetchFilm = async () => {
    if (!slug) return;
    setFilm(null); // Reset film data trước khi fetch mới, hiển thị loading
    setError(""); // Reset error
    try {
      const filmData = await fetchMovieDetails(slug);
      setFilm(filmData);
    } catch (error) {
      console.error("Failed to fetch film:", error);
      setError("Không thể tải thông tin phim. Phim có thể không tồn tại hoặc đã bị xóa.");
      toast.error("Không thể tải thông tin phim.");
    }
  };

  useEffect(() => {
    if (film?.movie?.video_url && videoRef.current && user) {
      const video = videoRef.current;
      const videoSrc = film.movie.video_url;

      video.volume = volume;
      video.muted = isMuted;
      video.playbackRate = playbackRate;

      const query = new URLSearchParams(location.search);
      const startTime = parseFloat(query.get("t")) || 0;

      const applyStartTime = () => {
        if (startTime > 0 && video.duration && video.currentTime < startTime * 60) {
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
              video.play().catch((e) => console.error("Auto-play failed after manifest parsed:", e));
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
                  console.error("Fatal network error encountered, trying to recover HLS.");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Fatal media error encountered, trying to recover HLS.");
                  hls.recoverMediaError();
                  break;
                default:
                  console.error("Unrecoverable HLS error, destroying HLS instance.");
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
        setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        applyStartTime();
        if (video.paused && Hls.isSupported() && !hlsInstance?.media) {
        } else if (video.paused && !Hls.isSupported() && video.src) {
          video.play().catch((e) => console.error("Auto-play failed on loadedmetadata:", e));
        }
      };

      video.addEventListener("timeupdate", updateTime);
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
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);

      const saveWatchHistory = async () => {
        if (!user || !film || !videoRef.current || !isFinite(videoRef.current.currentTime)) return;
        const currentVideoTime = videoRef.current.currentTime;
        if (currentVideoTime === 0) return;

        const stoppedAt = Math.floor(currentVideoTime / 60);
        try {
          const token = localStorage.getItem("authToken");
          if (!token) return;
          await axios.post(
            process.env.REACT_APP_API_URL || "http://localhost:5000/api/movies/history",
            { slug, stoppedAt },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (err) {
          console.warn("Could not save watch history:", err.message);
        }
      };

      const historyInterval = setInterval(saveWatchHistory, 30000);
      window.addEventListener("beforeunload", saveWatchHistory);

      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("ended", handlePause);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
        document.removeEventListener("msfullscreenchange", handleFullscreenChange);
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
  }, [film, user, slug, location, volume, isMuted, playbackRate, navigate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch((e) => console.error("Play error (togglePlay):", e));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (!isMuted) {
        setPreviousVolume(volume);
        setVolume(0);
        videoRef.current.volume = 0;
        setIsMuted(true);
      } else {
        const newVolume = previousVolume > 0 ? previousVolume : 0.5;
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
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

  if (loading) {
    // Hiển thị loading khi đang xác thực user
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
          <i className="bx bx-loader-alt bx-spin mb-4" style={{ fontSize: "3rem" }}></i>
          Đang xác thực...
        </div>
        <Footer />
      </>
    );
  }

  if (error && !film) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
          <i className="bx bx-error-circle text-red-500 mb-4" style={{ fontSize: "4rem" }}></i>
          <p className="text-xl">{error}</p>
          {error.includes("đăng nhập") && (
            <button
              onClick={() => navigate("/signin", { state: { from: location } })}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors text-lg"
            >
              Đăng nhập
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors"
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </>
    );
  }

  if (!film && !error) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
          <i className="bx bx-loader-alt bx-spin mb-4" style={{ fontSize: "3rem" }}></i>
          Đang tải thông tin phim...
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
    <div className="bg-[#06121e] min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow">
        {film && (
          <>
            <div
              className="bg-center bg-cover relative"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(6, 18, 30, 0.2), rgba(6, 18, 30, 1)), url(${film.movie.thumb_url})`,
                height: "auto",
                minHeight: "50vh",
              }}
            >
              <div className="pt-[var(--navbar-height,70px)] pb-8 md:pb-12">
                {film.movie.video_url ? (
                  <div
                    ref={videoContainerRef}
                    className={`group mt-5 relative mx-auto w-[98%] sm:w-[95%] md:w-[90%] lg:w-[85%] aspect-video flex flex-col justify-center items-center rounded-lg overflow-hidden shadow-2xl bg-black ${
                      isFullscreen ? "fixed top-0 left-0 w-full h-full z-[5000] rounded-none !m-0 !max-h-full !max-w-full" : ""
                    }`}
                  >
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      poster={film.movie.poster_url || film.movie.thumb_url}
                      onClick={togglePlay}
                      onDoubleClick={toggleFullscreen}
                      playsInline
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white p-1.5 sm:p-2 flex flex-col transition-opacity duration-300 opacity-0 group-hover:opacity-100 focus-within:opacity-100 group/controls-bar">
                      <div className="w-full px-1 sm:px-2 mb-1.5 sm:mb-2">
                        <div
                          className="w-full cursor-pointer bg-gray-500/70 rounded-full h-1.5 sm:h-2 md:h-2.5 group/progress overflow-hidden"
                          onClick={handleProgressClick}
                          title="Tua video"
                        >
                          <div
                            className="bg-red-500 h-full rounded-full relative transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-red-400 rounded-full transform scale-0 group-hover/progress:scale-100 transition-transform duration-150"></div>
                          </div>
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-between px-1 sm:px-2">
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <button onClick={handleRewind} className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full" title="Tua lùi 10s">
                            <i className="bx bx-rewind text-lg sm:text-xl md:text-2xl"></i>
                          </button>
                          <button onClick={togglePlay} className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full" title={isPlaying ? "Tạm dừng" : "Phát"}>
                            <i className={`bx ${isPlaying ? "bx-pause" : "bx-play"} text-xl sm:text-2xl md:text-3xl`}></i>
                          </button>
                          <button onClick={handleFastForward} className="p-1 sm:p-1.5 hover:bg-white/10 rounded-full" title="Tua tiến 10s">
                            <i className="bx bx-fast-forward text-lg sm:text-xl md:text-2xl"></i>
                          </button>
                          <button onClick={toggleMute} className="p-1 sm:p-1.5 ml-1 sm:ml-2 hover:bg-white/10 rounded-full" title={isMuted ? "Bật tiếng" : "Tắt tiếng"}>
                            <i className={`bx ${volumeIconClass} text-lg sm:text-xl md:text-2xl`}></i>
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-10 sm:w-12 md:w-20 h-1 sm:h-1.5 bg-gray-500/70 rounded-lg cursor-pointer ml-1 accent-red-500 align-middle"
                            title={`Âm lượng: ${Math.round(volume * 100)}%`}
                          />
                          <div className="text-xs sm:text-sm ml-1.5 sm:ml-2 whitespace-nowrap">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>
                        <div className="flex items-top gap-0.5 sm:gap-1">
                          <div className="relative">
                            <button onClick={toggleSpeedOptions} className="text-xs sm:text-sm font-semibold p-1 sm:p-1.5 hover:bg-white/10 rounded" title="Tốc độ phát">
                              {playbackRate === 1 ? "Tốc độ" : `${playbackRate}x`}{" "}
                              <i className="bx bx-xs bxs-down-arrow align-middle"></i>
                            </button>
                            {showSpeedOptions && (
                              <div className="absolute bottom-full mb-1 right-0 bg-black/80 backdrop-blur-sm p-1.5 rounded z-20 whitespace-nowrap shadow-lg">
                                {speedOptionsList.map((rate) => (
                                  <button
                                    key={rate}
                                    onClick={() => handleSetPlaybackRate(rate)}
                                    className={`block w-full text-left text-xs sm:text-sm hover:bg-white/20 p-1 sm:p-1.5 rounded ${
                                      playbackRate === rate ? "font-bold text-red-400" : ""
                                    }`}
                                  >
                                    {rate === 1 ? "1" : `${rate}x`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {qualityLevels.length > 0 && (
                            <div className="relative">
                              <button onClick={toggleQualityOptions} className="text-s sm:text-sm font-semibold p-1 sm:p-1.5 hover:bg-white/10 rounded" title="Chất lượng">
                                {currentLevel === -1 ? "Auto" : qualityLevels[currentLevel]?.height ? `${qualityLevels[currentLevel]?.height}p` : "SD"}
                                <i className="bx bx-xs bxs-down-arrow align-middle"></i>
                              </button>
                              {showQualityOptions && (
                                <div className="absolute bottom-full mb-1 right-0 bg-black/80 backdrop-blur-sm p-1.5 rounded z-20 whitespace-nowrap shadow-lg">
                                  <button
                                    onClick={() => setVideoLevel(-1)}
                                    className={`block w-full text-left text-s sm:text-sm font-semibold hover:bg-white/20 p-1 sm:p-1.5 rounded ${
                                      currentLevel === -1 ? "font-bold text-red-400" : ""
                                    }`}
                                  >
                                    Auto
                                  </button>
                                  {qualityLevels.map((level, index) => (
                                    <button
                                      key={index}
                                      onClick={() => setVideoLevel(index)}
                                      className={`block w-full text-left text-s sm:text-sm hover:bg-white/20 p-1 sm:p-1.5 rounded ${
                                        currentLevel === index ? "font-bold text-red-400" : ""
                                      }`}
                                    >
                                      {level.height ? `${level.height}p` : `Mức ${index + 1}`}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          <button onClick={toggleFullscreen} className="sm:p-1.5 hover:bg-white/10 rounded-full" title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
                            <i className={`bx ${isFullscreen ? "bx-exit-fullscreen" : "bx-fullscreen"} text-lg sm:text-xl md:text-2xl`}></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-[98%] sm:w-[95%] md:w-[90%] lg:w-[85%] aspect-video flex flex-col items-center justify-center text-white rounded-lg shadow-xl bg-black/70 backdrop-blur-sm">
                    <i className="bx bx-video-off text-gray-400 mb-4" style={{ fontSize: "4rem" }}></i>
                    <p className="text-xl">Không có video để phát.</p>
                    <p className="text-sm text-gray-300 mt-1">Phim này hiện chưa có nguồn phát video.</p>
                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#06121e] pb-10 -mt-10 md:-mt-16 relative z-10">
              <div className="container mx-auto max-w-screen-xl p-3 md:p-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl text-white font-bold font-[Montserrat] mt-4">
                  {film.movie.name}
                  {film.movie.quality && (
                    <span className="bg-yellow-500 text-black rounded ml-2 sm:ml-3 md:ml-4 text-xs sm:text-sm md:text-base px-1.5 py-0.5 align-middle">
                      {film.movie.quality}
                    </span>
                  )}
                </h1>
                <h2 className="text-base sm:text-lg md:text-xl text-gray-300 font-light my-1.5 sm:my-2 block">
                  {film.movie.origin_name}
                  {film.movie.year && (
                    <span className="text-red-500/90 inline font-medium ml-2">
                      ({film.movie.year})
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 my-3 sm:my-4 text-xs sm:text-sm">
                  {film.movie.status && (
                    <h6 className="text-white border border-gray-600 p-1 px-1.5 rounded">
                      {film.movie.status === "ongoing" ? "Đang cập nhật" : "Hoàn Thành"}
                    </h6>
                  )}
                  {film.movie.episode_current && <h3 className="text-gray-300 inline">{film.movie.episode_current}</h3>}
                  {film.movie.time && <h3 className="text-gray-300 inline">{film.movie.time}</h3>}
                </div>

                {film.movie.content && (
                  <p
                    className="text-gray-300 my-4 sm:my-5 text-sm sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: film.movie.content }}
                  ></p>
                )}

                <div className="space-y-1.5 text-sm sm:text-base text-gray-300">
                  {film.movie.director?.length > 0 && (
                    <p>
                      <span className="text-gray-400 font-medium">Đạo diễn: </span>
                      {Array.isArray(film.movie.director) ? film.movie.director.join(", ") : film.movie.director}
                    </p>
                  )}
                  {film.movie.actor?.length > 0 && (
                    <p>
                      <span className="text-gray-400 font-medium">Diễn viên: </span>
                      {Array.isArray(film.movie.actor)
                        ? film.movie.actor.slice(0, 6).join(", ") + (film.movie.actor.length > 6 ? ", ..." : "")
                        : film.movie.actor}
                    </p>
                  )}
                  {film.movie.category?.length > 0 && (
                    <p>
                      <span className="text-gray-400 font-medium">Thể loại: </span>
                      {Array.isArray(film.movie.category) ? film.movie.category.map((c) => c.name).join(", ") : film.movie.category}
                    </p>
                  )}
                  {film.movie.country?.length > 0 && (
                    <p>
                      <span className="text-gray-400 font-medium">Quốc gia: </span>
                      {Array.isArray(film.movie.country) ? film.movie.country.map((c) => c.name).join(", ") : film.movie.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Watch;