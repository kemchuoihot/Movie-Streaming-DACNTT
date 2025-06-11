import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { fetchDataFromAPI } from "../../api/api.js";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import NavBar from "../Layout/Navbar/NavBar.jsx";
import Footer from "../Footer/Footer.jsx";

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get("query");

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await fetchDataFromAPI();
        if (response && response.items) {
          const filteredResults = response.items.filter((movie) =>
            movie.name.toLowerCase().includes(query?.toLowerCase() || "")
          );
          setResults(filteredResults);
        } else {
          throw new Error("Không có dữ liệu phim");
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    } else {
      setLoading(false);
      setResults([]);
    }
  }, [location.search]);

  const query = new URLSearchParams(location.search).get("query");

  if (loading) {
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
            <div className="flex flex-col justify-center items-center min-h-[400px] pt-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-orange-500 rounded-full animate-spin animate-reverse"></div>
              </div>
              <p className="text-white/80 mt-4 font-medium">Đang tìm kiếm phim...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-red-400/10 to-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-orange-400/10 to-red-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col items-center justify-center min-h-[400px] pt-20">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-12 border border-red-500/30 text-center max-w-md">
                <i className="bx bx-error-circle text-red-400 mb-4 text-6xl"></i>
                <h2 className="text-2xl font-bold text-white mb-2">Có lỗi xảy ra</h2>
                <p className="text-red-300 mb-6">{error}</p>
                <Link
                  to="/"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-xl text-white transition-all duration-300 font-medium"
                >
                  <i className="bx bx-home mr-2"></i>
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

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
                <i className="bx bx-search-alt text-3xl text-black"></i>
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-[Montserrat] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 tracking-tight">
                  Kết quả tìm kiếm
                </h1>
                <p className="text-white/70 text-lg mt-1">
                  Từ khóa: <span className="font-bold text-yellow-400">"{query}"</span>
                </p>
              </div>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            
            {/* Stats & View Toggle */}
            <div className="flex items-center gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-2 border border-white/20">
                <span className="text-white/80 text-sm">
                  Tìm thấy <span className="font-bold text-yellow-400">{results.length}</span> phim
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

          {/* Results */}
          {results.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-12 border border-white/20 text-center max-w-md">
                <i className="bx bx-search text-6xl text-white/50 mb-4"></i>
                <h3 className="text-2xl font-bold text-white mb-2">Không tìm thấy kết quả</h3>
                <p className="text-white/70 mb-6">
                  Không có phim nào khớp với từ khóa <span className="font-bold text-yellow-400">"{query}"</span>
                </p>
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
                  {results.map((movie, idx) => (
                    <Link
                      key={movie.slug}
                      to={`/detail/${movie.slug}`}
                      className="group relative bg-white/10 backdrop-blur rounded-2xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <LazyLoadImage
                          effect="blur"
                          src={movie.poster_url || movie.thumb_url}
                          alt={movie.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            HD
                          </span>
                          {movie.year && (
                            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                              {movie.year}
                            </span>
                          )}
                        </div>

                        {movie.time && (
                          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-medium px-2 py-1 rounded-full">
                            {movie.time}
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
                          {movie.name}
                        </h3>
                        {movie.original_name && (
                          <p className="text-white/60 text-xs truncate mt-1">
                            {movie.original_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-white/50 text-xs">{movie.year}</span>
                          {movie.genre && (
                            <span className="bg-white/20 text-white/80 text-xs px-2 py-1 rounded-full">
                              {movie.genre.split(',')[0]}
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
                  {results.map((movie, idx) => (
                    <Link
                      key={movie.slug}
                      to={`/detail/${movie.slug}`}
                      className="group flex items-center bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
                    >
                      <div className="flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden mr-4">
                        <LazyLoadImage
                          effect="blur"
                          src={movie.poster_url || movie.thumb_url}
                          alt={movie.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate group-hover:text-yellow-400 transition-colors">
                          {movie.name}
                        </h3>
                        {movie.original_name && (
                          <p className="text-white/60 text-sm truncate mt-1">
                            {movie.original_name}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                          <span>Năm: {movie.year}</span>
                          {movie.time && <span>Thời lượng: {movie.time}</span>}
                          {movie.genre && <span>Thể loại: {movie.genre.split(',')[0]}</span>}
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
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SearchResults;