const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();
const app = express();

// CORS cho production - CHỈ SỬA PHẦN NÀY
app.use((req, res, next) => {
  // Support multiple origins for production
  const allowedOrigins = [
    'http://localhost:3000',
    'https://movie-streaming-dacntt.vercel.app/',
    process.env.FRONTEND_URL // Sẽ set này trên Railway
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin || 'http://localhost:3000');
  }
  
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Firebase Admin - SỬA CHO PRODUCTION
let serviceAccount;
try {
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production: parse from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    // Development: use local file
    serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH || './film-demo-b3215-firebase-adminsdk-fbsvc-52da389e4c.json');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized');
} catch (error) {
  console.error('Firebase Admin error:', error.message);
}

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection - SỬA CHO PRODUCTION
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Middleware kiểm tra token - GIỮ NGUYÊN
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Token has expired, please log in again' });
    }
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Routes - GIỮ NGUYÊN
app.get('/', (req, res) => {
  res.json({ 
    message: 'MovieHub Backend is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/protected', authenticate, (req, res) => {
  res.json({
    message: 'This is a protected route',
    user: {
      uid: req.user.uid,
      email: req.user.email,
    },
  });
});

// Load routes với error handling
try {
  const authRoutes = require('./routes/auth');
  const movieRoutes = require('./routes/movies');
  const userRoutes = require('./routes/users');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/users', userRoutes);
  
  console.log('All routes loaded successfully');
} catch (error) {
  console.error('Route loading error:', error.message);
}

// Khởi động server - GIỮ NGUYÊN
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});