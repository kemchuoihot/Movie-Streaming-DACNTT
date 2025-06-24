// server.js - ENHANCED Firebase initialization
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

// Load environment variables FIRST
dotenv.config();

const app = express();

console.log('🔍 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  HAS_FIREBASE_KEY: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  HAS_MONGO_URI: !!process.env.MONGODB_URI
});

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://movie-streaming-dacntt.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  
  if (process.env.NODE_ENV === 'development' || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Firebase Admin initialization with better error handling
let firebaseInitialized = false;

const initializeFirebase = () => {
  try {
    console.log('🔍 Initializing Firebase Admin...');
    
    // Check if already initialized
    try {
      admin.app();
      console.log('✅ Firebase Admin already initialized');
      firebaseInitialized = true;
      return;
    } catch (error) {
      // Not initialized yet, continue
    }
    
    let serviceAccount;
    
    if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔍 Using production Firebase config from env var');
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Firebase service account parsed successfully');
      } catch (parseError) {
        console.error('❌ Failed to parse Firebase service account:', parseError.message);
        throw new Error('Invalid Firebase service account JSON');
      }
    } else {
      console.log('🔍 Using development Firebase config from file');
      const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH || './film-demo-b3215-firebase-adminsdk-fbsvc-52da389e4c.json';
      try {
        serviceAccount = require(credentialsPath);
        console.log('✅ Firebase service account loaded from file');
      } catch (fileError) {
        console.error('❌ Failed to load Firebase credentials file:', fileError.message);
        throw fileError;
      }
    }
    
    // Validate service account
    if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.private_key) {
      throw new Error('Invalid Firebase service account - missing required fields');
    }
    
    console.log('🔍 Firebase project ID:', serviceAccount.project_id);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    firebaseInitialized = true;
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    firebaseInitialized = false;
    // Don't throw error, let server start without Firebase for now
  }
};

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoURI) {
  console.error('❌ No MongoDB URI found in environment variables');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Enhanced authenticate middleware
const authenticate = async (req, res, next) => {
  try {
    // Check if Firebase is initialized
    if (!firebaseInitialized) {
      console.error('❌ Firebase not initialized');
      return res.status(500).json({ 
        message: 'Authentication service unavailable',
        error: 'Firebase not initialized'
      });
    }
    
    const authHeader = req.headers.authorization;
    console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided or invalid format',
        expected: 'Bearer <token>',
        received: authHeader ? authHeader.substring(0, 20) + '...' : 'null'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('🔍 Token length:', token?.length);
    
    if (!token || token.length < 10) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    // Verify token with Firebase
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified for user:', decodedToken.uid);
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.message);
      
      if (verifyError.code === 'auth/id-token-expired') {
        return res.status(401).json({ 
          message: 'Token has expired, please refresh',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token', 
        error: verifyError.message,
        code: verifyError.code || 'VERIFICATION_FAILED'
      });
    }
    
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({ 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

// Health check routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'MovieHub Backend is running!',
    environment: process.env.NODE_ENV || 'development',
    firebase: firebaseInitialized ? 'initialized' : 'failed',
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
    firebase: 'working'
  });
});

// Load routes
try {
  const authRoutes = require('./routes/auth');
  const movieRoutes = require('./routes/movies');
  const userRoutes = require('./routes/users');
  const uploadRoutes = require('./routes/upload');

  app.use('/api/auth', authRoutes);
  app.use('/api/movies', movieRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/upload', uploadRoutes);

  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Route loading error:', error.message);
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Firebase: ${firebaseInitialized ? '✅ Ready' : '❌ Failed'}`);
});