import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { fetchMovieBySearch } from "../../api/api.js"; // Import API function
import Footer from "../Footer/Footer";

const Search = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const query = new URLSearchParams(location.search);
  const keyword = query.get("keyword");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchMovieBySearch(keyword);
        if (response && response.data.items) {
          setData(response.data.items);
        } else {
          setError("No items found in response");
        }
        // console.log(response);
      } catch (error) {
        setError(error.message);
        console.error(error.message);
      }
      setLoading(false);
    };

    fetchData();
  }, [keyword]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
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

  if (loading) {
    return <div className="h-screen bg-gray-900 text-white">Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-20 transition-all duration-500 ${
          scrolled ? "bg-gray-900 bg-opacity-90" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <ul className="flex space-x-4 pt-5">
              <li>
                <Link
                  to="/"
                  className="text-white text-lg font-bold hover:text-gray-400"
                >
                  <img
                    src="https://seeklogo.com/images/M/movie-city-hd-logo-D25A7AC34A-seeklogo.com.png"
                    alt="logo"
                    className="w-20  mr-4"
                  />
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-3 font-medium text-sm gap-36 xl:gap-14 2xl:gap-20 justify-between lg:flex xl:justify-end items-center hidden">
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
                <Link
                  to="/about"
                  className="text-white text-base font-medium hover:text-blue-400 transition-all group relative"
                >
                  <i className="bx bx-user mr-1"></i>About
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>
      <div className="bg-[#06121e] h-auto py-20  relative">
        <div className="relative bg-[#0e274073] sm:rounded-lg sm:px-5 sm:container mx-auto w-full">
          <div className="flex justify-between pt-5 pb-4">
            <div className="inline-block">
              <h1 className="text-lg md:text-2xl font-bold font-[Montserrat] ml-5 relative bg-gradient-to-br from-[#ff8a00] to-[#ff2070] inline-block text-transparent bg-clip-text">
                Kết quả tìm kiếm cho: {keyword}
              </h1>
              <div className="w-full h-[1px] text-transparent bg-gradient-to-br from-[#ff8a00] to-[#ff2070] ml-5"></div>
            </div>
          </div>
          <div className="grid gap-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4 ">
            {data.length > 0 ? (
              data.map((item) => (
                <Link
                  to={`/detail/${item.slug}`}
                  key={item.id}
                  className="mx-auto"
                >
                  <div className="inline-block md:p-3 transform transition-transform duration-300 hover:scale-105 snap-start md:mx-2 md:min-h-80 ">
                    <div className="rounded-lg shadow-lg">
                      <LazyLoadImage
                        effect="blur"
                        src={`https://phimimg.com/${item.poster_url}`}
                        alt="poster"
                        className="w-full h-80 sm:h-64 md:min-w-[184px] md:h-72 object-cover sm:rounded hover:shadow-lg transition duration-300 "
                      />
                    </div>
                    <h3 className="max-w-[120px] sm:max-w-[150px] md:max-w-[184px] inline-block text-ellipsis overflow-hidden whitespace-nowrap text-[#dbdbdb]">
                      {item.name}
                    </h3>
                    <h4 className="max-w-[120px] sm:max-w-[150px] md:max-w-[184px] text-ellipsis overflow-hidden whitespace-nowrap text-[#7a7a7a] text-xs">
                      {item.origin_name}
                    </h4>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 ml-3 sm:ml-0 col-span-4">
                {/* <img
                  src="https://via.placeholder.com/150"
                  alt="No results"
                  className="mb-8"
                /> */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  No Results Found
                </h2>
                <p className="text-gray-400 mb-8">
                  Sorry, we couldn't find any movies matching your search.
                </p>
                <Link
                  to="/"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Go Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Search;
