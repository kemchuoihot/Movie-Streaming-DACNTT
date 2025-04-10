import React, { useState } from 'react';
import { auth } from './Firebase'; // Import your Firebase auth instance
import { signInWithEmailAndPassword,signInWithPopup,GoogleAuthProvider  } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';
import google from './google.png';
import axios from 'axios';
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async(event) =>{
    event.preventDefault();
    setError(''); // Clear previous errors
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; // Lấy đối tượng user
      const token = await user.getIdToken(); // Lấy ID Token

      console.log('Login successful! Token:', token);
      // Lưu token vào localStorage (hoặc state) để dùng sau
      localStorage.setItem('authToken', token);

      const response = await axios.get('http://localhost:5000/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Protected API response:', response.data);


        navigate('/'); 
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
      await signInWithPopup(auth, provider);
      console.log('Login successful with Google!');
      navigate('/'); // Redirect to the home page after successful Google login
    } catch (error) {
      console.error('Google Sign-in error:', error);
      setError(error.message); // Display any Google Sign-in errors
    }
  };

  return (
    <div className='w-full min-h-screen relative bg-[#06121e] bg-cover bg-center flex items-center justify-center'>
        <div className=' flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 rounded-2xl shadow-md w-2/6 border-1 border-[#0e264073] bg-[#0e274073]'>
          <div className='sm:mx-auto sm:w-full sm:max-w-sm '>
              <img alt='Movie City' src={logo} className='mx-auto h-20 w-auto'/>
              <h2 className='mt-10 text-center yexy-2xl font-bold tracking-tight text-white text-3xl'>Sign In</h2>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm ">
            <form onSubmit={handleSubmit} method="POST" className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-white">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm/6 font-medium text-white">
                    Password
                  </label>
                  
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder='Password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              <div> {error && <p className="font-medium mb-4 text-sm text-red-700">{error}</p>}</div>
              <div>
                <button
                  type="submit"
                  className="flex mt-8 w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign in
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex mx-auto w-1/2 justify-center rounded-md bg-white px-3 py-3 text-sm/6 font-semibold text-black shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 hover:opacity-80 focus-visible:outline-indigo-600 "
                >
                  <img src={google} alt="Google Icon" className='h-6 p-1' />
                  Sign in with Google
                </button>
              </div>
            </form>
            <div className="text-sm mt-5 pt-2">
                    <a href="/forgetpassword" className="font-semibold text-indigo-600 hover:text-indigo-500">
                      Forgot password?
                    </a>
                  </div>
            <p className="mt-5 text-center text-sm/6 text-gray-200">
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
    </div>
    
  );
}

export default LoginPage;