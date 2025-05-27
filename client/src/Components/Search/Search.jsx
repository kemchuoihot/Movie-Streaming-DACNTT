import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { fetchDataFromAPI } from "../../api/api.js";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import NavBar from "../Layout/Navbar/NavBar.jsx";

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] z-50 animate-fadeIn">
        <Skeleton count={6} height={260} width={180} className="mx-4 rounded-2xl backdrop-blur-sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
        <div className="bg-[#182c3a]/80 px-8 py-6 rounded-2xl shadow-2xl text-white text-lg font-semibold backdrop-blur-md">
          Lỗi: {error}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <>
        <NavBar />
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] animate-fadeIn">
          <div className="bg-[#182c3a]/80 px-8 py-6 rounded-2xl shadow-2xl text-white text-lg font-semibold backdrop-blur-md text-center">
            Không tìm thấy phim nào với từ khóa{" "}
            <span className="text-yellow-400 font-bold">{query}</span>
          </div>
          <Link to="/" className="mt-6">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
              <i className="bx bx-home mr-2"></i>Về Trang Chủ
            </button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative animate-fadeIn">
      <NavBar />
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-3xl mt-20 sm:text-4xl font-extrabold font-[Montserrat] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-tight drop-shadow-lg neon-text">
            Kết quả tìm kiếm cho <span className="font-bold">{query}</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mt-4 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map((movie, idx) => (
            <Link
              key={movie.slug}
              to={`/detail/${movie.slug}`}
              className="group relative rounded-lg overflow-hidden shadow-lg bg-[#1a2a3a]/80 hover:shadow-2xl transition-all duration-300 will-change-transform"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="relative h-80 md:h-80">
                <LazyLoadImage
                  effect="blur"
                  src={movie.poster_url}
                  alt={movie.name}
                  className="w-full h-full object-cover rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105 backface-visibility-hidden"
                />
                <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
                  <i className="bx bxs-heart"></i>
                </span>
                <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">HD</span>
                <span className="absolute bottom-2 left-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-[#1a2a3a] text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  {movie.year}
                </span>
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 rounded-lg">
                  <button className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors">
                    <i className="bx bx-play text-2xl"></i>
                  </button>
                  <h3 className="text-white text-sm font-medium text-center mt-2">{movie.name}</h3>
                  <p className="text-gray-300 text-xs mt-1">Năm: {movie.year}</p>
                </div>
                <div className="sm:hidden block absolute bottom-2 left-2">
                  <h1 className="text-2xl font-bold font-[Montserrat] italic bg-gradient-to-br from-[#fecf59] to-[#fff1cc] inline-block text-transparent bg-clip-text">
                    {idx + 1}
                  </h1>
                  <h1 className="max-w-40 text-xl font-[Montserrat] italic text-ellipsis overflow-hidden whitespace-nowrap font-bold inline-block text-white relative ml-1 top-2">
                    {movie.name}
                  </h1>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;