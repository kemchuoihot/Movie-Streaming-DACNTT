import React, { useState } from 'react';
import { auth } from './Firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';
import google from './google.png';
import axios from 'axios';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false); // State cho popup
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);

      console.log('Login successful! Token:', token);
      setShowPopup(true); // Hiển thị popup thành công
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = err.message;
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email does not exist. Please check again or register an account.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect email or password. Please try again.';
      }
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);

      console.log('Login successful with Google!');
      setShowPopup(true); // Hiển thị popup thành công
    } catch (error) {
      console.error('Google Sign-in error:', error);
      setError(error.message);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    navigate('/'); // Chuyển hướng sau khi đóng popup
  };

  return (
    <div className="w-full min-h-screen bg-[#06121e] bg-cover bg-center flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col justify-center px-6 py-12 rounded-2xl shadow-md border border-[#0e264073] bg-[#0e274073]">
        <div className="mx-auto w-full max-w-sm">
          <img alt="Movie City" src={logo} className="mx-auto h-20 w-auto" />
          <h2 className="mt-10 text-center text-3xl font-bold tracking-tight text-white">Sign In</h2>
        </div>
        <div className="mt-8 mx-auto w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
              />
            </div>
            {error && <p className="font-medium text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-2 focus:outline-indigo-600"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex justify-center items-center rounded-md bg-white px-3 py-3 text-sm font-semibold text-black hover:opacity-80 focus:outline-2 focus:outline-indigo-600"
            >
              <img src={google} alt="Google Icon" className="h-6 mr-2" />
              Sign In with Google
            </button>
          </form>
          <div className="text-sm mt-5">
            <a href="/forgetpassword" className="block text-center font-semibold text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </a>
          </div>
          <p className="mt-5 text-center text-sm text-white">
            Not a member?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="font-semibold text-indigo-500 hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>

      {/* Popup thông báo thành công */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div className="bg-[#0e2740ea] border border-[#0e264073] rounded-2xl p-8 shadow-lg w-full max-w-md mx-4 transform transition-all animate-fadeIn">
            <div className="text-4xl text-green-500 text-center mb-4">✔</div>
            <h3 className="text-2xl font-bold text-white text-center">Login Successful!</h3>
            <p className="text-gray-200 text-center mt-4">Welcome back to Movie City!</p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={closePopup}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;