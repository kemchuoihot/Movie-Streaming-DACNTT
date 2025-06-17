import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const Section = ({
  title,
  movies,
  link,
  favorites = [],
  layout = "vertical",
}) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };

  // Giới hạn tối đa 4 phim cho layout dọc
  const displayedMovies = layout === "vertical" ? movies.slice(0, 4) : movies;

  return (
    <div
      className={`relative py-12 lg:py-16 ${
        layout === "vertical"
          ? "bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900"
          : "bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900"
      }`}
    >
      <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-2">
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold font-[Montserrat] text-transparent bg-clip-text ${
                layout === "vertical"
                  ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"
                  : "bg-gradient-to-r from-orange-400 via-pink-500 to-red-500"
              }`}
            >
              {title}
            </h1>
            <div
              className={`w-24 h-1 rounded-full ${
                layout === "vertical"
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500"
                  : "bg-gradient-to-r from-orange-500 to-pink-500"
              }`}
            ></div>
          </div>

          {link && (
            <Link
              to={link}
              className={`group flex items-center px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                layout === "vertical"
                  ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
                  : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30"
              }`}
            >
              Xem Thêm
              <i className="bx bx-right-arrow-alt ml-2 text-lg group-hover:translate-x-1 transition-transform duration-300"></i>
            </Link>
          )}
        </div>

        {layout === "vertical" ? (
          // Grid Layout (Vertical) - Fixed overflow and increased height
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {displayedMovies.length > 0 ? (
              displayedMovies.map((item) => (
                <Link
                  key={item.slug}
                  to={`/detail/${item.slug}`}
                  className="group"
                >
                  <div className="relative bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 overflow-hidden">
                    <div className="relative overflow-hidden rounded-xl">
                      <LazyLoadImage
                        effect="blur"
                        src={item.thumb_url}
                        alt={item.name}
                        className="w-full h-56 sm:h-64 lg:h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-white/90 backdrop-blur text-black rounded-full p-4 hover:bg-white transition-colors shadow-lg">
                          <i className="bx bx-play text-2xl"></i>
                        </button>
                      </div>

                      {/* Badges */}
                      {favorites.includes(item.slug) && (
                        <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          <i className="bx bxs-heart"></i>
                        </span>
                      )}
                      {(() => {
                        let quality = (item.quality || "HD").toUpperCase();
                        let badgeClass =
                          "bg-gradient-to-r from-blue-500 to-purple-600";
                        if (quality === "4K") {
                          badgeClass =
                            "bg-gradient-to-r from-yellow-400 to-yellow-600";
                        } else if (quality === "FHD" || quality === "FULL HD") {
                          badgeClass =
                            "bg-gradient-to-r from-green-400 to-green-600";
                          quality = "FHD";
                        } else if (quality === "HD") {
                          badgeClass =
                            "bg-gradient-to-r from-blue-500 to-purple-600";
                        } else if (quality === "CAM") {
                          badgeClass =
                            "bg-gradient-to-r from-gray-500 to-gray-700";
                        }
                        return (
                          <span
                            className={`absolute top-2 left-2 ${badgeClass} text-white text-xs font-bold px-2 py-1 rounded-full`}
                          >
                            {quality}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Movie Info */}
                    <div className="mt-4 space-y-2">
                      <h3 className="text-white font-semibold text-sm lg:text-base truncate group-hover:text-cyan-400 transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{item.year}</span>
                        {item.genre && (
                          <span className="bg-gray-700/50 px-2 py-1 rounded-full text-xs">
                            {item.genre.split(",")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <i className="bx bx-film text-4xl text-gray-600 mb-4"></i>
                <p className="text-gray-400">
                  Không có phim trong danh mục này.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Horizontal Carousel Layout - Fixed overflow
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={scrollLeft}
              className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <i className="bx bx-chevron-left text-2xl"></i>
            </button>

            <div
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex space-x-4 pb-4">
                {displayedMovies.length > 0 ? (
                  displayedMovies.map((item, index) => (
                    <Link
                      key={item.slug}
                      to={`/detail/${item.slug}`}
                      className="flex-shrink-0 group"
                    >
                      <div className="relative bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 w-48 sm:w-56 overflow-hidden">
                        <div className="relative overflow-hidden rounded-xl">
                          <LazyLoadImage
                            effect="blur"
                            src={item.poster_url}
                            alt={item.name}
                            className="w-full h-64 sm:h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="bg-white/90 backdrop-blur text-black rounded-full p-4 hover:bg-white transition-colors shadow-lg">
                              <i className="bx bx-play text-2xl"></i>
                            </button>
                          </div>

                          {/* Badges */}
                          {favorites.includes(item.slug) && (
                            <span className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              <i className="bx bxs-heart"></i>
                            </span>
                          )}
                          {(() => {
                            let quality = (item.quality || "HD").toUpperCase();
                            let badgeClass =
                              "bg-gradient-to-r from-blue-500 to-purple-600";
                            if (quality === "4K") {
                              badgeClass =
                                "bg-gradient-to-r from-yellow-400 to-yellow-600";
                            } else if (
                              quality === "FHD" ||
                              quality === "FULL HD"
                            ) {
                              badgeClass =
                                "bg-gradient-to-r from-green-400 to-green-600";
                              quality = "FHD";
                            } else if (quality === "HD") {
                              badgeClass =
                                "bg-gradient-to-r from-blue-500 to-purple-600";
                            } else if (quality === "CAM") {
                              badgeClass =
                                "bg-gradient-to-r from-gray-500 to-gray-700";
                            }
                            return (
                              <span
                                className={`absolute top-2 left-2 ${badgeClass} text-white text-xs font-bold px-2 py-1 rounded-full`}
                              >
                                {quality}
                              </span>
                            );
                          })()}

                          {/* Mobile Index */}
                          <div className="lg:hidden absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </div>
                        </div>

                        {/* Movie Info */}
                        <div className="mt-4 space-y-2">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate group-hover:text-orange-400 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{item.year}</span>
                            {item.genre && (
                              <span className="bg-gray-700/50 px-2 py-1 rounded-full text-xs">
                                {item.genre.split(",")[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="w-full text-center py-12">
                    <i className="bx bx-film text-4xl text-gray-600 mb-4"></i>
                    <p className="text-gray-400">
                      Không có phim trong danh mục này.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={scrollRight}
              className="hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 backdrop-blur text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110"
            >
              <i className="bx bx-chevron-right text-2xl"></i>
            </button>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div
        className={`absolute top-10 left-10 w-20 h-20 rounded-full blur-xl ${
          layout === "vertical"
            ? "bg-gradient-to-r from-cyan-600/20 to-purple-600/20"
            : "bg-gradient-to-r from-orange-600/20 to-pink-600/20"
        }`}
      ></div>
      <div
        className={`absolute bottom-10 right-1/4 w-32 h-32 rounded-full blur-2xl ${
          layout === "vertical"
            ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20"
            : "bg-gradient-to-r from-pink-600/20 to-red-600/20"
        }`}
      ></div>
    </div>
  );
};

export default Section;
