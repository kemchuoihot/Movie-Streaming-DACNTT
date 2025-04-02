import React from 'react'
import Navbar from './Navbar/NavBar';
import Main from './Main/Main';
import Hoathinh from './Hoathinh/Hoathinh';
import Phimle from './Phimle/Phimle';
import Phimbo from './Phimbo/Phimbo';
import Footer from '../Footer/Footer';
function Layout() {
  return (
    <>
      <Navbar/>
      <Main/>
      <Hoathinh/>
      <Phimle/>
      <Phimbo/>
      <Footer/>
    </>
  )
}

export default Layout