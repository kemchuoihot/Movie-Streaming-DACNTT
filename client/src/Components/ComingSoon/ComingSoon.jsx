import React from "react";
import { Link, useLocation } from "react-router-dom";
import NavBar from "../Layout/Navbar/NavBar";
import Footer from "../Footer/Footer";

const ComingSoon = () => {
  const location = useLocation();
  
  // Map routes to page info
const pageInfo = {
    '/about': {
        title: 'Về chúng tôi',
        icon: 'bx-info-circle',
        description: 'Tìm hiểu về MovieHub và đội ngũ phát triển',
        color: 'from-blue-400 to-cyan-500'
    },
    '/contact': {
        title: 'Liên hệ',
        icon: 'bx-envelope',
        description: 'Hỗ trợ khách hàng và phản hồi',
        color: 'from-green-400 to-teal-500'
    },
    '/privacy': {
        title: 'Chính sách bảo mật',
        icon: 'bx-shield',
        description: 'Bảo vệ thông tin và quyền riêng tư người dùng',
        color: 'from-purple-400 to-indigo-500'
    },
    '/terms': {
        title: 'Điều khoản sử dụng',
        icon: 'bx-file',
        description: 'Quy định và điều khoản sử dụng dịch vụ',
        color: 'from-orange-400 to-red-500'
    },
    '/faq': {
        title: 'Câu hỏi thường gặp',
        icon: 'bx-question-mark',
        description: 'Giải đáp các thắc mắc phổ biến',
        color: 'from-pink-400 to-rose-500'
    }
};

  const currentPage = pageInfo[location.pathname] || {
    title: 'Trang không tìm thấy',
    icon: 'bx-error',
    description: 'Trang bạn tìm kiếm không tồn tại',
    color: 'from-gray-400 to-slate-500'
  };

  return (
    <>
      <NavBar />
      <div className="min-h-screen w-full bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-blue-400/5 to-cyan-400/5 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            {/* Main Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-12 border border-white/20 shadow-2xl mb-8">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${currentPage.color} rounded-3xl mb-6`}>
                <i className={`bx ${currentPage.icon} text-3xl text-white`}></i>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
                {currentPage.title}
              </h1>

              {/* Description */}
              <p className="text-white/70 text-lg mb-8">
                {currentPage.description}
              </p>

              {/* Coming Soon Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl px-6 py-3 mb-8">
                <i className="bx bx-time-five text-yellow-400 mr-3 text-xl"></i>
                <span className="text-yellow-400 font-semibold">Sắp ra mắt</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 mb-8">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <i className="bx bx-rocket text-cyan-400 text-2xl mb-2"></i>
                  <h3 className="text-white font-semibold mb-1">Hiện đại</h3>
                  <p className="text-white/60 text-sm">Giao diện đẹp và trực quan</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <i className="bx bxs-shield-plus text-green-400 text-2xl mb-2"></i>
                  <h3 className="text-white font-semibold mb-1">Bảo mật</h3>
                  <p className="text-white/60 text-sm">Thông tin được bảo vệ tốt</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <i className="bx bx-support text-purple-400 text-2xl mb-2"></i>
                  <h3 className="text-white font-semibold mb-1">Hỗ trợ</h3>
                  <p className="text-white/60 text-sm">Phản hồi nhanh chóng</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <i className="bx bx-home mr-2 text-lg"></i>
                  Về trang chủ
                </Link>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium rounded-xl transition-all duration-300"
                >
                  <i className="bx bx-arrow-back mr-2 text-lg"></i>
                  Quay lại
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center justify-center">
                <i className="bx bx-calendar-event text-yellow-400 mr-2"></i>
                Lộ trình phát triển
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <i className="bx bx-check text-white"></i>
                  </div>
                  <p className="text-green-400 font-medium">Hoàn thành</p>
                  <p className="text-white/60">Core Features</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse">
                    <i className="bx bx-loader-alt animate-spin text-white"></i>
                  </div>
                  <p className="text-yellow-400 font-medium">Đang phát triển</p>
                  <p className="text-white/60">Additional Pages</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <i className="bx bx-time text-white/50"></i>
                  </div>
                  <p className="text-white/50 font-medium">Sắp tới</p>
                  <p className="text-white/40">More Features</p>
                </div>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 backdrop-blur rounded-2xl p-6 border border-yellow-400/20 mt-6">
              <h3 className="text-white font-semibold mb-2">Nhận thông báo khi ra mắt</h3>
              <p className="text-white/70 text-sm mb-4">Chúng tôi sẽ thông báo khi trang này hoàn thành</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-yellow-400/50"
                />
                <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-xl font-medium hover:scale-105 transition-transform">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ComingSoon;