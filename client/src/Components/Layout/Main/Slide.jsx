import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Slide = ({ movies, toggleContent, showFullContent }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);

  // Nếu movies chưa có, hiển thị skeleton
  if (!movies || movies.length === 0) {
    return (
      <div className="relative h-[600px] md:h-[800px]">
        <Skeleton height={800} className="w-full h-full relative" />
      </div>
    );
  }

  const thumbnails = movies.slice(0, 3); // Chỉ lấy 3 phim
  const currentMovie = movies[currentIndex];

  const goToSlide = (index) => {
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
  };

  // Xử lý description
  const description = currentMovie.content || 'Không có mô tả cho bộ phim này.';

  // Sử dụng wrapperClassName để kiểm soát thẻ span bọc ngoài của LazyLoadImage
  return (
    <div className="relative">
      <div
        style={{ backgroundImage: `url(${currentMovie.thumb_url})` }}
        className="w-full h-screen relative bg-cover bg-center transition-opacity duration-500 ease-in-out"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-gray-950 via-gray-900/50 to-transparent flex items-center justify-between lg:px-40 space-y-4">
          {/* Phần bên trái - Text và Button */}
          <div
            className={`relative w-1/2 ml-10 lg:ml-0 z-10 animate-slide-left ${
              prevIndex !== null && prevIndex < currentIndex ? 'animate-slide-left-out' : ''
            } ${
              prevIndex !== null && prevIndex > currentIndex ? 'animate-slide-right-in' : ''
            }`}
          >
            <h2 className="text-white text-xl md:text-4xl font-black font-[Montserrat] drop-shadow-lg">
              {currentMovie.name}
            </h2>
            <p className="text-white text-base md:text-2xl font-semibold my-4 font-[Montserrat]">
              Năm: {currentMovie.year}
            </p>
            <p className="text-white text-sm md:text-base my-4">
              {showFullContent
                ? description
                : `${description?.substring(0, 200)}...`}
              {description?.length > 200 && (
                <button
                  onClick={toggleContent}
                  className="text-blue-400 opacity-80 ml-2 hover:text-blue-300 transition-colors"
                >
                  {showFullContent ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </p>
            <p className="text-white text-sm md:text-base mb-5">{currentMovie.time}</p>
            <Link to={`/detail/${currentMovie.slug}`}>
              <button className="relative inline-flex items-center justify-center p-3 md:p-4 px-4 md:px-6 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out rounded-lg shadow-xl group hover:ring-1 hover:ring-purple-500">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-700"></span>
                <span className="absolute bottom-0 right-0 block w-32 h-32 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative text-white text-sm md:text-base font-semibold">
                  Xem Ngay
                </span>
              </button>
            </Link>
          </div>
          {/* Phần bên phải - Poster */}
          <div
            className={`relative w-1/2 mx-auto flex justify-end z-10 animate-slide-right ${
              prevIndex !== null && prevIndex < currentIndex ? 'animate-slide-right-out' : ''
            } ${
              prevIndex !== null && prevIndex > currentIndex ? 'animate-slide-left-in' : ''
            }`}
          >
            <LazyLoadImage
              effect="blur"
              src={currentMovie.poster_url}
              alt={currentMovie.name}
              placeholderSrc="https://via.placeholder.com/150x225?text=Loading..."
              className="w-4/5 float-right md:w-1/2 rounded-lg shadow-2xl transform transition-transform duration-300  object-cover h-full"
            />
          </div>
        </div>
      </div>
      {/* Thumbnail nhỏ bên dưới bên phải */}
      <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
        {thumbnails.map((movie, index) => (
          <div
            key={movie.slug}
            onClick={() => goToSlide(index)}
            className={`relative w-16 h-24 md:w-20 md:h-32 rounded-md overflow-hidden cursor-pointer transition-all duration-300 ${
              index === currentIndex ? 'border-2 border-blue-400' : 'border border-gray-600'
            } hover:border-blue-300`}
          >
            <LazyLoadImage
              effect="blur"
              src={movie.poster_url}
              alt={movie.name}
              placeholderSrc="https://via.placeholder.com/80x120?text=Loading..."
              className="w-full h-full object-cover"
              wrapperClassName="w-full h-full flex items-center" // Thêm dòng này
            />
            {index === currentIndex && (
              <div className="absolute inset-0 bg-blue-400 bg-opacity-30"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slide;