import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const Section = ({ title, movies, link, favorites = [] }) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  // Kiểm tra nếu section là "PHIM HÀNH ĐỘNG" để áp dụng giao diện khác
  const isActionSection = title === "PHIM HÀNH ĐỘNG:";

  // Giới hạn tối đa 4 phim cho "PHIM HÀNH ĐỘNG"
  const displayedMovies = isActionSection ? movies.slice(0, 4) : movies;

  return (
    <div className={`h-auto sm:p-10 relative ${isActionSection ? "bg-[#1a2634]" : "bg-[#0e1d2e]"}`}>
      <div className="relative sm:rounded-lg sm:px-5 container max-w-screen-xl mx-auto">
        <div className="flex justify-between pt-5">
          <div className="inline-block">
            <h1
              className={`text-lg md:text-2xl font-bold font-[Montserrat] sm:ml-5 relative inline-block text-transparent bg-clip-text animate-gradient ${
                isActionSection
                  ? "bg-gradient-to-br from-[#00c4ff] to-[#ff00ff]"
                  : "bg-gradient-to-br from-[#ff8a00] to-[#ff2070]"
              }`}
            >
              {title}
            </h1>
            <div
              className={`w-full h-[1px] text-transparent sm:ml-5 ${
                isActionSection
                  ? "bg-gradient-to-br from-[#00c4ff] to-[#ff00ff]"
                  : "bg-gradient-to-br from-[#ff8a00] to-[#ff2070]"
              }`}
            ></div>
          </div>
          {link && (
            <Link
              to={link}
              className={`text-sm font-medium ${
                isActionSection ? "text-cyan-400 hover:text-cyan-300" : "text-blue-400 hover:text-blue-300"
              }`}
            >
              Xem Thêm <i className="bx bx-right-arrow-alt"></i>
            </Link>
          )}
        </div>

        {isActionSection ? (
          // Giao diện dạng lưới cho "PHIM HÀNH ĐỘNG" với tối đa 4 phim
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6">
            {displayedMovies.length > 0 ? (
              displayedMovies.map((item) => (
                <Link key={item.slug} to={`/detail/${item.slug}`}>
                  <div className="relative rounded-lg shadow-lg group">
                    <LazyLoadImage
                      effect="blur"
                      src={item.thumb_url} // Sử dụng thumb_url
                      alt={item.name}
                      className="w-full h-40 sm:h-48 object-cover rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                    {favorites.includes(item.slug) && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        <i className="bx bxs-heart"></i>
                      </span>
                    )}
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                      HD
                    </span>
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 rounded-lg">
                      <button className="bg-white text-black rounded-full p-2 hover:bg-gray-200 transition-colors">
                        <i className="bx bx-play text-xl"></i>
                      </button>
                      <h3 className="text-white text-xs font-medium text-center mt-1">{item.name}</h3>
                      <p className="text-gray-300 text-xs mt-1">Năm: {item.year}</p>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-white text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-xs">Thể loại: {item.genre}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-white text-center w-full col-span-full">Không có phim trong danh mục này.</p>
            )}
          </div>
        ) : (
          // Giao diện carousel ngang cho các section khác (như "PHIM MỚI CẬP NHẬT")
          <>
            <button
              onClick={scrollLeft}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:scale-110 transition-transform duration-300 absolute -left-10 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10"
            >
              <i className="bx bx-chevron-left text-2xl"></i>
            </button>
            <div
              ref={scrollRef}
              className="overflow-x-auto whitespace-nowrap py-4 no-scrollbar snap-mandatory snap-x"
            >
              {displayedMovies.length > 0 ? (
                displayedMovies.map((item, index) => (
                  <Link key={item.slug} to={`/detail/${item.slug}`}>
                    <div className="inline-block p-2 snap-start">
                      <div className="relative rounded-lg shadow-lg group" style={{ willChange: "transform, opacity" }}>
                        <LazyLoadImage
                          effect="blur"
                          src={item.poster_url}
                          alt={item.name}
                          className="w-full h-80 md:w-[200px] md:h-80 object-cover rounded-lg transition-transform duration-300 ease-in-out group-hover:scale-105 backface-visibility-hidden"
                        />
                        {favorites.includes(item.slug) && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                            <i className="bx bxs-heart"></i>
                          </span>
                        )}
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          HD
                        </span>
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 rounded-lg">
                          <button className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors">
                            <i className="bx bx-play text-2xl"></i>
                          </button>
                          <h3 className="text-white text-sm font-medium text-center mt-2">{item.name}</h3>
                          <p className="text-gray-300 text-xs mt-1">Năm: {item.year}</p>
                        </div>
                        <div className="sm:hidden block">
                          <h1 className="text-2xl font-bold font-[Montserrat] italic bg-gradient-to-br from-[#fecf59] to-[#fff1cc] inline-block text-transparent bg-clip-text">
                            {index + 1}
                          </h1>
                          <h1 className="max-w-40 text-xl font-[Montserrat] italic text-ellipsis overflow-hidden whitespace-nowrap font-bold inline-block text-white relative ml-1 top-2">
                            {item.name}
                          </h1>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-white text-center w-full">Không có phim trong danh mục này.</p>
              )}
            </div>
            <button
              onClick={scrollRight}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:scale-110 transition-transform duration-300 absolute -right-10 top-1/2 transform -translate-y-1/2 p-3 rounded-full shadow-lg z-10"
            >
              <i className="bx bx-chevron-right text-2xl"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Section;