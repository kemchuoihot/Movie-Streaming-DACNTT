import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import { fetchMovieDetails } from '../../api/api';
import 'boxicons/css/boxicons.min.css';
import Footer from '../Footer/Footer';
import NavBar from '../Layout/Navbar/NavBar';

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
      <NavBar/>

      <div
        className="lg:h-screen bg-center h-96 relative bg-cover"
        style={{ backgroundImage: `url(${film.movie.thumb_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#06121e] bg-black bg-opacity-40"></div>
        {film.movie.video_url ? (
          <video
            ref={videoRef}
            controls
            className="absolute inset-0 mt-28 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%]"
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