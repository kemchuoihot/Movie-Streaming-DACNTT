import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 border-t border-white/10">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-8 lg:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center mb-4 group">
              <div className="relative">
                <img
                  src="https://ik.imagekit.io/thinhpx33/logo.png?updatedAt=1746706738519"
                  className="h-10 w-10 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300"
                  alt="MovieHub Logo"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 to-orange-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  CityMovie
                </span>
                <p className="text-white/60 text-sm">Xem phim HD miễn phí</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Khám phá thế giới điện ảnh với hàng nghìn bộ phim chất lượng cao. 
              Từ Hollywood đến phim châu Á, chúng tôi mang đến trải nghiệm giải trí tuyệt vời.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center">
                <i className="bx bx-check-circle text-green-400 mr-2"></i>
                <span>HD Quality</span>
              </div>
              <div className="flex items-center">
                <i className="bx bx-shield-check text-blue-400 mr-2"></i>
                <span>An toàn</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white flex items-center">
              <i className="bx bx-link mr-2 text-yellow-400"></i>
              Liên kết nhanh
            </h3>
            <ul className="text-gray-400 space-y-3">
              <li>
                <Link to="/" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-home-alt-2 mr-2 text-sm"></i>
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/category/all/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-movie-play mr-2 text-sm"></i>
                  Phim mới
                </Link>
              </li>
              <li>
                <Link to="/category/Hành Động/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-run mr-2 text-sm"></i>
                  Phim hành động
                </Link>
              </li>
              <li>
                <Link to="/category/Kinh Dị/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-ghost mr-2 text-sm"></i>
                  Phim kinh dị
                </Link>
              </li>
              <li>
                <Link to="/category/Tình Cảm/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-heart mr-2 text-sm"></i>
                  Phim tình cảm
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white flex items-center">
              <i className="bx bx-category mr-2 text-cyan-400"></i>
              Thể loại phim
            </h3>
            <ul className="text-gray-400 space-y-3">
              <li>
                <Link to="/category/Hài Hước/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-happy mr-2 text-sm"></i>
                  Hài hước
                </Link>
              </li>
              <li>
                <Link to="/category/Chính Kịch/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-camera-movie mr-2 text-sm"></i>
                  Chính kịch
                </Link>
              </li>
              <li>
                <Link to="/category/Khoa Học Viễn Tưởng/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-planet mr-2 text-sm"></i>
                  Sci-Fi
                </Link>
              </li>
              <li>
                <Link to="/category/Phiêu Lưu/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-world mr-2 text-sm"></i>
                  Phiêu lưu
                </Link>
              </li>
              <li>
                <Link to="/category/Tâm Lý/1" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-brain mr-2 text-sm"></i>
                  Tâm lý
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Info */}
          <div>
            <h3 className="mb-6 text-lg font-semibold text-white flex items-center">
              <i className="bx bx-support mr-2 text-green-400"></i>
              Hỗ trợ & Thông tin
            </h3>
            <ul className="text-gray-400 space-y-3">
              <li>
                <Link to="/about" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-info-circle mr-2 text-sm"></i>
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-envelope mr-2 text-sm"></i>
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-shield mr-2 text-sm"></i>
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-file-blank mr-2 text-sm"></i>
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-yellow-400 transition-colors duration-300 flex items-center">
                  <i className="bx bx-help-circle mr-2 text-sm"></i>
                  Câu hỏi thường gặp
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-8 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="group">
              <div className="text-2xl font-bold text-yellow-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                10K+
              </div>
              <div className="text-sm text-gray-400">Bộ phim</div>
            </div>
            <div className="group">
              <div className="text-2xl font-bold text-green-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                1M+
              </div>
              <div className="text-sm text-gray-400">Lượt xem</div>
            </div>
            <div className="group">
              <div className="text-2xl font-bold text-blue-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                50K+
              </div>
              <div className="text-sm text-gray-400">Người dùng</div>
            </div>
            <div className="group">
              <div className="text-2xl font-bold text-purple-400 mb-1 group-hover:scale-110 transition-transform duration-300">
                4.8★
              </div>
              <div className="text-sm text-gray-400">Đánh giá</div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-8 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <i className="bx bx-code-alt mr-2 text-pink-400"></i>
            Công nghệ sử dụng
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-react text-2xl text-cyan-400 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">React</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-nodejs text-2xl text-green-400 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">Node.js</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-mongodb text-2xl text-green-500 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">MongoDB</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-tailwind-css text-2xl text-teal-400 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">Tailwind</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-firebase text-2xl text-orange-400 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">Firebase</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-colors group">
              <i className="bx bxl-aws text-2xl text-orange-500 mb-2 group-hover:scale-110 transition-transform duration-300"></i>
              <div className="text-xs text-gray-300">AWS</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-white/10 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <span className="text-sm text-gray-400">
              © 2024{" "}
              <Link
                to="https://kindy-portfolio.vercel.app/"
                className="hover:text-yellow-400 transition-colors duration-300 font-medium"
              >
                MovieHub by Kindy
              </Link>
              . All Rights Reserved.
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Được phát triển với ❤️ tại Việt Nam | Version 2.0.1
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 hidden sm:block">Theo dõi chúng tôi:</span>
            <div className="flex space-x-3">
              <Link
                to="https://facebook.com"
                className="text-gray-400 hover:text-blue-500 transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
                title="Facebook"
              >
                <i className="bx bxl-facebook text-xl"></i>
              </Link>
              <Link
                to="https://www.linkedin.com/in/thinh-nguyen-21ba67284/"
                className="text-gray-400 hover:text-blue-600 transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
                title="LinkedIn"
              >
                <i className="bx bxl-linkedin text-xl"></i>
              </Link>
              <Link
                to="https://github.com/kemchuoihot"
                className="text-gray-400 hover:text-white transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
                title="GitHub"
              >
                <i className="bx bxl-github text-xl"></i>
              </Link>
              <Link
                to="https://kindy-portfolio.vercel.app/"
                className="text-gray-400 hover:text-purple-400 transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
                title="Portfolio"
              >
                <i className="bx bx-user-circle text-xl"></i>
              </Link>
              <Link
                to="mailto:contact@moviehub.com"
                className="text-gray-400 hover:text-green-400 transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
                title="Email"
              >
                <i className="bx bx-envelope text-xl"></i>
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 z-40"
          title="Về đầu trang"
        >
          <i className="bx bx-up-arrow-alt text-xl"></i>
        </button>
      </div>
    </footer>
  );
};

export default Footer;