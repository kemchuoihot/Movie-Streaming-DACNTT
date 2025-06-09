import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import axios from "axios";
import NavBar from "../Layout/Navbar/NavBar";
import Footer from "../Footer/Footer";

const getTitle = (category) => {
  if (category === "all") return "Phim Mới Cập Nhật";
  return `Danh mục: ${category}`;
};

const CategoryPage = () => {
  const { category, page } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
          params: { page: page || 1, limit: 18 },
        });
        setMovies(
          res.data.items || (res.data.data && res.data.data.items) || []
        );
      } catch (err) {
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryMovies();
  }, [category, page]);

  return (
    <>
      <NavBar />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative animate-fadeIn">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-3xl mt-20 sm:text-4xl font-extrabold font-[Montserrat] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-tight drop-shadow-lg neon-text uppercase">
              {getTitle(category)}
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mt-4 animate-pulse" />
          </div>
          {loading ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="w-40 h-40 border-8 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : movies.length === 0 ? (
            <div className="bg-[#182c3a]/80 px-8 py-6 rounded-2xl shadow-2xl text-white text-lg font-semibold backdrop-blur-md text-center">
              Không có phim nào.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {movies.map((item, idx) => (
                <Link
                  key={item.slug}
                  to={`/detail/${item.slug}`}
                  className="group relative rounded-lg overflow-hidden shadow-lg bg-[#1a2a3a]/80 hover:shadow-2xl transition-all duration-300 will-change-transform"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="relative h-80 md:h-80">
                    <LazyLoadImage
                      effect="blur"
                      src={item.poster_url || item.thumb_url}
                      alt={item.name}
                      className="w-full aspect-[2/3] object-cover rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105 backface-visibility-hidden"
                    />
                    
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      HD
                    </span>
                    <span className="absolute bottom-2 left-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-[#1a2a3a] text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      {item.year}
                    </span>
                    <p className="absolute bottom-2 right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-[#1a2a3a] text-xs font-bold px-2 py-1 rounded-full shadow-md">{item.time || "--"}</p>

                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 rounded-lg">
                      <button className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors">
                        <i className="bx bx-play text-2xl"></i>
                      </button>
                      <h3 className="text-white text-sm font-medium text-center mt-2">
                        {item.name}
                      </h3>
                      <p className="text-gray-300 text-xs mt-1">
                        Năm: {item.year}
                      </p>
                    </div>
                    <div className="sm:hidden block absolute bottom-2 left-2">
                      <h1 className="text-2xl font-bold font-[Montserrat] italic bg-gradient-to-br from-[#fecf59] to-[#fff1cc] inline-block text-transparent bg-clip-text">
                        {idx + 1}
                      </h1>
                      <h1 className="max-w-40 text-xl font-[Montserrat] italic text-ellipsis overflow-hidden whitespace-nowrap font-bold inline-block text-white relative ml-1 top-2">
                        {item.name}
                      </h1>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-white text-base font-bold truncate">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-xs italic truncate">
                      {item.original_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
                      <span>•</span>
                      <div>{item.genre || "--"}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CategoryPage;
