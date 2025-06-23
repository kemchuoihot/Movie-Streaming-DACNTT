import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../Login/Firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { toast } from "react-toastify";
import "boxicons/css/boxicons.min.css";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const History = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
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
          await fetchHistory(token);
        } catch (err) {
          console.error("Error getting token:", err);
          setError("Không thể xác thực. Vui lòng đăng nhập lại.");
          toast.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
          navigate("/signin");
        }
      } else {
        setUser(null);
        setError("Vui lòng đăng nhập để xem lịch sử xem phim.");
        navigate("/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchHistory = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Watch history response:", response.data);
      setHistory(response.data || []);
      setError("");
    } catch (err) {
      console.error("Error fetching watch history:", err.response?.data || err);
      const message =
        err.response?.data?.message ||
        "Không thể tải lịch sử xem phim. Vui lòng thử lại.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    if (!minutes && minutes !== 0) return "0m";
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDuration = (time) => {
    if (!time && time !== 0) return "N/A";

    let totalMins = 0;

    // Nếu time là số phút (e.g., 119 từ API)
    if (typeof time === "number") {
      totalMins = time;
    }
    // Nếu time là chuỗi
    else if (typeof time === "string") {
      // Xử lý dạng "119 phút"
      const minuteMatch = time.match(/^(\d+)\s*phút$/i);
      if (minuteMatch) {
        totalMins = parseInt(minuteMatch[1], 10) || 0;
      }
      // Xử lý dạng "2h 30m" hoặc "2h"
      else if (time.includes("h")) {
        const hours = parseInt(time.split("h")[0]) || 0;
        const mins = time.includes("m")
          ? parseInt(time.split("h")[1].split("m")[0]) || 0
          : 0;
        totalMins = hours * 60 + mins;
      }
      // Xử lý dạng "10 tập"
      else if (time.includes("tập")) {
        const episodes = parseInt(time.split("tập")[0]) || 1;
        totalMins = episodes * 45; // Giả định mỗi tập 45 phút
      }
      // Nếu không parse được, trả về nguyên bản
      else {
        return time;
      }
    } else {
      return "N/A";
    }

    // Chuyển totalMins thành định dạng "Xh Ym"
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleRemoveHistory = async (slug) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No auth token found");
      }
      await axios.delete(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/history/${slug}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setHistory(history.filter((entry) => entry.slug !== slug));
      toast.success("Đã xóa phim khỏi lịch sử!");
      setError("");
    } catch (err) {
      console.error("Error removing history:", err);
      const message =
        err.response?.data?.message || "Không thể xóa phim khỏi lịch sử.";
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
        <Link to="/favorites" className="block py-2 hover:bg-[#153a61] rounded">
          Yêu thích
        </Link>
        <Link to="/history" className="block py-2 bg-[#153a61] rounded">
          <span className="text-yellow-500 mr-2">●</span> Lịch sử
        </Link>
        <Link to="/taikhoan" className="block py-2 hover:bg-[#153a61] rounded">
          Tài khoản
        </Link>
      </div>
      <div className="flex-1 p-8">
        <div className="bg-transparent text-white rounded-lg shadow-none p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4">Lịch sử xem phim</h2>
          <p className="text-gray-400 mb-6">Danh sách phim bạn đang xem dở</p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {loading ? (
            <p className="text-white text-center py-4">Đang tải...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-300 text-center py-4">
              Bạn chưa có lịch sử xem phim.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mx-auto max-w-screen-xl">
              {history.map((entry) => (
                <div
                  key={entry.slug}
                  className="flex flex-col items-center border border-gray-700 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-4 bg-transparent group"
                >
                  <Link
                    to={`/watch/${entry.slug}?t=${entry.stoppedAt}`}
                    className="w-full flex justify-center rounded-3xl"
                  >
                    <div className="w-full h-80 flex items-center justify-center overflow-hidden mb-2 rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                      <LazyLoadImage
                        effect="blur"
                        src={entry.posterUrl}
                        alt={entry.name}
                        className="object-contain w-full h-full overflow-hidden"
                      />
                    </div>
                  </Link>
                  <h3 className="text-white text-sm font-medium text-center truncate w-full mb-2">
                    {entry.name}
                  </h3>
                  <p className="text-gray-400 text-xs text-center mb-2">
                    Đã xem: {formatTime(entry.stoppedAt)} /{" "}
                    {formatDuration(entry.duration || entry.time)}
                  </p>
                  <button
                    onClick={() => handleRemoveHistory(entry.slug)}
                    className="bg-red-600 text-white rounded-full p-2 transition-colors duration-300 ease-in-out shadow-md hover:bg-red-700 hover:shadow-lg"
                    title="Xóa khỏi lịch sử"
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

export default History;
