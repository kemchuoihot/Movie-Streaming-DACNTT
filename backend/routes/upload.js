const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

// ✅ DOCKER-FRIENDLY PATHS
const isDocker = fs.existsSync('/.dockerenv');
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

const tempDir = isDocker || isRailway ? '/tmp' : './temp';

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`✅ Created temp directory: ${tempDir}`);
}

// ✅ MULTER CONFIG for Docker
const upload = multer({ 
    dest: tempDir,
    limits: { 
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 1
    }
});

// ✅ Validate environment variables
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

// ✅ Check FFmpeg availability
let ffmpegAvailable = false;
let ffmpeg;

try {
    ffmpeg = require('fluent-ffmpeg');
    
    // Test FFmpeg
    ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
            console.log('⚠️ FFmpeg not available:', err.message);
            ffmpegAvailable = false;
        } else {
            console.log('✅ FFmpeg is available and working');
            ffmpegAvailable = true;
        }
    });
} catch (error) {
    console.log('⚠️ FFmpeg module not found or not working');
    ffmpegAvailable = false;
}

// ✅ Resolution configurations
const resolutions = {
    360: { width: 640, height: 360, bitrate: 800 },
    480: { width: 854, height: 480, bitrate: 1400 },
    720: { width: 1280, height: 720, bitrate: 2800 },
    1080: { width: 1920, height: 1080, bitrate: 5000 },
};

// ✅ Upload to R2 function
const uploadToR2 = async (key, body, contentType) => {
    try {
        console.log(`📤 Uploading ${key} to R2...`);
        
        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
        });

        const response = await s3Client.send(command);
        console.log(`✅ Successfully uploaded ${key}`);
        return response;
        
    } catch (error) {
        console.error(`❌ Failed to upload ${key}:`, error.message);
        throw error;
    }
};

