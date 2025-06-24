import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "boxicons/css/boxicons.min.css";
import { auth } from "../Login/Firebase";
import { signInWithCustomToken } from "firebase/auth";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isMoviePopupOpen, setIsMoviePopupOpen] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const initialMovieState = {
    slug: "",
    originName: "",
    name: "",
    year: "",
    time: "",
    quality: "",
    status: "completed",
    genres: [],
    directors: [],
    actors: [],
    rating: 0,
    description: "",
    thumbUrl: "",
    posterUrl: "",
    trailerUrl: "",
    videoUrl: "",
  };

  const [movieForm, setMovieForm] = useState(initialMovieState);
  const [form, setForm] = useState({ email: "", isAdmin: false });
  const [conversionProgress, setConversionProgress] = useState(0);
  const [videoFile, setVideoFile] = useState(null); // State để lưu file video được chọn
  const [uploadingVideo, setUploadingVideo] = useState(false); // State riêng cho quá trình upload video

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMovieForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          await axios.get(
            `${
              process.env.REACT_APP_BASE_URL || "http://localhost:5000"
            }/api/users`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setIsLoggedIn(true);
          fetchUsers();
          fetchMovies();
        } catch (err) {
          localStorage.removeItem("authToken");
          setIsLoggedIn(false);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/admin/login`,
        { email, password }
      );
      const { token } = response.data;
      await signInWithCustomToken(auth, token);
      localStorage.setItem("authToken", token);
      setIsLoggedIn(true);
      setEmail("");
      setPassword("");
      toast.success("Đăng nhập admin thành công!");
      fetchUsers();
      fetchMovies();
    } catch (err) {
      console.error("Login error:", err);
      toast.error(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setUsers(response.data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Không thể tải danh sách người dùng.");
    }
  };

  const fetchMovies = async () => {
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/admin/movies`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setMovies(response.data.movies);
    } catch (err) {
      console.error("Error fetching movies:", err);
      toast.error("Không thể tải danh sách phim.");
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const userData = { email: form.email, isAdmin: form.isAdmin };
      if (form._id) {
        await axios.put(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/users/${form._id}`,
          userData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Cập nhật người dùng thành công!");
      } else {
        await axios.post(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/users`,
          userData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Tạo người dùng thành công!");
      }
      setForm({ email: "", isAdmin: false, _id: null });
      fetchUsers();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        err.response?.data?.message || "Thao tác thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const movieData = {
        ...movieForm,
        year: parseInt(movieForm.year) || 0,
        rating: parseFloat(movieForm.rating) || 0,
        genres: movieForm.genres
          .join(", ")
          .split(", ")
          .filter((v) => v),
        directors: movieForm.directors
          .join(", ")
          .split(", ")
          .filter((v) => v),
        actors: movieForm.actors
          .join(", ")
          .split(", ")
          .filter((v) => v),
      };
      if (editMovie) {
        await axios.put(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/admin/movies/${editMovie._id}`,
          movieData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Cập nhật phim thành công!");
      } else {
        await axios.post(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/admin/movies`,
          movieData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Thêm phim thành công!");
      }
      setMovieForm(initialMovieState);
      setEditMovie(null);
      setIsMoviePopupOpen(false);
      fetchMovies();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        err.response?.data?.message || "Thao tác thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setForm({ email: user.email, isAdmin: user.isAdmin, _id: user._id });
  };

  const handleEditMovie = (movie) => {
    setMovieForm({
      slug: movie.slug || "",
      originName: movie.originName || "",
      name: movie.name || "",
      year: movie.year || "",
      time: movie.time || "",
      quality: movie.quality || "",
      status: movie.status || "completed",
      genres: movie.genres || [],
      directors: movie.directors || [],
      actors: movie.actors || [],
      rating: movie.rating || 0,
      description: movie.description || "",
      thumbUrl: movie.thumbUrl || "",
      posterUrl: movie.posterUrl || "",
      trailerUrl: movie.trailerUrl || "",
      videoUrl: movie.videoUrl || "",
    });
    setEditMovie(movie);
    setIsMoviePopupOpen(true);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (activeTab === "users") {
        await axios.delete(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/users/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Xóa người dùng thành công!");
        fetchUsers();
      } else {
        await axios.delete(
          `${
            process.env.REACT_APP_BASE_URL || "http://localhost:5000"
          }/api/movies/admin/movies/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success("Xóa phim thành công!");
        fetchMovies();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(
        err.response?.data?.message || "Xóa thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    toast.success("Đăng xuất thành công!");
    navigate("/");
  };

  const handleMovieChange = (e) => {
    const { name, value } = e.target;
    if (["genres", "directors", "actors"].includes(name)) {
      setMovieForm({
        ...movieForm,
        [name]: value.split(", ").filter((v) => v),
      });
    } else {
      setMovieForm({ ...movieForm, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
  };

  const handleUploadVideo = async () => {
    if (!videoFile) {
        toast.error("Vui lòng chọn một file video để tải lên.");
        return;
    }

    setUploadingVideo(true);
    setConversionProgress(0);

    const formData = new FormData();
    formData.append("video", videoFile);

    // Enhanced progress simulation for HLS
    let fakeProgress = 0;
    const progressInterval = setInterval(() => {
        fakeProgress += Math.random() * 2; // Slower for HLS transcoding
        if (fakeProgress >= 90) return; // Don't complete until real completion
        setConversionProgress(Math.floor(fakeProgress));
    }, 300);

    try {
        console.log('🎬 Starting video upload and transcoding...');
        
        const response = await axios.post(
            `${process.env.REACT_APP_BASE_URL || "http://localhost:5000"}/api/upload/video`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                },
                timeout: 600000, // 10 minutes timeout for HLS transcoding
                onUploadProgress: (progressEvent) => {
                    const uploadPercent = Math.round(
                        (progressEvent.loaded * 30) / progressEvent.total // Upload is 30% of total progress
                    );
                    if (uploadPercent > fakeProgress) {
                        setConversionProgress(uploadPercent);
                    }
                }
            }
        );

        clearInterval(progressInterval);
        setConversionProgress(100);
        
        console.log('✅ Upload response:', response.data);
        
        // ✅ UPDATE MOVIE FORM WITH RETURNED URL
        setMovieForm((prev) => ({ 
            ...prev, 
            videoUrl: response.data.url  // This will be either HLS master.m3u8 or direct video
        }));
        
        // ✅ SUCCESS MESSAGE BASED ON UPLOAD TYPE
        if (response.data.type === 'hls') {
            toast.success(
                `🎬 Video đã được chuyển đổi thành HLS thành công!\n` +
                `✅ ${response.data.resolutions?.length || 0} chất lượng\n` +
                `📺 Master playlist: ${response.data.masterPlaylist ? 'Có' : 'Không'}\n` +
                `📁 ${response.data.files?.total || 0} files đã upload`
            );
            
            // ✅ SHOW ADDITIONAL HLS INFO
            if (response.data.transcoding) {
                console.log('🎬 HLS Transcoding Details:', {
                    successful: response.data.transcoding.successful,
                    total: response.data.transcoding.total,
                    resolutions: response.data.resolutions,
                    masterUrl: response.data.url
                });
            }
        } else {
            toast.warning(
                `📹 Video đã upload thành công nhưng không có HLS!\n` +
                `⚠️ Chỉ có 1 chất lượng\n` +
                `💡 Kiểm tra FFmpeg trên server`
            );
        }
        
        // ✅ LOG FINAL URL FOR VERIFICATION
        console.log('📺 Final video URL for player:', response.data.url);
        console.log('🎬 URL type:', response.data.type);
        
        setVideoFile(null);
        
    } catch (err) {
        clearInterval(progressInterval);
        console.error("❌ Upload video error:", err);
        
        let errorMessage = "Tải video thất bại!";
        
        if (err.code === 'ECONNABORTED') {
            errorMessage = "Upload timeout - HLS transcoding mất quá nhiều thời gian";
        } else if (err.response?.status === 413) {
            errorMessage = "File quá lớn - vui lòng chọn video nhỏ hơn 500MB";
        } else if (err.response?.status === 503) {
            errorMessage = "Dịch vụ upload/transcoding tạm thời không khả dụng";
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }
        
        toast.error(errorMessage);
        
    } finally {
        clearInterval(progressInterval);
        setTimeout(() => {
            setUploadingVideo(false);
            setConversionProgress(0);
        }, 2000);
    }
};

  // Stats calculations
  const totalUsers = users.length;
  const totalMovies = movies.length;
  const totalAdmins = users.filter((user) => user.isAdmin).length;
  const avgRating =
    movies.length > 0
      ? (
          movies.reduce((sum, movie) => sum + (movie.rating || 0), 0) /
          movies.length
        ).toFixed(1)
      : 0;

  // Chart data với màu sắc đẹp hơn
  const topViewedData = {
    labels: movies.slice(0, 10).map((movie) => movie.name.slice(0, 15)),
    datasets: [
      {
        label: "Lượt xem",
        data: movies.slice(0, 10).map((movie) => movie.views),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const topRatedData = {
    labels: movies.slice(0, 10).map((movie) => movie.name.slice(0, 15)),
    datasets: [
      {
        label: "Đánh giá",
        data: movies.slice(0, 10).map((movie) => movie.rating || 0),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(251, 146, 60, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(34, 197, 94, 0.6)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(6, 182, 212, 1)",
          "rgba(251, 146, 60, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const genreDistribution = {
    labels: [
      "Hành Động",
      "Hài Hước",
      "Kinh Dị",
      "Tình Cảm",
      "Khoa Học Viễn Tưởng",
    ],
    datasets: [
      {
        data: [30, 25, 15, 20, 10],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(236, 72, 153, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#e5e7eb",
          font: { size: 12 },
          padding: 20,
        },
      },
      title: {
        display: true,
        color: "#f3f4f6",
        font: { size: 16, weight: "bold" },
        padding: { top: 10, bottom: 30 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(75, 85, 99, 0.3)" },
      },
      x: {
        ticks: { color: "#9ca3af", maxRotation: 45 },
        grid: { color: "rgba(75, 85, 99, 0.3)" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#e5e7eb",
          font: { size: 12 },
          padding: 20,
        },
      },
    },
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bx bx-shield-check text-3xl text-white"></i>
            </div>
            <h2 className="text-3xl text-white font-bold mb-2">Admin Panel</h2>
            <p className="text-gray-300">Đăng nhập để quản trị hệ thống</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-white mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2 font-medium">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${
                loading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-blue-600 hover:to-purple-700 transform hover:scale-105"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 z-40 transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                  <i className="bx bx-cog text-white text-xl"></i>
                </div>
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <i
                className={`bx ${
                  sidebarCollapsed ? "bx-menu" : "bx-x"
                } text-xl`}
              ></i>
            </button>
          </div>

          <nav className="space-y-2 mr-3">
            {[
              { id: "dashboard", icon: "bx-home", label: "Tổng quan" },
              { id: "users", icon: "bx-user", label: "Người dùng" },
              { id: "movies", icon: "bx-movie", label: "Phim" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <i className={`bx ${item.icon} text-xl`}></i>
                {!sidebarCollapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-200"
            >
              <i className="bx bx-log-out text-xl"></i>
              {!sidebarCollapsed && (
                <span className="ml-3 font-medium">Đăng xuất</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeTab === "dashboard" && "Tổng quan"}
                {activeTab === "users" && "Quản lý người dùng"}
                {activeTab === "movies" && "Quản lý phim"}
              </h1>
              <p className="text-gray-300 mt-1">
                {activeTab === "dashboard" && "Thống kê tổng quan hệ thống"}
                {activeTab === "users" && "Quản lý tài khoản người dùng"}
                {activeTab === "movies" && "Quản lý kho phim"}
              </p>
            </div>
            <Link
              to="/"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <i className="bx bx-home mr-2"></i>
              Trang chủ
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: "Tổng phim",
                    value: totalMovies,
                    icon: "bx-movie",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    title: "Người dùng",
                    value: totalUsers,
                    icon: "bx-user",
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    title: "Quản trị viên",
                    value: totalAdmins,
                    icon: "bx-shield",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    title: "Đánh giá TB",
                    value: avgRating,
                    icon: "bx-star",
                    color: "from-yellow-500 to-orange-500",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 text-sm font-medium">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}
                      >
                        <i className={`bx ${stat.icon} text-white text-xl`}></i>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Lượt xem phim
                  </h3>
                  <div className="h-80">
                    <Line
                      data={topViewedData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            ...chartOptions.plugins.title,
                            text: "Top 10 phim có lượt xem cao nhất",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Thể loại phim
                  </h3>
                  <div className="h-80">
                    <Doughnut
                      data={genreDistribution}
                      options={doughnutOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  Đánh giá phim
                </h3>
                <div className="h-80">
                  <Bar
                    data={topRatedData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          ...chartOptions.plugins.title,
                          text: "Top 10 phim có đánh giá cao nhất",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">
                  Thêm/Chỉnh sửa người dùng
                </h3>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                        placeholder="user@example.com"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isAdmin}
                          onChange={(e) =>
                            setForm({ ...form, isAdmin: e.target.checked })
                          }
                          className="sr-only"
                        />
                        <div
                          className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                            form.isAdmin ? "bg-blue-500" : "bg-gray-600"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ${
                              form.isAdmin ? "translate-x-6" : ""
                            }`}
                          ></div>
                        </div>
                        <span className="ml-3 text-white font-medium">
                          Quyền admin
                        </span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${
                        loading
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:from-blue-600 hover:to-purple-700"
                      }`}
                    >
                      {loading
                        ? "Đang xử lý..."
                        : form._id
                        ? "Cập nhật"
                        : "Thêm mới"}
                    </button>
                    {form._id && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ email: "", isAdmin: false, _id: null })
                        }
                        className="px-6 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/20">
                  <h3 className="text-xl font-bold text-white">
                    Danh sách người dùng
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Quyền
                        </th>
                        <th className="px-6 py-4 text-center text-white font-semibold">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-300">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.isAdmin
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-green-500/20 text-green-400"
                              }`}
                            >
                              {user.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg transition-colors"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Movies Tab */}
          {activeTab === "movies" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Danh sách phim
                  </h3>
                  <p className="text-gray-300 mt-1">
                    Tổng cộng {movies.length} phim
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMovieForm(initialMovieState);
                    setEditMovie(null);
                    setIsMoviePopupOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center"
                >
                  <i className="bx bx-plus mr-2"></i>
                  Thêm phim mới
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Poster
                        </th>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Tên phim
                        </th>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Năm
                        </th>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Thể loại
                        </th>
                        <th className="px-6 py-4 text-left text-white font-semibold">
                          Đánh giá
                        </th>
                        <th className="px-6 py-4 text-center text-white font-semibold">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {movies.map((movie) => (
                        <tr
                          key={movie._id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <img
                              src={movie.posterUrl || movie.thumbUrl}
                              alt={movie.name}
                              className="w-12 h-16 object-cover rounded-lg"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">
                                {movie.name}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {movie.originName}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {movie.year}
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {movie.genres.slice(0, 2).join(", ")}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <i className="bx bx-star text-yellow-400 mr-1"></i>
                              <span className="text-yellow-400 font-semibold">
                                {movie.rating}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditMovie(movie)}
                                className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-lg transition-colors"
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(movie._id)}
                                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-2 rounded-lg transition-colors"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Movie Popup với animations */}
      {isMoviePopupOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-slideIn">
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}
                </h2>
                <button
                  onClick={() => setIsMoviePopupOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="bx bx-x text-2xl"></i>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <form onSubmit={handleMovieSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Slug *
                    </label>
                    <input
                      name="slug"
                      placeholder="movie-title-slug"
                      value={movieForm.slug}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Tên gốc *
                    </label>
                    <input
                      name="originName"
                      placeholder="The Matrix"
                      value={movieForm.originName}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Tên tiếng Việt *
                    </label>
                    <input
                      name="name"
                      placeholder="Ma Trận"
                      value={movieForm.name}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Năm phát hành
                    </label>
                    <input
                      name="year"
                      type="number"
                      placeholder="1999"
                      value={movieForm.year}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Thời lượng
                    </label>
                    <input
                      name="time"
                      placeholder="136 phút"
                      value={movieForm.time}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Chất lượng
                    </label>
                    <select
                      name="quality"
                      value={movieForm.quality}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg"
                    >
                      <option className="bg-black" value="">
                        Chọn chất lượng
                      </option>
                      <option className="bg-black" value="HD">
                        HD
                      </option>
                      <option className="bg-black" value="Full HD">
                        Full HD
                      </option>
                      <option className="bg-black" value="4K">
                        4K
                      </option>
                      <option className="bg-black" value="CAM">
                        CAM
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Trạng thái
                    </label>
                    <select
                      name="status"
                      value={movieForm.status}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg"
                    >
                      <option className="bg-black" value="completed">
                        Hoàn thành
                      </option>
                      <option className="bg-black" value="ongoing">
                        Đang chiếu
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Đánh giá (0-5)
                    </label>
                    <input
                      name="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      placeholder="4.5"
                      value={movieForm.rating}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Thể loại
                    </label>
                    <input
                      name="genres"
                      placeholder="Hành Động, Khoa Học Viễn Tưởng, Phiêu Lưu"
                      value={
                        Array.isArray(movieForm.genres)
                          ? movieForm.genres.join(", ")
                          : movieForm.genres
                      }
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Đạo diễn
                    </label>
                    <input
                      name="directors"
                      placeholder="Lana Wachowski, Lilly Wachowski"
                      value={
                        Array.isArray(movieForm.directors)
                          ? movieForm.directors.join(", ")
                          : movieForm.directors
                      }
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Diễn viên
                    </label>
                    <input
                      name="actors"
                      placeholder="Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss"
                      value={
                        Array.isArray(movieForm.actors)
                          ? movieForm.actors.join(", ")
                          : movieForm.actors
                      }
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Mô tả
                    </label>
                    <textarea
                      name="description"
                      placeholder="Mô tả nội dung phim..."
                      value={movieForm.description}
                      onChange={handleMovieChange}
                      rows="4"
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      URL Thumbnail
                    </label>
                    <input
                      name="thumbUrl"
                      placeholder="https://example.com/thumb.jpg"
                      value={movieForm.thumbUrl}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      URL Poster
                    </label>
                    <input
                      name="posterUrl"
                      placeholder="https://example.com/poster.jpg"
                      value={movieForm.posterUrl}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      URL Trailer
                    </label>
                    <input
                      name="trailerUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={movieForm.trailerUrl}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                  </div>

                  {/* Video Upload Section - Modified */}
                  <div>
                    <label className="block text-white mb-2 font-medium">
                      Video URL (HLS)
                    </label>
                    <input
                      name="videoUrl"
                      placeholder="https://example.com/video.m3u8"
                      value={movieForm.videoUrl}
                      onChange={handleMovieChange}
                      className="w-full p-3 bg-white/10 text-white rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg placeholder-gray-400"
                    />
                    {/* input file ẩn */}
                    <input
                      type="file"
                      id="videoFileInput"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div
                      onClick={() =>
                        document.getElementById("videoFileInput").click()
                      }
                      className="bg-white/10 border border-dashed border-white/20 text-white text-center p-3 mt-4 rounded-lg cursor-pointer"
                    >
                      {videoFile
                        ? `Đã chọn: ${videoFile.name}`
                        : "Kéo & thả hoặc nhấn để chọn file video"}
                    </div>

                    <button
                      type="button"
                      onClick={handleUploadVideo}
                      disabled={uploadingVideo || !videoFile}
                      className={`w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg mt-4 font-semibold transition-all duration-300 ${
                        uploadingVideo || !videoFile
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:from-green-600 hover:to-teal-700"
                      }`}
                    >
                      {uploadingVideo ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Đang tải lên và xử lý...
                        </div>
                      ) : (
                        <>
                          <i className="bx bx-upload mr-2"></i>
                          Tải lên video
                        </>
                      )}
                    </button>

                    {/* ✅ Hiển thị tiến trình nếu đang upload */}
                    {uploadingVideo && (
                      <div className="w-full bg-white/10 rounded-full h-4 mt-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-full text-xs text-white text-center leading-4 transition-all duration-300"
                          style={{ width: `${conversionProgress}%` }}
                        >
                          {conversionProgress}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading || uploadingVideo} // Disable khi đang upload video hoặc các tác vụ khác
                    className={`flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 ${
                      loading || uploadingVideo
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:from-purlpe-700 hover:to-pink-800"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Đang xử lý...
                      </div>
                    ) : editMovie ? (
                      "Cập nhật phim"
                    ) : (
                      "Thêm phim"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoviePopupOpen(false);
                      setVideoFile(null); // Clear file selection on close
                      setUploadingVideo(false); // Reset upload status
                    }}
                    className="px-8 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
