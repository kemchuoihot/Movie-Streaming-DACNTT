import React, { useState, useEffect } from 'react';
import { auth } from '../../Login/Firebase';
import defaultAvatar from './User.jpg';
import { Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import ChangePasswordModal from './ChangePass'; // Import modal

function UserInf() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDisplayNameChange = (event) => {
    setDisplayName(event.target.value);
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  const handleUpdateProfile = async () => {
  };

  const openChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
  };

  const closeChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
  };

  const handlePasswordChangeSuccess = () => {
    alert('Mật khẩu đã được thay đổi thành công!');
    closeChangePasswordModal();
  };

  if (!user) {
    return <div>Bạn chưa đăng nhập.</div>;
  }

  return (
    <div className="min-h-screen bg-[#06121e] flex relative">
      <Link
        to="/"
        className=" bx bx-home absolute top-4 right-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline z-10"
      >
      </Link>
      <div className="bg-[#0e274073] text-white w-64 py-8 px-4">
        <h2 className="text-2xl font-semibold mb-6">Quản lý tài khoản</h2>
        <Link to="" className="block py-2 hover:bg-[#153a61] rounded">
          Yêu thích
        </Link>
        <Link to="" className="block py-2 hover:bg-[#153a61] rounded">
          Danh sách
        </Link>
        <Link to="" className="block py-2 hover:bg-[#153a61] rounded">
          Lịch sử
        </Link>
        <Link to="/taikhoan" className="block py-2 hover:bg-[#153a61] rounded">
          <span className="text-yellow-500 mr-2">●</span> Tài khoản
        </Link>
        
      </div>
      <div className="flex-1 p-8">
        <div className="bg-[#0e274073] text-white rounded-md shadow-md p-5 mt-6">
          <h2 className="text-xl font-semibold mb-4">Tài khoản</h2>
          <p className="text-gray-400 mb-4">Cập nhật thông tin tài khoản</p>

          <div className="flex items-center mb-6">
            <div className="rounded-full w-24 h-24 overflow-hidden mr-6">
              <img
                src={defaultAvatar}
                alt="Ảnh đại diện"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-lg font-semibold">Đổi ảnh đại diện</p>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-white text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-[#153a61]"
              value={user.email}
              readOnly // just read, no change
            />
          </div>

          <div className="mb-4">
            <label htmlFor="displayName" className="block text-white text-sm font-bold mb-2">
              Tên hiển thị
            </label>
            <input
              type="text"
              id="displayName"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-[#153a61]"
              value={displayName}
              onChange={handleDisplayNameChange} // Enable editing
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Giới tính
            </label>
            <div className="flex items-center">
              <input
                type="radio"
                id="male"
                name="gender"
                value="male"
                className="mr-2"
                onChange={handleGenderChange}
              />
              <label htmlFor="male" className="text-white mr-4">
                Nam
              </label>
              <input
                type="radio"
                id="female"
                name="gender"
                value="female"
                className="mr-2"
                onChange={handleGenderChange}
              />
              <label htmlFor="female" className="text-white mr-4">
                Nữ
              </label>
              <input
                type="radio"
                id="other"
                name="gender"
                value="other"
                className="mr-2"
                onChange={handleGenderChange}
              />
              <label htmlFor="other" className="text-white">
                Không xác định
              </label>
            </div>
          </div>

          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleUpdateProfile} 
          >
            Cập nhật
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 m-3 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={openChangePasswordModal}
          >
            Đổi mật khẩu
          </button>

          {updateSuccess && <p className="mt-4 text-green-500">{updateSuccess}</p>}
          {updateError && <p className="mt-4 text-red-500">{updateError}</p>}

          {isChangePasswordModalOpen && (
            <ChangePasswordModal
              onClose={closeChangePasswordModal}
              onPasswordChangeSuccess={handlePasswordChangeSuccess}
            />
          )}
          
        </div>
      </div>
    </div>
  );
}

export default UserInf;