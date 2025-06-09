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
  const navigate = useNavigate();

  // Danh sách category với icon riêng
  const categories = [
    { name: "Hành động", slug: "Hành Động", icon: "bx-run" },
    { name: "Chính kịch", slug: "Chính Kịch", icon: "bx-camera-movie" },
    { name: "Hài hước", slug: "Hài Hước", icon: "bx-happy" },
    { name: "Kinh dị", slug: "Kinh Dị", icon: "bx-ghost" },
    { name: "Tình cảm", slug: "Tình Cảm", icon: "bx-heart" },
  ];

  useEffect(() => {
    let lastScrollY = window.pageYOffset;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;

      if (currentScrollY > lastScrollY) {
        setScrollDirection("down");
      } else {
        setScrollDirection("up");
      }

      lastScrollY = currentScrollY;

      if (currentScrollY > 50) {
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword("");
      setIsMobileMenuOpen(false);
    }
  };

  const handleCategorySelect = (slug) => {
    navigate(`/category/${slug}/1`);
    setIsDropdownOpen(false);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div
        className={`fixed w-full top-0 z-20 transition-all duration-700 ${
          scrolled ? "sm:bg-gray-900 bg-opacity-90" : "bg-transparent"
        } ${scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="container max-w-screen-xl mx-auto py-2 px-2 sm:py-3 sm:px-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src="https://ik.imagekit.io/thinhpx33/logo.png?updatedAt=1746706738519"
                alt="logo"
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover ml-3"
              />
            </Link>
          </div>

          {/* Search Form */}
          <div className="flex-1 mx-2 sm:mx-6">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-gray-300 rounded-full px-2 sm:py-2"
            >
              <button
                type="submit"
                className="bg-blue-500 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full text-white hover:bg-blue-600 transition-colors duration-300"
              >
                <i className="bx bx-search-alt text-lg sm:text-xl"></i>
              </button>
              <input
                type="text"
                name="keyword"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm phim ở đây ..."
                className="font-medium placeholder:text-gray-600 text-xs sm:text-sm w-full bg-transparent border-none px-2 text-black focus:outline-none"
              />
            </form>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-white p-2 rounded-full hover:bg-gray-700 transition-colors duration-300"
            >
              <i className={`bx bx-menu text-2xl ${isMobileMenuOpen ? "hidden" : "block"}`}></i>
              <i className={`bx bx-x text-2xl ${isMobileMenuOpen ? "block" : "hidden"}`}></i>
            </button>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex gap-8 font-medium text-sm items-center">
            <li>
              <Link
                to="/"
                className="text-white text-base font-medium hover:text-blue-400 relative transition-all duration-300 group flex items-center"
              >
                <i className="bx bx-home-alt-2 mr-1"></i>Trang chủ
              </Link>
            </li>
            <li className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white text-base font-medium hover:text-blue-400 transition-all duration-300 group flex items-center"
              >
                <i className="bx bx-category mr-1"></i>Thể loại
                <i className={`bx bx-chevron-down ml-1 text-sm transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}></i>
              </button>
              {isDropdownOpen && (
                <ul className="absolute left-0 mt-2 w-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-md shadow-lg z-10 py-1">
                  {categories.map((category) => (
                    <li
                      key={category.slug}
                      onClick={() => handleCategorySelect(category.slug)}
                      className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer flex items-center transition-colors duration-300"
                    >
                      <i className={`bx ${category.icon} mr-2 text-lg`}></i>{category.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <AboutNavbar />
            </li>
          </ul>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ${
            isMobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <ul className="flex flex-col items-center gap-4 bg-gray-900 bg-opacity-95 py-4">
            <li>
              <Link
                to="/"
                className="text-white text-base font-medium hover:text-blue-400 flex items-center transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="bx bx-home-alt-2 mr-1"></i>Trang chủ
              </Link>
            </li>
            <li className="relative w-full">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-white text-base font-medium hover:text-blue-400 flex items-center justify-center w-full transition-colors duration-300"
              >
                <i className="bx bx-category mr-1"></i>Thể loại
                <i className={`bx bx-chevron-down ml-1 text-sm transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}></i>
              </button>
              {isDropdownOpen && (
                <ul className="mt-2 w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-md shadow-lg">
                  {categories.map((category) => (
                    <li
                      key={category.slug}
                      onClick={() => handleCategorySelect(category.slug)}
                      className="px-4 py-2 text-white hover:bg-gray-700 cursor-pointer flex items-center transition-colors duration-300"
                    >
                      <i className={`bx ${category.icon} mr-2 text-lg`}></i>{category.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
            <li>
              <AboutNavbar />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default NavBar;