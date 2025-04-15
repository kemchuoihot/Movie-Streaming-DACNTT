const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();
const app = express();

// Khởi tạo Firebase Admin
const serviceAccount = require(process.env.FIREBASE_CREDENTIALS_PATH || './film-demo-b3215-firebase-adminsdk-fbsvc-52da389e4c.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(express.json());
app.use(cors());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Middleware kiểm tra token
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

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running!');
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

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies'); // Thêm route movies
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes); // Thêm vào server

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});