// ✅ MAIN VIDEO UPLOAD ENDPOINT
router.post('/video', upload.single('video'), async (req, res) => {
    try {
        console.log('📤 === VIDEO UPLOAD REQUEST ===');
        console.log('🔍 Environment:', isRailway ? 'Railway/Production' : 'Local');
        console.log('🔍 FFmpeg available:', ffmpegAvailable);
        console.log('🔍 R2 available:', r2Available);
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'Không có file video được tải lên' 
            });
        }
        
        if (!r2Available) {
            return res.status(500).json({ 
                success: false,
                message: 'R2 storage không khả dụng - kiểm tra environment variables' 
            });
        }
        
        console.log('📁 File received:', {
            name: req.file.originalname,
            size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
            type: req.file.mimetype,
            path: req.file.path
        });
        
        const inputPath = req.file.path;
        const id = uuidv4();
        
        // ✅ HLS TRANSCODING (if FFmpeg available)
        if (ffmpegAvailable) {
            console.log('🎬 Starting HLS transcoding...');
            
            const outputDir = path.join(isRailway ? '/tmp' : 'temp', `hls-${id}`);
            
            try {
                // Create output directory
                fs.mkdirSync(outputDir, { recursive: true });
                console.log('📁 Created output directory:', outputDir);
                
                // Transcode to multiple resolutions
                const tasks = Object.entries(resolutions).map(([label, { width, height, bitrate }]) => {
                    return new Promise((resolve, reject) => {
                        const outputPath = path.join(outputDir, `index_${label}.m3u8`);
                        
                        console.log(`🎬 Starting transcoding for ${label}p...`);
                        
                        ffmpeg(inputPath)
                            .videoCodec('libx264')
                            .audioCodec('aac')
                            .size(`${width}x${height}`)
                            .videoBitrate(bitrate)
                            .outputOptions([
                                '-preset veryfast',
                                '-hls_time 6',
                                '-hls_list_size 0',
                                '-hls_segment_filename', path.join(outputDir, `index_${label}_%03d.ts`),
                            ])
                            .output(outputPath)
                            .on('end', () => {
                                console.log(`✅ FFmpeg completed for ${label}p`);
                                resolve();
                            })
                            .on('error', (err, stdout, stderr) => {
                                console.error(`❌ FFmpeg error [${label}p]:`, err.message);
                                console.error('stdout:', stdout);
                                console.error('stderr:', stderr);
                                reject(err);
                            })
                            .on('progress', (progress) => {
                                console.log(`🎬 ${label}p progress: ${Math.round(progress.percent || 0)}%`);
                            })
                            .run();
                    });
                });
                
                // Wait for all transcoding tasks
                await Promise.all(tasks);
                console.log('✅ All transcoding tasks completed');
                
                // Create master playlist
                const masterPath = path.join(outputDir, 'master.m3u8');
                const masterContent = [
                    '#EXTM3U',
                    '#EXT-X-VERSION:3',
                    ...Object.keys(resolutions).map((label) => {
                        const { width, height, bitrate } = resolutions[label];
                        return `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},RESOLUTION=${width}x${height}\nindex_${label}.m3u8`;
                    }),
                ].join('\n');
                
                fs.writeFileSync(masterPath, masterContent);
                console.log('✅ Master playlist created');
                
                // Upload all files to R2
                const files = fs.readdirSync(outputDir);
                console.log(`📤 Found ${files.length} files to upload:`, files);
                
                const uploadPromises = files.map((filename) => {
                    const filePath = path.join(outputDir, filename);
                    const fileContent = fs.readFileSync(filePath);
                    const key = `hls/${id}/${filename}`;
                    const contentType = filename.endsWith('.m3u8') 
                        ? 'application/x-mpegURL' 
                        : 'video/MP2T';
                    
                    return uploadToR2(key, fileContent, contentType);
                });
                
                await Promise.all(uploadPromises);
                console.log('✅ All files uploaded to R2 successfully');
                
                // Cleanup temp files
                try {
                    fs.rmSync(inputPath, { force: true });
                    fs.rmSync(outputDir, { recursive: true, force: true });
                    console.log('✅ Temporary files cleaned up');
                } catch (cleanupErr) {
                    console.error('⚠️ Cleanup error:', cleanupErr.message);
                }
                
                // Return HLS master URL
                const masterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/hls/${id}/master.m3u8`;
                console.log('✅ HLS transcoding completed:', masterUrl);
                
                return res.status(200).json({ 
                    success: true,
                    url: masterUrl,
                    message: 'Video transcoded to HLS successfully',
                    type: 'hls',
                    resolutions: Object.keys(resolutions),
                    id: id
                });
                
            } catch (transcodingError) {
                console.error('❌ Transcoding failed:', transcodingError.message);
                
                // Cleanup on error
                try {
                    if (fs.existsSync(inputPath)) fs.rmSync(inputPath, { force: true });
                    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
                } catch (cleanupErr) {
                    console.error('Error during cleanup:', cleanupErr.message);
                }
                
                // Fallback to simple upload
                console.log('📤 Falling back to simple upload...');
            }
        }
        
        // ✅ SIMPLE UPLOAD FALLBACK (no transcoding)
        console.log('📤 Performing simple video upload...');
        
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${id}${fileExtension}`;
        const fileContent = fs.readFileSync(inputPath);
        
        // Upload original video
        await uploadToR2(
            `videos/${fileName}`, 
            fileContent, 
            req.file.mimetype
        );
        
        // Cleanup temp file
        try {
            fs.rmSync(inputPath, { force: true });
            console.log('✅ Temporary file cleaned up');
        } catch (cleanupErr) {
            console.error('⚠️ Cleanup error:', cleanupErr.message);
        }
        
        const videoUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/videos/${fileName}`;
        console.log('✅ Simple upload completed:', videoUrl);
        
        return res.status(200).json({ 
            success: true,
            url: videoUrl,
            message: ffmpegAvailable ? 
                'Video uploaded successfully (transcoding failed, using original)' : 
                'Video uploaded successfully (no transcoding available)',
            type: 'direct',
            filename: fileName,
            originalName: req.file.originalname,
            size: req.file.size
        });
        
    } catch (error) {
        console.error('❌ Upload error:', error.message);
        
        // Cleanup on any error
        try {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.rmSync(req.file.path, { force: true });
            }
        } catch (cleanupErr) {
            console.error('Error during final cleanup:', cleanupErr.message);
        }
        
        return res.status(500).json({
            success: false,
            message: 'Video upload failed',
            error: error.message,
            environment: isRailway ? 'Railway/Production' : 'Local'
        });
    }
});

// ✅ Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: isRailway ? 'Railway/Production' : 'Local',
        capabilities: {
            r2Storage: r2Available,
            hlsTranscoding: ffmpegAvailable,
            tempDirectory: isRailway ? '/tmp' : 'temp'
        },
        message: ffmpegAvailable ? 
            'Full HLS transcoding available' : 
            'Simple upload only (no FFmpeg)',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;