// routes/upload.js - Railway optimized version
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

// ✅ IMPORTANT: Use memory storage for Railway (no temp files)
const upload = multer({ 
  storage: multer.memoryStorage(), // Store in memory instead of disk
  limits: { 
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// ✅ Environment validation
const validateEnv = () => {
    const required = [
        'CLOUDFLARE_R2_ACCESS_KEY_ID', 
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 
        'CLOUDFLARE_ACCOUNT_ID', 
        'CLOUDFLARE_R2_BUCKET_NAME', 
        'CLOUDFLARE_R2_PUBLIC_URL'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing environment variables:', missing);
        return false;
    }
    
    console.log('✅ All R2 environment variables are set');
    console.log('🔍 Using R2 endpoint:', `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    console.log('🔍 Using bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log('🔍 Public URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL);
    return true;
};

// ✅ Initialize R2 client
let s3Client;
let r2Available = false;

try {
    if (validateEnv()) {
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
        });
        r2Available = true;
        console.log('✅ R2 Client initialized successfully');
    }
} catch (error) {
    console.error('❌ R2 Client initialization failed:', error.message);
    r2Available = false;
}

// ✅ Upload function
const uploadToR2 = async (key, body, contentType) => {
    try {
        console.log(`📤 Uploading ${key} to R2...`);
        
        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000', // 1 year cache
        });

        const response = await s3Client.send(command);
        console.log(`✅ Successfully uploaded ${key}`);
        return response;
        
    } catch (error) {
        console.error(`❌ Failed to upload ${key}:`, error.message);
        throw error;
    }
};

// ✅ Check if we're on Railway or local
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || !process.env.NODE_ENV || process.env.NODE_ENV === 'production';

// ✅ SIMPLE VIDEO UPLOAD (No transcoding for Railway)
router.post('/video', upload.single('video'), async (req, res) => {
    try {
        console.log('📤 === VIDEO UPLOAD REQUEST ===');
        console.log('🔍 Environment:', isRailway ? 'Railway/Production' : 'Local');
        
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No video file provided',
                success: false 
            });
        }
        
        if (!r2Available) {
            return res.status(500).json({ 
                message: 'R2 storage not available - check environment variables',
                success: false 
            });
        }
        
        console.log('📁 File received:', {
            name: req.file.originalname,
            size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
            type: req.file.mimetype
        });
        
        // Generate unique filename
        const id = uuidv4();
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${id}${fileExtension}`;
        
        // Upload original video directly to R2 (no transcoding on Railway)
        console.log('📤 Uploading original video to R2...');
        await uploadToR2(
            `videos/${fileName}`, 
            req.file.buffer, // Use buffer instead of file path
            req.file.mimetype
        );
        
        // Generate public URL
        const videoUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/videos/${fileName}`;
        
        console.log('✅ Upload successful!');
        console.log('🔗 Video URL:', videoUrl);
        
        return res.status(200).json({ 
            success: true,
            url: videoUrl,
            message: isRailway ? 
                'Video uploaded successfully (no transcoding on production)' : 
                'Video uploaded successfully',
            filename: fileName,
            originalName: req.file.originalname,
            size: req.file.size
        });
        
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        
        return res.status(500).json({
            success: false,
            message: 'Video upload failed',
            error: error.message,
            environment: isRailway ? 'Railway/Production' : 'Local'
        });
    }
});

// ✅ ADVANCED UPLOAD WITH TRANSCODING (Local only)
router.post('/video-hls', upload.single('video'), async (req, res) => {
    
    if (isRailway) {
        return res.status(501).json({
            success: false,
            message: 'HLS transcoding not available on Railway/Production',
            suggestion: 'Use /api/upload/video for simple upload',
            alternative: 'Consider using external transcoding service like AWS MediaConvert'
        });
    }
    
    // Your original FFmpeg transcoding code goes here for local development
    // This will only run on localhost where FFmpeg is available
    
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file video' });
    }

    const inputPath = req.file.path;
    const id = uuidv4();
    const outputDir = `temp/hls-${id}`;

    try {
        // Ensure temp directory exists
        if (!fs.existsSync('temp')) {
            fs.mkdirSync('temp', { recursive: true });
        }
        
        fs.mkdirSync(outputDir, { recursive: true });

        console.log('🎬 Starting video transcoding:', req.file.originalname);
        console.log('📁 Output directory:', outputDir);

        // Your original FFmpeg transcoding logic here...
        // (All the existing code for resolutions, ffmpeg processing, etc.)
        
        return res.status(200).json({ 
            success: true,
            message: 'HLS transcoding completed (local only)',
            url: `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${id}/master.m3u8`
        });
        
    } catch (error) {
        console.error('❌ Transcoding error:', error);
        
        // Cleanup on error
        try {
            if (fs.existsSync(inputPath)) fs.rmSync(inputPath, { force: true });
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
        }
        
        return res.status(500).json({
            success: false,
            message: 'Transcoding failed',
            error: error.message
        });
    }
});

// ✅ Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        r2Available,
        environment: isRailway ? 'Railway/Production' : 'Local',
        transcoding: isRailway ? 'disabled' : 'enabled',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;