import React, { useState, useEffect, useRef } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { fetchDataFromAPI, fetchMovieDetails } from "../../../api/api.js";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Slide from "./Slide.jsx";

const Main = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const [slug, setSlug] = useState(null);
  const [movie, setMovie] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    let isMounted = true; // Track if the component is mounted

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchDataFromAPI();
        if (response && response.items) {
          setData(response.items);
          console.log(response);
          // Lấy chỉ số ngẫu nhiên từ 0 đến 9
          // const randomIndex = Math.floor(Math.random() * 10);
          // setSlug(response.items[randomIndex].slug);
          setSlug(response.items[0].slug);
        } else {
          setError("No items found in response");
        }
        // console.log(response);
      } catch (error) {
        if (isMounted) {
          setError(error.message);
        }
        console.error(error.message);
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Cleanup function to set isMounted to false
    };
  }, []);
  useEffect(() => {
    const getMovieDetails = async () => {
      try {
        const data = await fetchMovieDetails(slug);
        setMovie(data);
        // console.log(data);
      } catch (error) {
        setError(error.message);
      }
    };

    getMovieDetails();
  }, [slug]);

  const scrollLeft = () => {
    scrollContainerRef.current.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current.scrollBy({ left: 400, behavior: "smooth" });
  };
  const toggleContent = () => {
    setShowFullContent(!showFullContent);
  };

  if (loading) {
    return (
      <SkeletonTheme baseColor="#151d25" highlightColor="#525252">
        <div className="relative h-[600px] md:h-[800px]">
          {/* <Skeleton height={800} className="w-full h-full relative " /> */}
          <div className="absolute left-0 w-full h-full bg-gradient-to-r from-gray-950 bg-gray-950 bg-opacity-60 flex items-center justify-between lg:px-40 space-y-4">
            <div className="relative w-1/2 ml-10 lg:ml-0">
              <Skeleton className="mb-4 !w-[180px] !h-[30px] md:!w-[300px] md:!h-[40px]" />
              <Skeleton className="mb-4 !w-[100px] !h-[20px]  md:!w-[200px] md:!h-[30px]" />
              <Skeleton count={3} className="mb-4" />
              <Skeleton className="mb-5 !w-[60px] !h-[15px]  md:!w-[100px] md:!h-[20px]" />
              <Skeleton
                width={150}
                height={50}
                className="rounded-lg !w-[100px] !h-[30px]  md:!w-[150px] md:!h-[50px]"
              />
            </div>
            <div className="relative w-1/2 mx-auto flex justify-center">
              <Skeleton
                // width={400}
                // height={500}
                className="rounded-lg mx-auto !h-[250px] !w-[150px] md:!h-[400px] md:!w-[300px] lg:!h-[530px] lg:!w-[400px]"
              />
            </div>
          </div>
        </div>
      </SkeletonTheme>
    );
  }
  return (
    <>
      {(
        <div>
          <Slide
            movie={movie}
            showFullContent={showFullContent}
            toggleContent={toggleContent}
            data={data}
          />
        </div>
      ) || (
        <SkeletonTheme baseColor="#151d25" highlightColor="#525252">
          <Skeleton height={800} className="w-full h-full relative " />
        </SkeletonTheme>
      )}

      {data.length > 0 && (
        <div className="bg-[#06121e] h-auto sm:p-10  relative">
          <div className="relative bg-[#0e274073] sm:rounded-lg sm:px-5 container max-w-screen-xl mx-auto">
            {data.length > 0 && (
              <div className="flex justify-between pt-5">
                <div className="inline-block">
                  <h1 className="text-lg md:text-2xl font-bold font-[Montserrat] sm:ml-5 relative bg-gradient-to-br from-[#ff8a00]  to-[#ff2070] inline-block text-transparent bg-clip-text">
                    PHIM MỚI CẬP NHẬT:
                  </h1>
                  <div className="w-full h-[1px] text-transparent bg-gradient-to-br from-[#ff8a00]  to-[#ff2070] sm:ml-5"></div>
                </div>
                {/* <Link to={`/category/phim-bo/1`}>
                  <button className="text-white  md:tracking-widest rounded-xl w-40  hover:from-black hover:to-black transition duration-300 mb-1 text-right">
                    Xem thêm
                  </button>
                </Link> */}
              </div>
            )}
            <button
              onClick={scrollLeft}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-300 font-medium absolute -left-10 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded-full"
            >
              &lt;
            </button>
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto whitespace-nowrap py-4 no-scrollbar snap-mandatory snap-x"
            >
              {data.length > 0 ? (
                data.map((item,index) => (
                  <Link to={`/detail/${item.slug}`}>
                    <div
                      key={item.id}
                      className="inline-block p-2 transform transition-transform duration-300 hover:scale-105 snap-start"
                    >
                      <div className="sm:rounded-lg sm:shadow-lg">
                        <LazyLoadImage
                          effect="blur"
                          src={item.poster_url}
                          alt="poster"
                          className="w-full h-80 md:w-[184px] md:h-80 object-cover rounded-lg hover:shadow-lg transition duration-300 hover:shadow-sky-950"
                        />
                        <div className=" sm:hidden block">
                          <h1 className="text-2xl font-bold font-[Montserrat] italic bg-gradient-to-br from-[#fecf59] to-[#fff1cc] inline-block text-transparent bg-clip-text">{index+1}</h1>
                          <h1 className="max-w-40 text-xl font-[Montserrat] italic text-ellipsis overflow-hidden whitespace-nowrap font-bold inline-block text-white relative ml-1 top-2">{item.name}</h1>
                          {/* <p className="text-gray-500">{item.description}</p> */}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div>Loading</div>
              )}
            </div>
            <button
              onClick={scrollRight}
              className="hidden sm:block text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-300 absolute -right-10 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded-full"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Main;
