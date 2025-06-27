# Movie Streaming Platform - DACNTT

## 🎬 Giới thiệu
Website xem phim trực tuyến với chất lượng HD, hỗ trợ đa thiết bị.

**Demo**: https://movie-streaming-dacntt.vercel.app

## 🛠️ Công nghệ
- **Frontend**: React.js + Tailwind CSS
- **Backend**: Node.js + Express.js + MongoDB
- **Storage**: Cloudflare R2
- **Auth**: Firebase
- **Deploy**: Railway + Vercel

## ✨ Tính năng
### Người dùng
- 🔐 Đăng ký/Đăng nhập
- 🎥 Xem phim HLS (360p-1080p)
- ⭐ Đánh giá, bình luận
- ❤️ Yêu thích, lịch sử xem
- 📱 Responsive mobile

### Admin
- 📊 Dashboard thống kê
- 🎬 Upload/Quản lý phim
- 👥 Quản lý người dùng

## 🚀 Chạy dự án

### Backend
```bash
cd backend
npm install
# Cấu hình .env
npm start
```

### Frontend
```bash
cd client
npm install
# Cấu hình .env
npm start
```

## 📋 Environment Variables
```env
# Backend
MONGODB_URI=...
FIREBASE_SERVICE_ACCOUNT_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=...

# Frontend
REACT_APP_BASE_URL=...
REACT_APP_FIREBASE_API_KEY=...
```

## 👨‍💻 Thông tin
- **Tác giả**: Nguyễn Phúc Thịnh, Lâm Nguyễn Anh Thy
- **MSSV**:  521H0162 521H0377
- **Tên đề tài**: Phát triển trang web cho dịch vụ xem phim theo yêu cầu sử dụng React và Node.js 

---
* Dự án CNTT*