// routes/upload.js - COMPLETE FIXED VERSION
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

// ✅ ENVIRONMENT DETECTION
const isDocker = fs.existsSync('/.dockerenv');
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';
const tempDir = isDocker || isRailway ? '/tmp' : './temp';

// ✅ ENSURE TEMP DIRECTORY EXISTS
if (!fs.existsSync(tempDir)) {
    try {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`✅ Created temp directory: ${tempDir}`);
    } catch (error) {
        console.error('❌ Failed to create temp directory:', error.message);
    }
}

// ✅ MULTER CONFIGURATION
const upload = multer({ 
    dest: tempDir,
    limits: { 
        fileSize: 500 * 1024 * 1024, // 500MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Accept video files only
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// ✅ VALIDATE ENVIRONMENT VARIABLES
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
    return true;
};

// ✅ INITIALIZE R2 CLIENT
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

// ✅ FFMPEG INITIALIZATION WITH ENHANCED ERROR HANDLING
let ffmpegAvailable = false;
let ffmpegLib;

try {
    ffmpegLib = require('fluent-ffmpeg');
    
    // ✅ SET FFMPEG PATHS FOR ALPINE LINUX
    if (isDocker || isRailway) {
        if (fs.existsSync('/usr/bin/ffmpeg')) {
            ffmpegLib.setFfmpegPath('/usr/bin/ffmpeg');
            console.log('✅ FFmpeg path set to /usr/bin/ffmpeg');
        }
        if (fs.existsSync('/usr/bin/ffprobe')) {
            ffmpegLib.setFfprobePath('/usr/bin/ffprobe');
            console.log('✅ FFprobe path set to /usr/bin/ffprobe');
        }
    }
    
    // ✅ TEST FFMPEG AVAILABILITY
    ffmpegLib.getAvailableFormats((err, formats) => {
        if (err) {
            console.log('⚠️ FFmpeg not available:', err.message);
            ffmpegAvailable = false;
        } else {
            console.log('✅ FFmpeg is available and working');
            ffmpegAvailable = true;
        }
    });
} catch (error) {
    console.log('⚠️ FFmpeg module not found or not working:', error.message);
    ffmpegAvailable = false;
}

// ✅ RESOLUTION CONFIGURATIONS
const resolutions = {
    360: { width: 640, height: 360, bitrate: 800 },
    480: { width: 854, height: 480, bitrate: 1400 },
    720: { width: 1280, height: 720, bitrate: 2800 },
    1080: { width: 1920, height: 1080, bitrate: 5000 },
};

// ✅ UPLOAD TO R2 FUNCTION
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

// ✅ ANALYZE VIDEO WITH FFPROBE
const analyzeVideo = (inputPath) => {
    return new Promise((resolve, reject) => {
        if (!ffmpegAvailable || !ffmpegLib) {
            reject(new Error('FFmpeg not available'));
            return;
        }
        
        ffmpegLib.ffprobe(inputPath, (err, metadata) => {
            if (err) {
                console.error('❌ FFprobe failed:', err.message);
                reject(err);
            } else {
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
                
                const info = {
                    duration: metadata.format.duration,
                    format: metadata.format.format_name,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    videoCodec: videoStream?.codec_name,
                    audioCodec: audioStream?.codec_name,
                    width: videoStream?.width,
                    height: videoStream?.height,
                    fps: videoStream?.r_frame_rate
                };
                
                console.log('✅ Video analysis:', info);
                resolve(info);
            }
        });
    });
};

// ✅ HLS TRANSCODING FUNCTION
const transcodeToHLS = async (inputPath, outputDir, videoInfo) => {
    console.log('🎬 Starting HLS transcoding...');
    
    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('📁 Created output directory:', outputDir);
    
    // ✅ FILTER RESOLUTIONS BASED ON INPUT VIDEO
    const inputHeight = videoInfo.height || 1080;
    const availableResolutions = Object.entries(resolutions).filter(([label, res]) => {
        return res.height <= inputHeight; // Don't upscale
    });
    
    console.log(`🎬 Transcoding to ${availableResolutions.length} resolutions:`, 
        availableResolutions.map(([label]) => label + 'p'));
    
    // ✅ ENHANCED TRANSCODING WITH BETTER ERROR HANDLING
    const tasks = availableResolutions.map(([label, { width, height, bitrate }]) => {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(outputDir, `index_${label}.m3u8`);
            
            console.log(`🎬 Starting transcoding for ${label}p...`);
            
            const command = ffmpegLib(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .size(`${width}x${height}`)
                .videoBitrate(`${bitrate}k`)
                .audioBitrate('128k')
                .outputOptions([
                    '-preset veryfast',
                    '-profile:v baseline',
                    '-level 3.0',
                    '-start_number 0',
                    '-hls_time 6',
                    '-hls_list_size 0',
                    '-f hls',
                    '-hls_segment_filename', path.join(outputDir, `index_${label}_%03d.ts`),
                ])
                .output(outputPath)
                .on('start', (commandLine) => {
                    console.log(`🎬 FFmpeg command [${label}p]:`, commandLine);
                })
                .on('end', () => {
                    console.log(`✅ FFmpeg completed for ${label}p`);
                    resolve();
                })
                .on('error', (err, stdout, stderr) => {
                    console.error(`❌ FFmpeg error [${label}p]:`, {
                        message: err.message,
                        code: err.code
                    });
                    
                    if (stderr) {
                        console.error(`📄 STDERR [${label}p]:`, stderr.substring(0, 500));
                    }
                    
                    reject(new Error(`FFmpeg ${label}p failed: ${err.message}`));
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`🎬 ${label}p progress: ${Math.round(progress.percent)}%`);
                    }
                });
            
            // ✅ TIMEOUT PROTECTION
            const timeout = setTimeout(() => {
                command.kill('SIGKILL');
                reject(new Error(`FFmpeg timeout for ${label}p after 10 minutes`));
            }, 10 * 60 * 1000); // 10 minutes
            
            command.on('end', () => clearTimeout(timeout));
            command.on('error', () => clearTimeout(timeout));
            
            command.run();
        });
    });
    
    // Wait for all transcoding tasks
    await Promise.all(tasks);
    console.log('✅ All transcoding tasks completed');
    
    // ✅ VERIFY AND CREATE MASTER PLAYLIST
    const files = fs.readdirSync(outputDir);
    const m3u8Files = files.filter(f => f.endsWith('.m3u8'));
    
    if (m3u8Files.length === 0) {
        throw new Error('No HLS playlist files were created');
    }
    
    // Create master playlist
    const masterPath = path.join(outputDir, 'master.m3u8');
    const masterContent = [
        '#EXTM3U',
        '#EXT-X-VERSION:3',
        ...availableResolutions
            .filter(([label]) => files.includes(`index_${label}.m3u8`))
            .map(([label, { width, height, bitrate }]) => {
                return `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},RESOLUTION=${width}x${height}\nindex_${label}.m3u8`;
            }),
    ].join('\n');
    
    fs.writeFileSync(masterPath, masterContent);
    console.log('✅ Master playlist created');
    
    return files;
};

