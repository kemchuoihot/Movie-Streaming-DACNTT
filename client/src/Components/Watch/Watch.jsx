import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { fetchMovieDetails } from '../../api/api';
import 'boxicons/css/boxicons.min.css';
import Footer from '../Footer/Footer';

const Watch = () => {
  const { slug } = useParams();
  const [film, setFilm] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const filmData = await fetchMovieDetails(slug);
        console.log('Film data:', filmData);
        setFilm(filmData);
      } catch (error) {
        console.error('Failed to fetch film:', error);
      }
    };

    fetchFilm();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (film?.movie?.video_url && videoRef.current) {
      const video = videoRef.current;
      const videoSrc = film.movie.video_url;

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((error) => {
            console.error('Auto-play failed:', error);
          });
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Một số trình duyệt (như Safari) hỗ trợ HLS native
        video.src = videoSrc;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch((error) => {
            console.error('Auto-play failed:', error);
          });
        });
      } else {
        console.error('HLS is not supported in this browser');
      }
    }
  }, [film]);

  if (!film) {
    return <div className="h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div>
      <header
        className={`fixed top-0 left-0 w-full z-20 transition-all duration-500 ${
          scrolled ? 'bg-gray-900 bg-opacity-90 border-indigo-600' : 'bg-transparent'
        }`}
      >
        <div className="container max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <ul className="flex space-x-4 pt-5">
              <li>
                <Link to="/" className="text-white text-lg font-bold hover:text-gray-400">
                  <img
                    src="https://seeklogo.com/images/M/movie-city-hd-logo-D25A7AC34A-seeklogo.com.png"
                    alt="logo"
                    className="w-20 mr-4"
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

      <div
        className="lg:h-screen bg-center h-96 relative bg-cover"
        style={{ backgroundImage: `url(${film.movie.thumb_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#06121e] bg-black bg-opacity-40"></div>
        {film.movie.video_url ? (
          <video
            ref={videoRef}
            controls
            className="absolute inset-0 mt-20 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%]"
            poster={film.movie.poster_url}
          >
            <source src={film.movie.video_url} type="application/vnd.apple.mpegurl" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="absolute inset-0 mt-20 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%] bg-gray-800 flex items-center justify-center text-white">
            No video available
          </div>
        )}
      </div>
      <div className="bg-[#06121e] h-auto pb-10">
        <div className="container mx-auto max-w-screen-xl p-3">
          <div>
            <h1 className="text-3xl text-white font-bold font-[Montserrat] mt-10">
              {film.movie.name}
              {film.movie.quality && (
                <span className="bg-yellow-500 text-black rounded ml-5 text-2xl">
                  {film.movie.quality}
                </span>
              )}
            </h1>
            <h1 className="text-xl text-gray-300 font-light my-2 block">
              {film.movie.origin_name}
              <h3 className="text-red-700 inline font-medium">({film.movie.year})</h3>
            </h1>
            <h6 className="text-white border-2 p-1 inline text-sm rounded-lg border-red-600 mr-10">
              {film.movie.status === 'ongoing' ? 'Đang chiếu' : 'Hoàn Thành'}
            </h6>
            <h3 className="text-white inline mr-10">{film.movie.time}</h3>
            <p className="text-white my-5">{film.movie.content}</p>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Đạo diễn: </span>
              {film.movie.director.join(', ')}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Diễn viên: </span>
              {film.movie.actor.slice(0, 2).join(', ') +
                (film.movie.actor.length > 2 ? '...' : '')}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Thể loại: </span>
              {film.movie.genre || 'N/A'}
            </h3>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Watch;