import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import AboutNavbar from "../About/About";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("up");
  const [showAboutNavbar, setShowAboutNavbar] = useState(false);
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
  const handleAboutClick = (e) => {
    e.preventDefault(); // Ngăn chặn hành vi mặc định của link
    setShowAboutNavbar(!showAboutNavbar);
  };
  return (
    <>
       <div
      className={`fixed w-full top-0 z-20 transition-all duration-700 ${
        scrolled ? "sm:bg-gray-900 bg-opacity-90" : "bg-transparent"
      } ${scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"}`}
    >
      <div className="container max-w-screen-xl mx-auto py-3 px-1 sm:py-6 sm:px-2 lg:grid gap-10 grid-cols-11 justify-between items-center">
        <div className="col-span-2 lg:block hidden">
          <Link to="/">
            <img
              src="https://seeklogo.com/images/M/movie-city-hd-logo-D25A7AC34A-seeklogo.com.png"
              alt="logo"
              className="w-full h-10 object-contain rounded-full"
            />
          </Link>
        </div>
        <div className="col-span-4">
          <form
            action={`/search/`}
            method="get"
            className="sm:w-5/6 mx-auto w-4/5 md:w-full text-sm bg-gray-300 rounded-full gap-4 md:ml-0"
          >
            <button
              type="submit"
              className="bg-blue-500 w-12 justify-start h-12 rounded-full text-white"
            >
              <i className="bx bx-search-alt"></i>
            </button>
            <input
              type="text"
              name="keyword"
              placeholder="Tìm phim ở đây ..."
              className="font-medium placeholder:text-gray-600 text-sm w-10/12 bg-transparent border-none px-2 text-black"
            />
          </form>
          </div>
          <div className="col-span-5 font-medium text-sm gap-36 xl:gap-14 2xl:gap-20 justify-between lg:flex xl:justify-end items-center hidden">
            <ul className="flex lg:gap-10 gap-4">
              <li>
                <Link
                  to="/"
                  className="text-white text-base font-medium hover:text-blue-400 relative transition-all group"
                >
                  <i className="bx bx-home-alt-2 mr-1"></i>Trang chủ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <Link
                  to="/category/phim-le/1"
                  className="text-white text-base font-medium hover:text-blue-400 transition-all group relative"
                >
                  <i className="bx bx-movie mr-1"></i>Phim lẻ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <Link
                  to="/category/phim-bo/1"
                  className="text-white text-base font-medium hover:text-blue-400 transition-all group relative"
                >
                  <i className="bx bx-tv mr-1"></i>Phim bộ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <AboutNavbar />
                
              </li>
              
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavBar;
