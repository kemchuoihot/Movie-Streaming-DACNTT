import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from './Auth';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const authToken = 'tailwind_mock_token';
    login(authToken);
    navigate('/about');
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-8">
      <h2 className="block text-gray-700 text-xl font-bold mb-6">Đăng nhập với</h2>
      <div className="flex space-x-4 mb-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex-grow">
          <svg className="w-5 h-5 mr-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54v2.89h2.54v2.2c0 2.482 1.517 3.615 3.733 3.615 1.096 0 2.236-.196 2.547-.282v-2.034h-1.74c-1.211 0-1.444-.578-1.444-1.422v-2.47h2.89v-2.89h-2.89v-1.945c0-1.624.933-2.51 2.3-2.51 1.662 0 2.89 1.291 2.89 1.291v3.193h-1.98c-.348 0-.562.174-.562.517v2.356h3.252l-.646 2.89z" clipRule="evenodd" />
          </svg>
          Facebook
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md flex-grow">
          <svg className="w-5 h-5 mr-2 inline-block" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.35 11.1c.1-1.1-.5-2.1-1.3-2.7l-5.2-4.4c-.7-.6-1.6-.8-2.5-.3-.9.5-1.2 1.5-.7 2.4l1.9 3.3c.3.5.7.9 1.2 1.1l-1.7 2.8c-.5.9-.3 2.1.5 2.8l5.2 4.4c.7.6 1.6.8 2.5.3.9-.5 1.2-1.5.7-2.4l-1.9-3.3c-.3-.5-.7-.9-1.2-1.1l1.7-2.8c.5-.9.3-2.1-.5-2.8zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
            <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
          Google +
        </button>
      </div>
      <div className="border-b border-gray-300 my-4">
        <p className="text-center text-gray-500">Hoặc đăng nhập với Hasaki.vn</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Tên đăng nhập:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Mật khẩu:
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline mb-2 w-full"
            type="submit"
          >
            Đăng nhập
          </button>
          <p className="text-gray-600 text-sm">Bạn chưa có tài khoản? <a href="/register" className="text-blue-500 hover:underline">ĐĂNG KÝ NGAY</a></p>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;