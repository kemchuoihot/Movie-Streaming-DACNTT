import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import axios from "axios";
import NavBar from "../Layout/Navbar/NavBar";
import Footer from "../Footer/Footer";

const getTitle = (category) => {
  if (category === "all") return "Phim Mới Cập Nhật";
  return `Danh mục: ${category}`;
};

const getIcon = (category) => {
  const icons = {
    "all": "bx-movie-play",
    "Hành Động": "bx-run",
    "Tâm Lý": "bx-brain", 
    "Chính Kịch": "bx-mask",
    "Kinh Dị": "bx-ghost",
    "Hài Hước": "bx-laugh",
    "Tình Cảm": "bx-heart",
    "Khoa Học Viễn Tưởng": "bx-planet",
    "Phiêu Lưu": "bx-world"
  };
  return icons[category] || "bx-category";
};

const CategoryPage = () => {
  const { category, page } = useParams();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
  const fetchCategoryMovies = async () => {
    setLoading(true);
    try {
      let url = "";
      if (category === "all") {
        url = "http://localhost:5000/api/movies/new";
      } else {
        url = `http://localhost:5000/api/movies/category/${category}`;
      }
      const res = await axios.get(url, {
        params: { page: currentPage, limit: 18 },
      });
      
      // Handle different response structures
      let data = [];
      let total = 0;
      
      if (category === "all") {
        // For /new endpoint
        data = res.data.items || [];
        total = res.data.totalItems || data.length;
      } else {
        // For /category endpoint
        data = res.data.items || (res.data.data && res.data.data.items) || [];
        total = res.data.totalItems || res.data.data?.totalItems || data.length;
      }
      
      setMovies(data);
      setTotalPages(Math.ceil(total / 18));
      
    } catch (err) {
      console.error("Error fetching movies:", err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };
  fetchCategoryMovies();
}, [category, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      navigate(`/category/${category}/${newPage}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-12 mb-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white/10 backdrop-blur text-white rounded-xl border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <i className="bx bx-chevron-left"></i>
        </button>
        
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-4 py-2 bg-white/10 backdrop-blur text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              1
            </button>
            {startPage > 2 && <span className="text-white/50">...</span>}
          </>
        )}

        {pages.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
              pageNum === currentPage
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold'
                : 'bg-white/10 backdrop-blur text-white border-white/20 hover:bg-white/20'
            }`}
          >
            {pageNum}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-white/50">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-4 py-2 bg-white/10 backdrop-blur text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white/10 backdrop-blur text-white rounded-xl border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-400/5 to-cyan-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-10 pt-20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
                <i className={`bx ${getIcon(category)} text-3xl text-black`}></i>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-[Montserrat] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 tracking-tight">
                {getTitle(category)}
              </h1>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            
            {/* Stats & View Toggle */}
            <div className="flex items-center gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-2 border border-white/20">
                <span className="text-white/80 text-sm">
                  Tìm thấy <span className="font-bold text-yellow-400">{movies.length}</span> phim
                </span>
              </div>
              
              <div className="flex bg-white/10 backdrop-blur rounded-2xl p-1 border border-white/20">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-xl transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <i className="bx bx-grid-alt"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 rounded-xl transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <i className="bx bx-list-ul"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col justify-center items-center min-h-[400px]">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-orange-500 rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="text-white/80 mt-4 font-medium">Đang tải phim...</p>
            </div>
          ) : movies.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-12 border border-white/20 text-center max-w-md">
                <i className="bx bx-movie text-6xl text-white/50 mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">Không có phim nào</h3>
                <p className="text-white/70 mb-6">Danh mục này hiện chưa có phim. Hãy thử danh mục khác!</p>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:scale-105 transition-transform duration-300"
                >
                  <i className="bx bx-home mr-2"></i>
                  Về trang chủ
                </Link>
              </div>
            </div>
          ) : (
            // Movies Grid/List
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                  {movies.map((item, idx) => (
                    <Link
                      key={item.slug}
                      to={`/detail/${item.slug}`}
                      className="group relative bg-white/10 backdrop-blur rounded-2xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <LazyLoadImage
                          effect="blur"
                          src={item.poster_url || item.thumb_url}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.year && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                              {item.year}
                            </span>
                          )}
                        </div>

                        {item.time && (
                          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-full">
                            {item.time}
                          </span>
                        )}

                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button className="bg-white/90 backdrop-blur text-black rounded-full p-4 hover:bg-white transition-colors shadow-lg">
                            <i className="bx bx-play text-2xl"></i>
                          </button>
                        </div>

                        {/* Mobile Index */}
                        <div className="sm:hidden absolute bottom-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      
                      {/* Movie Info */}
                      <div className="p-3">
                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-yellow-400 transition-colors">
                          {item.name}
                        </h3>
                        {item.origin_name && (
                          <p className="text-white/60 text-xs truncate mt-1">
                            {item.origin_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/50 text-xs">{item.year}</span>
                          {item.genre && (
                            <span className="bg-white/20 text-white/80 text-xs px-2 py-1 rounded-full">
                              {item.genre.split(',')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {movies.map((item, idx) => (
                    <Link
                      key={item.slug}
                      to={`/detail/${item.slug}`}
                      className="group flex items-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden mr-4">
                        <LazyLoadImage
                          effect="blur"
                          src={item.poster_url || item.thumb_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate group-hover:text-yellow-400 transition-colors">
                          {item.name}
                        </h3>
                        {item.origin_name && (
                          <p className="text-white/60 text-sm truncate mt-1">
                            {item.origin_name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                          <span>Năm: {item.year}</span>
                          {item.time && <span>Thời lượng: {item.time}</span>}
                          {item.genre && <span>Thể loại: {item.genre.split(',')[0]}</span>}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        <button className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors">
                          <i className="bx bx-play text-xl"></i>
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CategoryPage;