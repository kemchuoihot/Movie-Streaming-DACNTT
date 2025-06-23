import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://movie-streaming-dacntt-production.up.railway.app/api/movies'
  : 'http://localhost:5000/api/movies';
// Lấy danh sách phim mới cập nhật
export const fetchDataFromAPI = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/new`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy chi tiết phim
export const fetchMovieDetails = async (slug) => {
  try {
    const response = await axios.get(`${BASE_URL}/${slug}`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Lấy phim theo danh mục
export const fetchMovieByCategory = async (category, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/category/${category}`, {
      params: { page, limit },
    });
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Tìm kiếm phim
export const fetchMovieBySearch = async (query, limit = 100) => {
  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: { keyword: query, limit },
    });
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};