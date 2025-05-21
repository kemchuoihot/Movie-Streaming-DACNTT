import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './Components/Layout/Layout';
import Category from './Components/Category/Category';
import Search from './Components/Search/Search';
import Detail from './Components/Detail/Detail';
import Watch from './Components/Watch/Watch';
import RegisterPage from './Components/Login/Register';
import LoginPage from './Components/Login/Login';
import ForgetPasswordPage from './Components/Login/ForgetPassword';
import Admin from './Components/Admin/Admin';
import UserInf from './Components/Layout/About/UserInf';
import Favorites from './Components/Layout/About/Favorites';
import History from './Components/Layout/About/History';

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#06121e',
          color: '#ffffff',
          border: '1px solid #153a61',
        }}
      />
      <Routes>
        <Route path='/signup' element={<RegisterPage />} />
        <Route path='/signin' element={<LoginPage />} />
        <Route path='/forgetpassword' element={<ForgetPasswordPage />} />
        <Route path='/' element={<Layout />} />
        <Route path='/category/:category/:page' element={<Category />} />
        <Route path='/search' element={<Search />} />
        <Route path='/detail/:slug' element={<Detail />} />
        <Route path='/watch/:slug' element={<Watch />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/taikhoan' element={<UserInf />} />
        <Route path='/favorites' element={<Favorites />} />
        <Route path='/history' element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;