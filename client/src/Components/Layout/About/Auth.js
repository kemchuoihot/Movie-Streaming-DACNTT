// Giả sử trạng thái đăng nhập được lưu trữ ở đâu đó (ví dụ: localStorage, context)
const getAuthToken = () => localStorage.getItem('authToken');
const isLoggedIn = () => !!getAuthToken();

// Thông tin người dùng giả định (thay bằng dữ liệu thực tế)
const getUserInfo = () => {
  if (isLoggedIn()) {
    return {
      username: 'example_user',
      email: 'user@example.com',
      // Thêm các thông tin người dùng khác
    };
  }
  return null;
};

const login = (authToken) => {
  localStorage.setItem('authToken', authToken);
  // Thực hiện các hành động khác sau khi đăng nhập (ví dụ: cập nhật context)
};

const logout = () => {
  localStorage.removeItem('authToken');
  // Thực hiện các hành động khác sau khi đăng xuất (ví dụ: cập nhật context)
};

export { isLoggedIn, getUserInfo, login, logout, getAuthToken };