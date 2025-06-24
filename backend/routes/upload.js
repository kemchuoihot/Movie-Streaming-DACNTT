// routes/upload.js - COMPLETE ENHANCED VERSION WITH HLS MASTER PLAYLIST
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

// ✅ MAIN VIDEO UPLOAD ENDPOINT WITH ENHANCED HLS TRANSCODING
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
        
        // ✅ PRIORITIZE HLS TRANSCODING
        if (ffmpegAvailable && ffmpegLib) {
            try {
                console.log('🔍 Analyzing video...');
                const videoInfo = await analyzeVideo(inputPath);
                
                const outputDir = path.join(tempDir, `hls-${id}`);
                
                // ✅ ENHANCED HLS TRANSCODING WITH GUARANTEED MASTER
                console.log('🎬 Starting enhanced HLS transcoding...');
                
                // Create output directory
                fs.mkdirSync(outputDir, { recursive: true });
                
                // Filter resolutions based on input
                const inputHeight = videoInfo.height || 1080;
                const availableResolutions = Object.entries(resolutions).filter(([label, res]) => {
                    return res.height <= inputHeight;
                });
                
                console.log(`🎬 Transcoding to ${availableResolutions.length} resolutions:`, 
                    availableResolutions.map(([label]) => label + 'p'));
                
                // ✅ SEQUENTIAL TRANSCODING FOR STABILITY
                const transcodeResults = [];
                
                for (const [label, { width, height, bitrate }] of availableResolutions) {
                    try {
                        console.log(`🎬 Starting ${label}p transcoding...`);
                        
                        await new Promise((resolve, reject) => {
                            const outputPath = path.join(outputDir, `index_${label}.m3u8`);
                            
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
                                    console.log(`🎬 FFmpeg command [${label}p]:`, commandLine.substring(0, 200) + '...');
                                })
                                .on('end', () => {
                                    console.log(`✅ ${label}p transcoding completed`);
                                    transcodeResults.push({
                                        label,
                                        width,
                                        height,
                                        bitrate,
                                        success: true
                                    });
                                    resolve();
                                })
                                .on('error', (err, stdout, stderr) => {
                                    console.error(`❌ ${label}p transcoding failed:`, err.message);
                                    transcodeResults.push({
                                        label,
                                        width,
                                        height,
                                        bitrate,
                                        success: false,
                                        error: err.message
                                    });
                                    resolve(); // Continue with other resolutions
                                })
                                .on('progress', (progress) => {
                                    if (progress.percent) {
                                        console.log(`🎬 ${label}p: ${Math.round(progress.percent)}%`);
                                    }
                                });
                            
                            // Timeout protection
                            const timeout = setTimeout(() => {
                                command.kill('SIGKILL');
                                console.error(`⏰ ${label}p transcoding timeout`);
                                transcodeResults.push({
                                    label,
                                    width,
                                    height,
                                    bitrate,
                                    success: false,
                                    error: 'Timeout'
                                });
                                resolve();
                            }, 5 * 60 * 1000); // 5 minutes per resolution
                            
                            command.on('end', () => clearTimeout(timeout));
                            command.on('error', () => clearTimeout(timeout));
                            
                            command.run();
                        });
                        
                    } catch (error) {
                        console.error(`❌ ${label}p transcoding error:`, error.message);
                        transcodeResults.push({
                            label,
                            width,
                            height,
                            bitrate,
                            success: false,
                            error: error.message
                        });
                    }
                }
                
                // ✅ CHECK TRANSCODING RESULTS
                const successfulTranscodes = transcodeResults.filter(r => r.success);
                console.log(`✅ Successful transcodes: ${successfulTranscodes.length}/${transcodeResults.length}`);
                
                if (successfulTranscodes.length === 0) {
                    throw new Error('All transcoding attempts failed');
                }
                
                // ✅ CREATE MASTER PLAYLIST WITH SUCCESSFUL TRANSCODES
                const masterPath = path.join(outputDir, 'master.m3u8');
                const masterContent = [
                    '#EXTM3U',
                    '#EXT-X-VERSION:3',
                    ...successfulTranscodes.map(({ label, width, height, bitrate }) => {
                        return `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},RESOLUTION=${width}x${height},NAME="${height}p"\nindex_${label}.m3u8`;
                    }),
                ].join('\n');
                
                fs.writeFileSync(masterPath, masterContent);
                console.log('✅ Master playlist created with content:');
                console.log(masterContent);
                
                // ✅ VERIFY ALL FILES EXIST
                const files = fs.readdirSync(outputDir);
                const m3u8Files = files.filter(f => f.endsWith('.m3u8'));
                const tsFiles = files.filter(f => f.endsWith('.ts'));
                
                console.log(`📁 Generated files: ${m3u8Files.length} playlists, ${tsFiles.length} segments`);
                console.log('📁 Playlist files:', m3u8Files);
                
                if (!files.includes('master.m3u8')) {
                    throw new Error('Master playlist was not created');
                }
                
                // ✅ UPLOAD ALL FILES TO R2
                console.log(`📤 Uploading ${files.length} files to R2...`);
                
                const uploadPromises = files.map(async (filename) => {
                    try {
                        const filePath = path.join(outputDir, filename);
                        const fileContent = fs.readFileSync(filePath);
                        const key = `hls/${id}/${filename}`;
                        const contentType = filename.endsWith('.m3u8') 
                            ? 'application/x-mpegURL' 
                            : 'video/MP2T';
                        
                        await uploadToR2(key, fileContent, contentType);
                        return { filename, success: true };
                    } catch (error) {
                        console.error(`❌ Failed to upload ${filename}:`, error.message);
                        return { filename, success: false, error: error.message };
                    }
                });
                
                const uploadResults = await Promise.all(uploadPromises);
                const successfulUploads = uploadResults.filter(r => r.success);
                
                console.log(`✅ Uploaded ${successfulUploads.length}/${uploadResults.length} files`);
                
                if (successfulUploads.length === 0) {
                    throw new Error('Failed to upload any files to R2');
                }
                
                // ✅ CLEANUP TEMP FILES
                try {
                    fs.rmSync(inputPath, { force: true });
                    fs.rmSync(outputDir, { recursive: true, force: true });
                    console.log('✅ Temporary files cleaned up');
                } catch (cleanupErr) {
                    console.error('⚠️ Cleanup warning:', cleanupErr.message);
                }
                
                // ✅ RETURN HLS MASTER URL
                const masterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/hls/${id}/master.m3u8`;
                console.log('🎬 HLS transcoding completed successfully!');
                console.log('📺 Master URL:', masterUrl);
                
                return res.status(200).json({ 
                    success: true,
                    url: masterUrl, // ✅ THIS IS THE KEY - RETURN HLS URL
                    message: `Video transcoded to HLS với ${successfulTranscodes.length} chất lượng`,
                    type: 'hls',
                    resolutions: successfulTranscodes.map(r => r.label + 'p'),
                    masterPlaylist: masterUrl,
                    id: id,
                    transcoding: {
                        total: transcodeResults.length,
                        successful: successfulTranscodes.length,
                        failed: transcodeResults.length - successfulTranscodes.length,
                        details: transcodeResults
                    },
                    files: {
                        total: files.length,
                        uploaded: successfulUploads.length,
                        playlists: m3u8Files.length,
                        segments: tsFiles.length
                    },
                    videoInfo: {
                        duration: videoInfo.duration,
                        format: videoInfo.format,
                        originalSize: videoInfo.size,
                        codec: videoInfo.videoCodec
                    }
                });
                
            } catch (transcodingError) {
                console.error('❌ HLS Transcoding completely failed:', transcodingError.message);
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
        
        // ✅ SIMPLE UPLOAD FALLBACK (NO HLS)
        console.log('📤 Performing simple video upload (no HLS)...');
        
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${id}${fileExtension}`;
        const fileContent = fs.readFileSync(inputPath);
        
        await uploadToR2(`videos/${fileName}`, fileContent, req.file.mimetype);
        
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
            url: videoUrl, // ✅ DIRECT VIDEO URL (NOT HLS)
            message: ffmpegAvailable ? 
                'Video uploaded thành công (HLS transcoding failed, using original)' : 
                'Video uploaded thành công (không có HLS transcoding)',
            type: 'direct',
            filename: fileName,
            originalName: req.file.originalname,
            size: req.file.size,
            id: id,
            warning: 'Video uploaded as direct file - no multi-quality support'
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

// ✅ HLS TEST ENDPOINT
router.get('/test-hls/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const masterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/hls/${id}/master.m3u8`;
        
        // Test if master playlist exists and accessible
        const testResponse = await fetch(masterUrl);
        
        if (testResponse.ok) {
            const masterContent = await testResponse.text();
            
            res.json({
                success: true,
                url: masterUrl,
                accessible: true,
                content: masterContent,
                contentType: testResponse.headers.get('content-type'),
                message: 'HLS master playlist is accessible'
            });
        } else {
            res.status(404).json({
                success: false,
                url: masterUrl,
                accessible: false,
                status: testResponse.status,
                message: 'HLS master playlist not found'
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to test HLS URL'
        });
    }
});

module.exports = router;