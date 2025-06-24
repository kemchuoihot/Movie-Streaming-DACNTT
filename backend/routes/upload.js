const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();
const upload = multer({ dest: 'temp/' });

// Validate environment variables at startup
const validateEnv = () => {
    const required = ['CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_BUCKET_NAME', 'CLOUDFLARE_R2_PUBLIC_URL'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing);
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    console.log('All required environment variables are set');
    console.log('Using R2 endpoint:', `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    console.log('Using bucket:', process.env.CLOUDFLARE_R2_BUCKET_NAME);
    console.log('Public URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL);
};

// Validate environment on module load
validateEnv();

// Configure S3Client for Cloudflare R2 (AWS SDK v3)
const s3Client = new S3Client({
    region: 'auto', // Cloudflare R2 often uses 'auto' or a placeholder
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true, // Quan trọng cho khả năng tương thích R2
});

// ✅ Check if FFmpeg is available
const checkFFmpeg = () => {
    return new Promise((resolve, reject) => {
        ffmpeg.getAvailableFormats((err, formats) => {
            if (err) {
                console.error('FFmpeg not found or not working:', err.message);
                reject(err);
            } else {
                console.log('FFmpeg is available and working');
                resolve(true);
            }
        });
    });
};

const resolutions = {
    360: { width: 640, height: 360, bitrate: 800 },
    480: { width: 854, height: 480, bitrate: 1400 },
    720: { width: 1280, height: 720, bitrate: 2800 },
    1080: { width: 1920, height: 1080, bitrate: 5000 },
};

// ✅ Cập nhật hàm uploadToR2 để sử dụng AWS SDK v3
const uploadToR2 = async (key, body, contentType) => {
    try {
        console.log(`Uploading ${key} to R2...`);
        const command = new PutObjectCommand({ // ✅ Sử dụng PutObjectCommand
            Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
            ACL: 'public-read', // R2 hỗ trợ ACL public-read
        });

        const response = await s3Client.send(command); // Gửi command qua s3Client

        console.log(`Successfully uploaded ${key}`);
        return response; // Trả về response từ R2 (có thể khác một chút so với v2)
    } catch (error) {
        console.error(`Failed to upload ${key}:`, error);
        throw error;
    }
};

router.post('/video', upload.single('video'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Không có file video' });

    const inputPath = req.file.path;
    const id = uuidv4();
    const outputDir = `temp/hls-${id}`;

    try {
        fs.mkdirSync(outputDir, { recursive: true });

        console.log('Bắt đầu xử lý video:', req.file.originalname);
        console.log('Thư mục output:', outputDir);

        const tasks = Object.entries(resolutions).map(([label, { width, height, bitrate }]) => {
            return new Promise((resolve, reject) => {
                const outputPath = `${outputDir}/index_${label}.m3u8`;

                ffmpeg(inputPath)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .size(`${width}x${height}`)
                    .videoBitrate(bitrate)
                    .outputOptions([
                        '-preset veryfast',
                        '-hls_time 6',
                        '-hls_list_size 0',
                        '-hls_segment_filename', `${outputDir}/index_${label}_%03d.ts`,
                    ])
                    .output(outputPath)
                    .on('end', () => {
                        console.log(`FFmpeg hoàn tất cho độ phân giải ${label}p`);
                        resolve();
                    })
                    .on('error', (err, stdout, stderr) => {
                        console.error(`Lỗi FFmpeg [${label}p]:`, err.message);
                        console.error('stdout:', stdout);
                        console.error('stderr:', stderr);
                        reject(err);
                    })
                    .run();
            });
        });

        await Promise.all(tasks);

        const masterPath = `${outputDir}/master.m3u8`;
        const masterContent = [
            '#EXTM3U',
            ...Object.keys(resolutions).map((label) => {
                const { width, height, bitrate } = resolutions[label];
                return `#EXT-X-STREAM-INF:BANDWIDTH=${bitrate * 1000},RESOLUTION=${width}x${height}\nindex_${label}.m3u8`;
            }),
        ].join('\n');

        fs.writeFileSync(masterPath, masterContent);
        console.log('Master playlist đã được tạo.');

        const files = fs.readdirSync(outputDir);
        console.log(`Found ${files.length} files to upload:`, files);

        const uploadPromises = files.map((filename) => {
            const fileContent = fs.readFileSync(path.join(outputDir, filename));
            const key = `${id}/${filename}`;
            const contentType = filename.endsWith('.m3u8')
                ? 'application/x-mpegURL'
                : 'video/MP2T';
            return uploadToR2(key, fileContent, contentType);
        });

        await Promise.all(uploadPromises);
        console.log('Tải tất cả file lên R2 thành công');

        // Clean up temporary files
        fs.rmSync(inputPath, { force: true });
        fs.rmSync(outputDir, { recursive: true, force: true });
        console.log('Dọn dẹp file tạm xong.');

        // Use the correct R2 public URL from environment variable
        const masterUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${id}/master.m3u8`;
        console.log('URL trả về:', masterUrl);

        return res.status(200).json({ url: masterUrl });

    } catch (err) {
        console.error('Transcode error:', err);

        // Clean up on error
        try {
            if (fs.existsSync(inputPath)) fs.rmSync(inputPath, { force: true });
            if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
            console.log('Cleaned up temporary files after error.');
        } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
        }

        return res.status(500).json({
            message: 'Lỗi xử lý video đa chất lượng',
            error: err.message
        });
    }
});

module.exports = router;