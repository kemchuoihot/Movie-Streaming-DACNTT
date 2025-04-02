import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import { fetchMovieByCategory } from "../../api/api"; // Import fetchMovieByCategory
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Footer from "../Footer/Footer";


const Category = () => {
  const { category, page } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
  const [totalPages, setTotalPages] = useState(1); // Giả sử bạn có tổng số trang từ API
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading

  useEffect(() => {
    const fetchFilm = async () => {
      setLoading(true); // Bắt đầu loading
      try {
        const response = await fetchMovieByCategory(category, currentPage);
        if (response && response.data.items) {
          setData(response.data.items);
          setTitle(response.data.titlePage);
          setTotalPages(response.data.params.pagination.totalItems); // Giả sử API trả về tổng số trang
        } else {
          setError("No items found in response");
        }
        // console.log(response);
      } catch (error) {
        console.error("Failed to fetch film:", error);
      } finally {
        setLoading(false); // Kết thúc loading
      }
    };

    fetchFilm();
  }, [category, currentPage]);

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

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    navigate(`/category/${category}/${nextPage}`);
  };

  const handlePreviousPage = () => {
    const prevPage = currentPage - 1;
    if (prevPage > 0) {
      setCurrentPage(prevPage);
      navigate(`/category/${category}/${prevPage}`);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
    navigate(`/category/${category}/${pageNumber}`);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = currentPage; i <= Math.min(currentPage + 2, totalPages); i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageClick(i)}
          className={`px-4 py-2 m-2 rounded-lg ${
            i === currentPage ? "bg-[#ff8a00] text-white" : "bg-gray-200 text-black"
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  if (loading) {
    return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-20 transition-all duration-500 ${
          scrolled ? "bg-gray-900 bg-opacity-90" : "bg-transparent"
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
      <div className="bg-[#06121e] h-auto py-20 relative ">
      <div className="relative bg-[#0e274073] sm:rounded-lg sm:px-5 container max-w-screen-xl mx-auto w-full">
        <div className="flex justify-between pt-5 pb-4">
          <div className="inline-block">
            <h1 className="text-lg md:text-2xl font-bold font-[Montserrat] md:ml-5 relative bg-gradient-to-br from-[#ff8a00] to-[#ff2070] inline-block text-transparent bg-clip-text">
              {title}
            </h1>
            <div className="w-full h-[1px] text-transparent bg-gradient-to-br from-[#ff8a00] to-[#ff2070] md:ml-5"></div>
          </div>
          
        </div>
        <div className="grid gap-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4 ">
          {data.length > 0 ? (
            data.map((item) => (
              <Link to={`/detail/${item.slug}`} key={item.id} className="mx-auto">
                <div className="inline-block md:p-3 transform transition-transform duration-300 hover:scale-105 snap-start md:mx-2 hoathinh md:min-h-80 ">
                  <div className="md:rounded-lg shadow-lg">
                    <LazyLoadImage
                      effect="blur"
                      src={`https://phimimg.com/${item.poster_url}`}
                      alt="poster"
                      className="w-full h-80 sm:h-64 md:min-w-[184px] md:h-72 object-cover md:rounded hover:shadow-lg transition duration-300 "
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
            <div>Loading</div>
          )}
        </div>
        <div className="flex justify-center mt-10">
            <button
              onClick={handlePreviousPage}
              className="bg-[#ff8a00] text-white px-4 py-2 m-2 rounded-lg"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {renderPageNumbers()}
            <button
              onClick={handleNextPage}
              className="bg-[#ff8a00] text-white px-4 py-2 m-2 rounded-lg"
            >
              Next
            </button>
          </div>
      </div>
    </div>
      <Footer />
    </>
  );
};

export default Category;