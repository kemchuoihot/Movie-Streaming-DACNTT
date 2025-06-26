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
  const [showMobileSearch, setShowMobileSearch] = useState(false); // ✅ NEW: Mobile search toggle
  const navigate = useNavigate();

  // ✅ ENHANCED: Better organized categories with shorter mobile names
  const categories = [
    { name: "Tất cả phim", mobileName: "Tất cả", slug: "all", icon: "bx-movie-play", color: "text-purple-400" },
    { name: "Hành động", mobileName: "Hành động", slug: "Hành Động", icon: "bx-run", color: "text-red-400" },
    { name: "Chính kịch", mobileName: "Chính kịch", slug: "Chính Kịch", icon: "bx-camera-movie", color: "text-blue-400" },
    { name: "Hài hước", mobileName: "Hài hước", slug: "Hài Hước", icon: "bx-happy", color: "text-yellow-400" },
    { name: "Kinh dị", mobileName: "Kinh dị", slug: "Kinh Dị", icon: "bx-ghost", color: "text-gray-400" },
    { name: "Tình cảm", mobileName: "Tình cảm", slug: "Tình Cảm", icon: "bx-heart", color: "text-pink-400" },
    { name: "Tâm lý", mobileName: "Tâm lý", slug: "Tâm Lý", icon: "bx-brain", color: "text-indigo-400" },
    { name: "Khoa học viễn tưởng", mobileName: "Sci-Fi", slug: "Khoa Học Viễn Tưởng", icon: "bx-planet", color: "text-cyan-400" },
    { name: "Phiêu lưu", mobileName: "Phiêu lưu", slug: "Phiêu Lưu", icon: "bx-world", color: "text-green-400" },
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ ENHANCED: Close everything when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
      if (!event.target.closest('.mobile-search-container')) {
        setShowMobileSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ ENHANCED: Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
    setShowMobileSearch(false);
  }, [navigate]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
      setIsMobileMenuOpen(false);
      setSearchFocused(false);
      setShowMobileSearch(false);
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
        {/* ✅ MAIN NAVBAR - Optimized height for mobile */}
        <div className="container max-w-screen-xl mx-auto py-2 sm:py-3 px-3 sm:px-4 flex items-center justify-between">
          
          {/* ✅ LOGO - Smaller on mobile */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
              <div className="relative">
                <img
                  src="https://ik.imagekit.io/thinhpx33/logo.png?updatedAt=1746706738519"
                  alt="logo"
                  className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-lg sm:text-xl bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  MovieCity
                </h1>
                <p className="text-white/60 text-xs hidden md:block">Xem phim HD miễn phí</p>
              </div>
            </Link>
          </div>

          {/* ✅ DESKTOP SEARCH - Hidden on mobile */}
          <div className="hidden md:flex flex-1 mx-4 lg:mx-8 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className={`flex items-center bg-white/10 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${
                searchFocused 
                  ? 'border-yellow-400/50 shadow-lg shadow-yellow-400/20' 
                  : 'border-white/20 hover:border-white/30'
              }`}>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-xl m-1 text-black hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 hover:scale-105"
                >
                  <i className="bx bx-search-alt text-lg lg:text-xl font-bold"></i>
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
              
              {/* Search suggestions */}
              {searchFocused && searchKeyword && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 max-h-64 overflow-y-auto">
                  <div className="text-white/60 text-sm p-3 text-center">
                    Nhấn Enter để tìm kiếm "{searchKeyword}"
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ✅ MOBILE ACTIONS - Search + Menu */}
          <div className="flex md:hidden items-center gap-1">
            {/* Mobile Search Button */}
            <button
              onClick={toggleMobileSearch}
              className={`text-white p-2 rounded-xl transition-all duration-300 ${
                showMobileSearch ? 'bg-yellow-400/20 text-yellow-400' : 'hover:bg-white/10'
              }`}
            >
              <i className="bx bx-search-alt text-xl"></i>
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className={`text-white p-2 rounded-xl transition-all duration-300 ${
                isMobileMenuOpen ? 'bg-yellow-400/20 text-yellow-400' : 'hover:bg-white/10'
              }`}
            >
              <i className={`bx text-xl transition-transform duration-300 ${
                isMobileMenuOpen ? "bx-x rotate-180" : "bx-menu"
              }`}></i>
            </button>
          </div>

          {/* ✅ DESKTOP MENU */}
          <ul className="hidden lg:flex gap-4 xl:gap-6 font-medium text-sm items-center">
            <li>
              <Link
                to="/"
                className="text-white text-base font-medium hover:text-yellow-400 relative transition-all duration-300 group flex items-center px-3 xl:px-4 py-2 rounded-2xl hover:bg-white/10"
              >
                <i className="bx bx-home-alt-2 mr-2 text-lg"></i>
                Trang chủ
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            </li>
            
            <li className="relative dropdown-container">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white text-base font-medium hover:text-yellow-400 transition-all duration-300 group flex items-center px-3 xl:px-4 py-2 rounded-2xl hover:bg-white/10"
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
              <div className="px-3 xl:px-4 py-2 rounded-2xl hover:bg-white/10 transition-all duration-300">
                <AboutNavbar />
              </div>
            </li>
          </ul>
        </div>

        {/* ✅ MOBILE SEARCH BAR - Separate compact row */}
        {showMobileSearch && (
          <div className="md:hidden mobile-search-container bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-3 py-2">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 w-8 h-8 flex items-center justify-center rounded-lg m-1 text-black transition-all duration-300"
                >
                  <i className="bx bx-search-alt text-sm font-bold"></i>
                </button>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm kiếm phim..."
                  className="font-medium placeholder:text-white/50 text-sm w-full bg-transparent border-none px-2 py-2 text-white focus:outline-none"
                  autoFocus
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword("")}
                    className="text-white/50 hover:text-white p-1.5 transition-colors"
                  >
                    <i className="bx bx-x text-lg"></i>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ✅ ENHANCED MOBILE MENU - More compact */}
        <div
          className={`md:hidden transition-all duration-500 transform ${
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
                  className="flex items-center px-4 py-3 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="bx bx-home-alt-2 mr-3 text-lg"></i>
                  <span className="font-medium">Trang chủ</span>
                </Link>
              </li>
              
              <li>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300"
                >
                  <div className="flex items-center">
                    <i className="bx bx-category mr-3 text-lg"></i>
                    <span className="font-medium">Thể loại</span>
                  </div>
                  <i className={`bx bx-chevron-down text-lg transition-transform duration-300 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}></i>
                </button>
                
                {/* ✅ MOBILE CATEGORIES GRID - More compact */}
                {isDropdownOpen && (
                  <div className="bg-white/5 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {categories.map((category, index) => (
                        <button
                          key={category.slug}
                          onClick={() => handleCategorySelect(category.slug)}
                          className="flex items-center p-2 text-white hover:bg-white/10 hover:text-yellow-400 transition-all duration-300 rounded-lg text-sm"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <i className={`bx ${category.icon} mr-2 text-base ${category.color}`}></i>
                          <span className="truncate">{category.mobileName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
              
              <li>
                <div className="px-4 py-3 hover:bg-white/10 transition-all duration-300">
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