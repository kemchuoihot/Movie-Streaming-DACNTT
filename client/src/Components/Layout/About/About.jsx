import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import userImg from './User.jpg'
import { auth } from '../../Login/Firebase';
import { useNavigate } from 'react-router-dom';
function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [username, setUsername] = useState('');
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target) && isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Get the display name from the Firebase User object
        setUsername(user.displayName || 'Người dùng'); 
      } else {
        setUsername(''); // Clear username if no user is logged in
      }
    });
    return () => unsubscribe();
  }, []);
  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log('Người dùng đã đăng xuất thành công.');
      navigate('/signin'); 
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };
  return (
    <li className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="focus:outline-none text-white text-base font-medium hover:text-blue-400 transition-all group relative"
        aria-label="User Menu"
        aria-expanded={isMenuOpen}
      >
        <i className="bx bx-user mr-1"></i> About
        <span className="absolute -bottom-1 left-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
        <span className="absolute -bottom-1 right-1/2 w-0 transition-all h-0.5 bg-indigo-600 group-hover:w-3/6"></span>
      </button>

      {isMenuOpen && (
        <div className="absolute top-full -right-20 mt-2 w-64 bg-[#06121e] rounded-md shadow-lg z-10">
          <div className="py-2">
            <div className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white">
              <div className="rounded-full w-8 h-8 bg-gray-300 flex items-center justify-center mr-2">
                <img
                  src={userImg}
                  alt="Avatar"
                  className="rounded-full w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Hi,</p>
                <p className="text-sm text-white">{username || "Guest"}</p>
              </div>
            </div>
            <hr className="border-[#0e264073] my-2" />
            <Link
              to="/yeuthich"
              className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white"
            >
              Yêu thích
            </Link>
            <Link
              to="/danhsach"
              className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white"
            >
              Danh sách
            </Link>
            <Link
              to="/lichsu"
              className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white"
            >
              Lịch sử
            </Link>
            <Link
              to="/taikhoan"
              className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white"
            > 
              Tài khoản
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center px-4 py-2 hover:bg-[#0e264073] text-white w-full text-left"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default UserMenu;