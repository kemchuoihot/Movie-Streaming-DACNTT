import React, { useState } from 'react';
import { auth } from './Firebase'; // Adjust path
import {
    createUserWithEmailAndPassword,
    updateProfile,
  } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png';
function RegisterPage() {
  const [userName, setUserName] =useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword,setConfirmPassword] =useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      console.log('Passwords do not match - Error set');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('authToken', token);
      console.log('Signup successful! Token:', token);

      if (user) {
        await updateProfile(user, { displayName: userName });
        console.log('Registration successful!');
        navigate('/');
      }

    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    }
  };

  return (
    <div className='w-full min-h-screen relative bg-[#06121e] bg-cover bg-center flex items-center justify-center'>
        <div className='flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 rounded-2xl shadow-md w-2/6 border-1 border-[#0e264073] bg-[#0e274073]'> 
        <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
            <img alt='Movie City' src={logo} className='mx-auto h-12 w-auto'/>
            <h2 className='mt-10 text-center yexy-2xl font-bold tracking-tight text-2xl text-white '>Sign up</h2>
        </div>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm ">
          <form onSubmit={handleSubmit} method="POST" className="space-y-6">
          <div>
              <label htmlFor="username" className="block text-sm/6 font-medium text-white">
                User Name
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder='Username'
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
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
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-white">
                  Confirm Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder='Confirm Password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div> 
            <div className="text-sm text-center">
              <p className="text-white">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="font-semibold text-indigo-500 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
            <div>
            {error && <p className="font-medium mb-4 text-sm text-red-700">{error}</p>}
            </div>
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
        </div>
        
    </div>
  );
}

export default RegisterPage;