import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import AboutNavbar from "../About/About";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();

  // Danh sách category với icon riêng và màu sắc
  const categories = [
    { name: "Tất cả phim", slug: "all", icon: "bx-movie-play", color: "text-purple-400" },
    { name: "Hành động", slug: "Hành Động", icon: "bx-run", color: "text-red-400" },
    { name: "Chính kịch", slug: "Chính Kịch", icon: "bx-camera-movie", color: "text-blue-400" },
    { name: "Hài hước", slug: "Hài Hước", icon: "bx-happy", color: "text-yellow-400" },
    { name: "Kinh dị", slug: "Kinh Dị", icon: "bx-ghost", color: "text-gray-400" },
    { name: "Tình cảm", slug: "Tình Cảm", icon: "bx-heart", color: "text-pink-400" },
    { name: "Tâm lý", slug: "Tâm Lý", icon: "bx-brain", color: "text-indigo-400" },
    { name: "Khoa học viễn tưởng", slug: "Khoa Học Viễn Tưởng", icon: "bx-planet", color: "text-cyan-400" },
    { name: "Phiêu lưu", slug: "Phiêu Lưu", icon: "bx-world", color: "text-green-400" },
  ];

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }

      lastScrollY = currentScrollY;

      if (currentScrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
      setIsMobileMenuOpen(false);
      setSearchFocused(false);
    }
  };

  const handleCategorySelect = (slug) => {
    navigate(`/category/${slug}/1`);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl" 
            : "bg-transparent"
        } ${
          scrollDirection === "down" && scrolled 
            ? "-translate-y-full" 
            : "translate-y-0"
        }`}
      >
        <div className="container max-w-screen-xl mx-auto py-3 px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="https://ik.imagekit.io/thinhpx33/logo.png?updatedAt=1746706738519"
                  alt="logo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-2xl group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  MovieCity
                </h1>
                <p className="text-white/60 text-xs">Xem phim HD miễn phí</p>
              </div>
            </Link>
          </div>

          {/* Enhanced Search Form */}
          <div className="flex-1 mx-4 sm:mx-8 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className={`flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
                searchFocused 
                  ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/20' 
                  : 'border-white/20 hover:border-white/30'
              }`}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl m-1 text-black hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 hover:scale-105"
                >
                  <i className="bx bx-search-alt text-lg sm:text-xl font-bold"></i>
                </button>
                <input
                  type="text"
                  name="keyword"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Tìm kiếm phim, diễn viên, đạo diễn..."
                  className="font-medium placeholder:text-white/50 text-sm w-full bg-transparent border-none px-3 py-2 text-white focus:outline-none"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="text-white/50 hover:text-white p-2 transition-colors"
                  >
                    <i className="bx bx-x text-xl"></i>
                  </button>
                )}
              </div>
              
              {/* Search suggestions placeholder */}
              {searchFocused && searchKeyword && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 max-h-64 overflow-y-auto">
                  <div className="text-white/60 text-sm p-3 text-center">
                    Nhấn Enter để tìm kiếm "{searchKeyword}"
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur"
            >
              <i className={`bx text-2xl transition-transform duration-300 ${
                isMobileMenuOpen ? "bx-x rotate-180" : "bx-menu"
              }`}></i>
            </button>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex gap-6 font-medium text-sm items-center">
            <li>
              <Link
                to="/"
                className="text-white text-base font-medium hover:text-yellow-400 relative transition-all duration-300 group flex items-center px-4 py-2 rounded-2xl hover:bg-white/10"
              >
                <i className="bx bx-home-alt-2 mr-2 text-lg"></i>
                Trang chủ
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            </li>
            
            <li className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white text-base font-medium hover:text-yellow-400 transition-all duration-300 group flex items-center px-4 py-2 rounded-2xl hover:bg-white/10"
              >
                <i className="bx bx-category mr-2 text-lg"></i>
                Thể loại
                <i className={`bx bx-chevron-down ml-2 text-sm transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}></i>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 py-2 z-50">
                  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {categories.map((category, index) => (
                      <button
                        key={category.slug}
                        onClick={() => handleCategorySelect(category.slug)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 cursor-pointer flex items-center transition-all duration-300 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <i className={`bx ${category.icon} mr-3 text-lg ${category.color} group-hover:scale-110 transition-transform duration-300`}></i>
                        <span className="group-hover:text-yellow-400 transition-colors duration-300">
                          {category.name}
                        </span>
                        <i className="bx bx-chevron-right ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
            
            <li>
              <div className="px-4 py-2 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <AboutNavbar />
              </div>
            </li>
          </ul>
        </div>

        {/* Enhanced Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-500 transform ${
            isMobileMenuOpen 
              ? "translate-y-0 opacity-100" 
              : "-translate-y-4 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
            <ul className="flex flex-col">
              <li>
                <Link
                  to="/"
                  className="flex items-center px-6 py-4 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="bx bx-home-alt-2 mr-3 text-xl"></i>
                  <span className="font-medium">Trang chủ</span>
                </Link>
              </li>
              
              <li>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <i className="bx bx-category mr-3 text-xl"></i>
                    <span className="font-medium">Thể loại</span>
                  </div>
                  <i className={`bx bx-chevron-down text-lg transition-transform duration-300 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}></i>
                </button>
                
                {isDropdownOpen && (
                  <div className="bg-white/5 border-t border-white/10">
                    {categories.map((category, index) => (
                      <button
                        key={category.slug}
                        onClick={() => handleCategorySelect(category.slug)}
                        className="w-full flex items-center px-8 py-3 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <i className={`bx ${category.icon} mr-3 text-lg ${category.color}`}></i>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
              
              <li>
                <div className="px-6 py-4 hover:bg-white/10 transition-all duration-300">
                  <AboutNavbar />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;