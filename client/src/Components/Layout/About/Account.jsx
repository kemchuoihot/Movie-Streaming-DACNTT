import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "boxicons/css/boxicons.min.css";
import { auth } from "../../Login/Firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState({ email: "", username: "" });
  const [activeTab, setActiveTab] = useState("info");
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [isMoviePopupOpen, setIsMoviePopupOpen] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("authToken", token);
          const response = await axios.get(
            `${
              process.env.REACT_APP_BASE_URL || "http://localhost:5000"
            }/api/users`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setIsLoggedIn(true);
          setIsAdmin(response.data.isAdmin || false);
          setUser({
            email: response.data.email,
            username: response.data.displayName || "N/A",
          });
          if (response.data.isAdmin) {
            fetchUsers();
            fetchMovies();
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          localStorage.removeItem("authToken");
          await signOut(auth);
          setIsLoggedIn(false);
          navigate("/signin");
        }
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem("authToken");
        navigate("/signin");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Không thể tải danh sách người dùng.");
    }
  };

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${
          process.env.REACT_APP_BASE_URL || "http://localhost:5000"
        }/api/movies/admin/movies`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMovies(response.data.movies || []);
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

  if (!isLoggedIn) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="min-h-screen bg-[#06121e] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl text-white font-semibold mb-6">
          Quản lý tài khoản
        </h1>
        <div className="bg-[#0e274073] rounded-md shadow-md p-6 text-white">
          {isAdmin ? (
            <>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "info" ? "bg-[#153a61]" : "hover:bg-[#153a61]"
                  }`}
                >
                  Thông tin
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "users"
                      ? "bg-[#153a61]"
                      : "hover:bg-[#153a61]"
                  }`}
                >
                  Quản lý người dùng
                </button>
                <button
                  onClick={() => setActiveTab("movies")}
                  className={`px-4 py-2 rounded-md ${
                    activeTab === "movies"
                      ? "bg-[#153a61]"
                      : "hover:bg-[#153a61]"
                  }`}
                >
                  Quản lý phim
                </button>
              </div>
              {activeTab === "info" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">
                    Thông tin tài khoản
                  </h2>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Tên người dùng:</strong> {user.username || "N/A"}
                  </p>
                  <p>
                    <strong>Quyền:</strong> Quản trị viên
                  </p>
                </div>
              )}
              {activeTab === "users" && (
                <>
                  <form onSubmit={handleUserSubmit} className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2">Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          className="w-full p-2 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-indigo-600"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={form.isAdmin}
                          onChange={(e) =>
                            setForm({ ...form, isAdmin: e.target.checked })
                          }
                          className="mr-2"
                        />
                        <label className="text-white">Quyền admin</label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading
                        ? "Đang xử lý..."
                        : form._id
                        ? "Cập nhật"
                        : "Thêm"}
                    </button>
                    {form._id && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({ email: "", isAdmin: false, _id: null })
                        }
                        className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </form>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="bg-[#153a61]">
                          <th className="p-2">Email</th>
                          <th className="p-2">Admin</th>
                          <th className="p-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr
                            key={user._id}
                            className="border-b border-gray-700"
                          >
                            <td className="p-2">{user.email}</td>
                            <td className="p-2">
                              {user.isAdmin ? "Có" : "Không"}
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700"
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {activeTab === "movies" && (
                <>
                  <button
                    onClick={() => {
                      setMovieForm(initialMovieState);
                      setEditMovie(null);
                      setIsMoviePopupOpen(true);
                    }}
                    className="mb-6 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                  >
                    Thêm phim mới
                  </button>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="bg-[#153a61]">
                          <th className="p-2">Tên phim</th>
                          <th className="p-2">Slug</th>
                          <th className="p-2">Năm</th>
                          <th className="p-2">Thể loại</th>
                          <th className="p-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movies.map((movie) => (
                          <tr
                            key={movie._id}
                            className="border-b border-gray-700"
                          >
                            <td className="p-2">{movie.name}</td>
                            <td className="p-2">{movie.slug}</td>
                            <td className="p-2">{movie.year}</td>
                            <td className="p-2">{movie.genres.join(", ")}</td>
                            <td className="p-2">
                              <button
                                onClick={() => handleEditMovie(movie)}
                                className="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700"
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(movie._id)}
                                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Thông tin tài khoản
              </h2>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Tên người dùng:</strong> {user.username || "N/A"}
              </p>
              <p>
                <strong>Quyền:</strong> Người dùng
              </p>
            </div>
          )}
        </div>

        {isMoviePopupOpen && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#0e274073] p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl text-white font-semibold mb-4">
                {editMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}
              </h2>
              <form onSubmit={handleMovieSubmit} className="space-y-4">
                <input
                  name="slug"
                  placeholder="Slug (e.g., movie-title)"
                  value={movieForm.slug}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                  required
                />
                <input
                  name="originName"
                  placeholder="Tên gốc (e.g., The Matrix)"
                  value={movieForm.originName}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                  required
                />
                <input
                  name="name"
                  placeholder="Tên (e.g., Ma Trận)"
                  value={movieForm.name}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                  required
                />
                <input
                  name="year"
                  type="number"
                  placeholder="Năm (e.g., 1999)"
                  value={movieForm.year}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="time"
                  placeholder="Thời lượng (e.g., 2h 15m)"
                  value={movieForm.time}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="quality"
                  placeholder="Chất lượng (e.g., HD)"
                  value={movieForm.quality}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <select
                  name="status"
                  value={movieForm.status}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                >
                  <option value="completed">Hoàn Thành</option>
                  <option value="ongoing">Đang Chiếu</option>
                </select>
                <input
                  name="genres"
                  placeholder="Thể loại (e.g., Action, Sci-Fi)"
                  value={movieForm.genres.join(", ")}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="directors"
                  placeholder="Đạo diễn (e.g., Wachowski)"
                  value={movieForm.directors.join(", ")}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="actors"
                  placeholder="Diễn viên (e.g., Keanu Reeves)"
                  value={movieForm.actors.join(", ")}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="rating"
                  type="number"
                  step="0.1"
                  placeholder="Đánh giá (e.g., 8.7)"
                  value={movieForm.rating}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <textarea
                  name="description"
                  placeholder="Mô tả"
                  value={movieForm.description}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="thumbUrl"
                  placeholder="URL ảnh thumb"
                  value={movieForm.thumbUrl}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="posterUrl"
                  placeholder="URL poster"
                  value={movieForm.posterUrl}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="trailerUrl"
                  placeholder="URL trailer (e.g., https://youtube.com/watch?v=...)"
                  value={movieForm.trailerUrl}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <input
                  name="videoUrl"
                  placeholder="URL video (e.g., embed link hoặc .m3u8)"
                  value={movieForm.videoUrl}
                  onChange={handleMovieChange}
                  className="w-full p-2 bg-gray-800 text-white rounded-lg"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading
                      ? "Đang xử lý..."
                      : editMovie
                      ? "Cập nhật"
                      : "Thêm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMoviePopupOpen(false)}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