// ✅ MAIN VIDEO UPLOAD ENDPOINT
router.post('/video', upload.single('video'), async (req, res) => {
    console.log('📤 === VIDEO UPLOAD REQUEST ===');
    
    try {
        // ✅ COMPREHENSIVE VALIDATION
        console.log('🔍 Environment check:', {
            isRailway,
            isDocker,
            tempDir,
            ffmpegAvailable,
            r2Available
        });
        
        if (!req.file) {
            console.log('❌ No file provided');
            return res.status(400).json({ 
                success: false,
                message: 'Không có file video được tải lên',
                error: 'NO_FILE'
            });
        }
        
        if (!r2Available) {
            console.log('❌ R2 not available');
            return res.status(500).json({ 
                success: false,
                message: 'R2 storage không khả dụng - kiểm tra environment variables',
                error: 'R2_UNAVAILABLE'
            });
        }
        
        console.log('📁 File received:', {
            name: req.file.originalname,
            size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
            type: req.file.mimetype,
            path: req.file.path,
            exists: fs.existsSync(req.file.path)
        });
        
        const inputPath = req.file.path;
        const id = uuidv4();
        
        // ✅ TRY HLS TRANSCODING FIRST
        if (ffmpegAvailable && ffmpegLib) {
            try {
                console.log('🔍 Analyzing video...');
                const videoInfo = await analyzeVideo(inputPath);
                
                const outputDir = path.join(tempDir, `hls-${id}`);
                const files = await transcodeToHLS(inputPath, outputDir, videoInfo);
                
                // Upload all files to R2
                console.log(`📤 Uploading ${files.length} files to R2...`);
                
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
                    console.error('⚠️ Cleanup warning:', cleanupErr.message);
                }
                
                // Return HLS master URL
                const masterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/hls/${id}/master.m3u8`;
                console.log('✅ HLS transcoding completed:', masterUrl);
                
                return res.status(200).json({ 
                    success: true,
                    url: masterUrl,
                    message: 'Video transcoded to HLS successfully',
                    type: 'hls',
                    resolutions: Object.keys(resolutions).filter(label => 
                        files.includes(`index_${label}.m3u8`)
                    ),
                    id: id,
                    filesCreated: files.length,
                    videoInfo: {
                        duration: videoInfo.duration,
                        format: videoInfo.format,
                        originalSize: videoInfo.size
                    }
                });
                
            } catch (transcodingError) {
                console.error('❌ HLS Transcoding failed:', transcodingError.message);
                console.log('📤 Falling back to simple upload...');
                
                // Cleanup failed transcoding files
                try {
                    const outputDir = path.join(tempDir, `hls-${id}`);
                    if (fs.existsSync(outputDir)) {
                        fs.rmSync(outputDir, { recursive: true, force: true });
                    }
                } catch (cleanupErr) {
                    console.error('⚠️ Transcoding cleanup error:', cleanupErr.message);
                }
            }
        } else {
            console.log('⚠️ FFmpeg not available, using simple upload');
        }
        
        // ✅ SIMPLE UPLOAD FALLBACK
        console.log('📤 Performing simple video upload...');
        
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${id}${fileExtension}`;
        
        // Read file content
        const fileContent = fs.readFileSync(inputPath);
        
        // Upload original video to R2
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
            console.error('⚠️ Cleanup warning:', cleanupErr.message);
        }
        
        const videoUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/videos/${fileName}`;
        console.log('✅ Simple upload completed:', videoUrl);
        
        return res.status(200).json({ 
            success: true,
            url: videoUrl,
            message: ffmpegAvailable ? 
                'Video uploaded successfully (HLS transcoding failed, using original)' : 
                'Video uploaded successfully (no HLS transcoding available)',
            type: 'direct',
            filename: fileName,
            originalName: req.file.originalname,
            size: req.file.size,
            id: id
        });
        
    } catch (error) {
        console.error('❌ === UPLOAD ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // ✅ COMPREHENSIVE ERROR CLEANUP
        try {
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                fs.rmSync(req.file.path, { force: true });
                console.log('✅ Emergency cleanup completed');
            }
        } catch (cleanupErr) {
            console.error('❌ Emergency cleanup failed:', cleanupErr.message);
        }
        
        return res.status(500).json({
            success: false,
            message: 'Video upload failed',
            error: error.message,
            errorCode: error.code || 'UNKNOWN_ERROR',
            environment: isRailway ? 'Railway/Production' : 'Local',
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ HEALTH CHECK ENDPOINT
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        environment: isRailway ? 'Railway/Production' : 'Local',
        capabilities: {
            r2Storage: r2Available,
            hlsTranscoding: ffmpegAvailable,
            tempDirectory: tempDir,
            tempDirExists: fs.existsSync(tempDir)
        },
        ffmpeg: {
            available: ffmpegAvailable,
            path: isDocker || isRailway ? '/usr/bin/ffmpeg' : 'system'
        },
        message: ffmpegAvailable ? 
            'Full HLS transcoding available' : 
            'Simple upload only (no FFmpeg)',
        timestamp: new Date().toISOString()
    });
});

// ✅ DEBUG ENDPOINT
router.get('/debug', (req, res) => {
    res.json({
        status: 'debug',
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
            isRailway,
            isDocker,
            tempDir,
            tempDirExists: fs.existsSync(tempDir)
        },
        r2: {
            available: r2Available,
            hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
            hasBucket: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
            hasPublicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
            endpoint: process.env.CLOUDFLARE_ACCOUNT_ID ? 
                `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com` : 'not configured'
        },
        ffmpeg: {
            available: ffmpegAvailable,
            moduleLoaded: !!ffmpegLib,
            binaryExists: fs.existsSync('/usr/bin/ffmpeg'),
            ffprobeExists: fs.existsSync('/usr/bin/ffprobe')
        },
        system: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        }
    });
});

module.exports = router;