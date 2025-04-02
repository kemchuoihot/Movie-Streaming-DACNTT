import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMovieDetails } from "../../api/api"; // Import fetchMovieDetails
import { Link } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import Footer from "../Footer/Footer";


const Watch = () => {
  const { slug } = useParams();
  const [film, setFilm] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [movie, setMovie] = useState(0);
  const [currentEp, setCurrentEp] = useState(0);

  useEffect(() => {
    const fetchFilm = async () => {
      try {
        const filmData = await fetchMovieDetails(slug);
        setFilm(filmData);
        // if (filmData.episodes[0].server_data.length ==1) {
        //   setMovie(true);
        // }
        setCurrentEp(filmData.episodes[0].server_data[0].slug);
        // console.log(filmData);
      } catch (error) {
        console.error("Failed to fetch film:", error);
      }
    };

    fetchFilm();
  }, [slug]);
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

  if (!film) {
    return <div className="h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div>
      {/* <h1>{film.movie.name}</h1> */}
      <header
        className={`fixed top-0 left-0 w-full z-20 transition-all duration-500 ${
          scrolled
            ? "bg-gray-900 bg-opacity-90 border-indigo-600"
            : "bg-transparent"
        }`}
      >
        <div className="container max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">
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
                <Link to="/" className="text-white text-base font-medium hover:text-blue-400 relative transition-all group">
                  <i className='bx bx-home-alt-2 mr-1'></i>Trang chủ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <Link to="/category/phim-le/1" className="text-white text-base font-medium hover:text-blue-400 transition-all group relative">
                  <i className='bx bx-movie mr-1'></i>Phim lẻ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <Link to="/category/phim-bo/1" className="text-white text-base font-medium hover:text-blue-400 transition-all group relative">
                  <i className='bx bx-tv mr-1'></i>Phim bộ
                  <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                  <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white text-base font-medium hover:text-blue-400 transition-all group relative">
                  <i className='bx bx-user mr-1'></i>About
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
        <iframe
          title={`Watch ${film.movie.name}`}
          src={film.episodes[0].server_data[movie].link_embed}
          width=""
          height=""
          allowFullScreen
          className="absolute inset-0 mt-20 mx-auto lg:w-[85%] lg:h-[90%] h-[80%] w-[100%]"
        ></iframe>
      </div>
      <div className="bg-[#06121e] h-auto pb-10">
        <div className="container mx-auto max-w-screen-xl p-3">
          <h3 className="text-white pt-10 font-[Montserrat] font-bold text-xl">
            <i class="bx bxs-playlist text-red-500 mr-3"></i>
            Danh sách tập phim:{" "}
          </h3>
          <div className="flex flex-wrap justify-center lg:justify-normal">
            {film &&
              film.episodes[0].server_data.map((episode, i) => (
                <div key={episode.id} className="text-white">
                  <button
                    onClick={() => {
                      setMovie(i);
                      setCurrentEp(episode.slug);
                    }}
                    className={
                      episode.slug === currentEp
                        ? "bg-gradient-to-r from-[#203d5a] to-[#1a2e3f] text-white px-4 py-2 mr-2 mt-4 w-28 rounded-lg border-2 shadow-lg transform transition-transform duration-300 hover:scale-105"
                        : "bg-gradient-to-r from-purple-600 to-[#203d5a] text-white px-4 py-2 mr-2 mt-4 w-28 rounded-lg shadow-md transform transition-transform duration-300 hover:scale-105"
                    }
                    // "text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
                  >
                    {episode.name}
                  </button>
                </div>
              ))}
          </div>
          <div className="">
            <h1 className="text-3xl text-white font-bold font-[Montserrat] mt-10">
              {film.movie.name}
              <span className="bg-yellow-500 text-black rounded ml-5 text-2xl">
                {film.movie.quality}
              </span>
            </h1>
            <h1 className="text-xl text-gray-300 font-light my-2 block">
              {film.movie.origin_name}
              <h3 className="text-red-700 inline font-medium">({film.movie.year})</h3>
            </h1>
            <h6 className="text-white border-2 p-1 inline text-sm rounded-lg border-red-600 mr-10">
              {film.movie.status === "ongoing" ? "Đang chiếu" : "Hoàn Thành"}
            </h6>
            <h3 className="text-white inline mr-10">{film.movie.time}</h3>
            <h4 className="text-white inline">
              {film.movie.episode_current}/{film.movie.episode_total}
            </h4>
            <p className="text-white my-5">{film.movie.content}</p>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Đạo diễn: </span>
              {film.movie.director}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Diễn viên: </span>{" "}
              {film.movie.actor[0] + ", " + film.movie.actor[1] + "..."}
            </h3>
            <h3 className="text-white">
              <span className="text-red-700 font-semibold">Thể loại: </span>{" "}
              {film.movie.category.map((e) => e.name).join(", ")}
            </h3>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Watch;
