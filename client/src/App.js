import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import Layout from './Components/Layout/Layout';
import Category from './Components/Category/Category';
import Search from './Components/Search/Search';
import Detail from './Components/Detail/Detail';
import Watch from './Components/Watch/Watch';
import RegisterPage from './Components/Login/Register';
import LoginPage from './Components/Login/Login';
import ForgetPasswordPage from './Components/Login/ForgetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/signup' element={<RegisterPage />} />
        <Route path='/signin' element={<LoginPage />} />
        <Route path='/forgetpassword' element={<ForgetPasswordPage />} />
        <Route path='/' element={<Layout />} />
        <Route path='/category/:category/:page' element={<Category />} />
        <Route path='/search' element={<Search />} />
        <Route path='/detail/:slug' element={<Detail />} />
        <Route path='/watch/:slug' element={<Watch />} />
      </Routes>
    </Router>
  );
}

export default App;