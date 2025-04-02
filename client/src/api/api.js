import axios from 'axios';

export const fetchDataFromAPI = async () => {
  try {
    const response = await axios.get('https://phimapi.com/danh-sach/phim-moi-cap-nhat');
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchMovieDetails = async (slug) => {
  try {
    const response = await axios.get(`https://phimapi.com/phim/${slug}`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const fetchMovieByCategory = async (category, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`https://phimapi.com/v1/api/danh-sach/${category}?page=${page}&limit=${limit}`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

export const fetchMovieBySearch = async (query, limit = 100) => {
  try {
    const response = await axios.get(`https://phimapi.com/v1/api/tim-kiem?keyword=${query}&limit=${limit}`);
    if (response && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    throw new Error(error.message);
  }
}
//  https://phimapi.com/v1/api/tim-kiem?keyword={Từ khóa}&limit={number}