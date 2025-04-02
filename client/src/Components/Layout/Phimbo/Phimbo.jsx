import React, { useState, useEffect } from "react";
import { fetchMovieByCategory } from "../../../api/api.js";
import { Link } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const Phimbo = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Track if the component is mounted

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetchMovieByCategory("phim-bo");
        if (response && response.data.items) {
          setData(response.data.items);
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

  if (loading) {
    return <div className="h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;

  }

  return (
    <div className="bg-[#06121e] h-auto sm:p-10 relative">
      <div className="relative bg-[#0e274073] sm:rounded-lg sm:px-5 sm:container mx-auto w-full">
        <div className="flex justify-between pt-5 pb-4">
          <div className="inline-block">
            <h1 className="text-lg md:text-2xl font-bold font-[Montserrat] md:ml-5 relative bg-gradient-to-br from-[#ff8a00] to-[#ff2070] inline-block text-transparent bg-clip-text">
              PHIM BỘ:
            </h1>
            <div className="w-full h-[1px] text-transparent bg-gradient-to-br from-[#ff8a00] to-[#ff2070] md:ml-5"></div>
          </div>
          <Link to={`/category/phim-bo/1`}>
            <button className="text-sm md:text-base text-white md:tracking-widest rounded-xl w-40 hover:from-black hover:to-black transition duration-300 mb-1 text-right">
              Xem thêm
            </button>
          </Link>
        </div>
        <div className="grid gap-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-4">
          {data.length > 0 ? (
            data.map((item) => (
              <Link to={`/detail/${item.slug}`} key={item.id} className="mx-auto">
                <div className="inline-block md:p-3 transform transition-transform duration-300 hover:scale-105 snap-start md:mx-2 hoathinh md:min-h-80">
                  <div className="rounded-lg shadow-lg">
                    <LazyLoadImage
                      effect="blur"
                      src={`https://phimimg.com/${item.poster_url}`}
                      alt="poster"
                      className="w-full h-80 sm:h-64 md:min-w-[184px] md:h-72 object-cover sm:rounded hover:shadow-lg transition duration-300"
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
      </div>
    </div>
  );
};

export default Phimbo;