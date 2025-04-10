import React, { useState } from 'react';
import { auth } from '../../Login/Firebase';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

function ChangePasswordModal({ onClose, onPasswordChangeSuccess }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccessMessage('');

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu mới không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError('Không thể xác định người dùng.');
      return;
    }

    try {
      // Bước 1: Xác thực lại người dùng với mật khẩu cũ
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);

      // Bước 2: Cập nhật mật khẩu
      await updatePassword(user, newPassword);

      setSuccessMessage('Mật khẩu đã được thay đổi thành công!');
      if (onPasswordChangeSuccess) {
        onPasswordChangeSuccess(); // Gọi callback nếu cần
      }
      // Có thể gọi onClose sau một khoảng thời gian hoặc khi người dùng nhấn nút đóng
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      let errorMessage = 'Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại sau.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mật khẩu cũ không đúng. Vui lòng thử lại.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-[#06121e] text-white rounded-md shadow-md p-6 w-96">
        <h2 className="text-xl font-semibold mb-4">Đổi mật khẩu</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {successMessage && <p className="text-green-500 mb-2">{successMessage}</p>}
        <div className="mb-4">
          <label htmlFor="oldPassword" className="block text-sm font-bold mb-2">
            Mật khẩu cũ
          </label>
          <input
            type="password"
            id="oldPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-[#153a61]"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-bold mb-2">
            Mật khẩu mới
          </label>
          <input
            type="password"
            id="newPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-[#153a61]"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirmNewPassword" className="block text-sm font-bold mb-2">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            id="confirmNewPassword"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-[#153a61]"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="bg-[#06121e] hover:bg-[#06121e] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
            onClick={onClose}
          >
            Đóng
          </button>
          <button
            className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleChangePassword}
          >
            Đổi mật khẩu
          </button>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-100 cursor-pointer"
        >
          <svg className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M15.78 14.36a1 1 0 0 1-1.42 1.42L12 13.41l-2.36 2.37a1 1 0 0 1-1.42-1.42L10.59 12 8.23 9.64a1 1 0 0 1 1.42-1.42L12 10.59l2.36-2.37a1 1 0 0 1 1.42 1.42L13.41 12l2.37 2.36z" />
            <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordModal;