/**
 * @typedef {Object} ResolutionLink
 * @property {string} resolution
 * @property {string} localPath
 */

import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'; // Changed import
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Cấu hình Cloudflare R2
const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

// Đường dẫn endpoint R2
const r2Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

// Khởi tạo R2 client
const r2Client = new S3Client({
    endpoint: r2Endpoint,
    region: 'auto',
    credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
    },
});

const outputBaseDirectory = './converted-videos';

// Đảm bảo thư mục gốc tồn tại
if (!fs.existsSync(outputBaseDirectory)) {
    fs.mkdirSync(outputBaseDirectory, { recursive: true });
}

// Thiết lập đường dẫn FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Converts an MP4 file to M3U8 format with a specified resolution.
 * @param {string} mp4FilePath - The path to the MP4 file.
 * @param {string} outputDirectory - The directory to save the M3U8 files.
 * @param {string} baseFileName - The base file name for the output files.
 * @param {string} resolution - The desired resolution (e.g., '1920x1080').
 * @returns {Promise<string>} - A promise that resolves with the path to the M3U8 file.
 */
function convertMp4ToM3u8(mp4FilePath, outputDirectory, baseFileName, resolution) {
    const outputM3u8Path = path.join(outputDirectory, `${baseFileName}-${resolution}.m3u8`);
    return new Promise((resolve, reject) => {
        ffmpeg(mp4FilePath)
            .outputOptions([
                `-vf scale=${resolution}`,
                '-hls_time 10',
                '-hls_list_size 0',
                '-f hls',
            ])
            .output(outputM3u8Path)
            .on('end', () => {
                console.log(`Conversion successful: ${mp4FilePath} to ${outputM3u8Path}`);
                resolve(outputM3u8Path);
            })
            .on('error', (error) => {
                console.error(`Error during conversion: ${error.message}`);
                reject(error);
            })
            .run();
    });
}

/**
 * Creates a master M3U8 playlist file.
 * @param {string} videoName - The name of the video.
 * @param {ResolutionLink[]} resolutions - An array of resolution and local file path.
 * @param {string} outputDirectory - The directory to save the master playlist.  Added outputDirectory
 * @returns {string} - The path to the created master playlist file.
 */
function createMasterPlaylist(videoName, resolutions, outputDirectory) { // Added outputDirectory
    let masterPlaylistContent = '#EXTM3U\n';

    resolutions.forEach((item) => {
        const bandwidth = estimateBandwidth(item.resolution);
        const m3u8FileName = path.basename(item.localPath);  // Use local file name
        masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${item.resolution}\n`;
        masterPlaylistContent += `${m3u8FileName}\n`;
    });

    const masterPlaylistPath = path.join(outputDirectory, `${videoName}.m3u8`); // Use outputDirectory
    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
    return masterPlaylistPath;
}

/**
 * Estimates the bandwidth based on the video resolution.
 * @param {string} resolution - The video resolution (e.g., '1920x1080').
 * @returns {number} - The estimated bandwidth.
 */
function estimateBandwidth(resolution) {
    const dimensions = resolution.split('x').map(Number);
    const pixels = dimensions[0] * dimensions[1];

    if (pixels > 1920 * 1080) return 8000000;
    if (pixels > 1280 * 720) return 5000000;
    if (pixels > 854 * 480) return 3000000;
    return 1000000;
}

/**
 * Downloads a file from Cloudflare R2 to a local path.
 * @param {string} key - The key of the file in R2.
 * @param {string} localFilePath - The local file path to save the downloaded file.
 * @returns {Promise<void>}
 */
async function downloadFromR2(key, localFilePath) {
    try {
        const getObjectCommand = new GetObjectCommand({ Bucket: r2BucketName, Key: key });
        const response = await r2Client.send(getObjectCommand);
        if (!response.Body) {
            throw new Error(`No body in R2 response for key: ${key}`);
        }

        const writeStream = createWriteStream(localFilePath);
        // Node.js v18+
        if (typeof response.Body.pipe === 'function') {
            response.Body.pipe(writeStream);
        }
        //for older versions
        else{
             await new Promise((resolve, reject) => {
                response.Body.on('data', (chunk) => writeStream.write(chunk));
                response.Body.on('end', () => {
                    writeStream.end();
                    resolve();
                });
                response.Body.on('error', reject);
                writeStream.on('error', reject); 
            });
        }


        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        console.log(`Downloaded ${key} from R2 to ${localFilePath}`);
    } catch (error) {
        console.error(`Failed to download ${key} from R2:`, error);
        throw error;
    }
}


async function processVideosFromR2() {
    try {
        const listCommand = new ListObjectsV2Command({ Bucket: r2BucketName });
        let isTruncated = true;
        let continuationToken;
        const mp4Files = [];

        while (isTruncated) {
            const listResponse = await r2Client.send(listCommand);
            if (listResponse.Contents) {
                for (const item of listResponse.Contents) {
                    if (item.Key?.endsWith('.mp4')) {
                        mp4Files.push(item.Key);
                    }
                }
            }
            isTruncated = listResponse.IsTruncated || false;
            continuationToken = listResponse.NextContinuationToken;
            if (continuationToken) {
                listCommand.ContinuationToken = continuationToken;
            }
        }


        if (mp4Files.length === 0) {
            console.log('No MP4 files found in R2 bucket.');
            return;
        }

        for (const mp4Key of mp4Files) {
            const baseFileName = path.basename(mp4Key, '.mp4');
            const videoOutputDirectory = path.join(outputBaseDirectory, baseFileName);
            const resolutions = ['1920x1080', '1280x720', '854x480', '640x360'];

            if (!fs.existsSync(videoOutputDirectory)) {
                fs.mkdirSync(videoOutputDirectory, { recursive: true });
            }

            // Kiểm tra xem các tệp M3U8 đã tồn tại chưa
            const m3u8Exists = resolutions.some(res =>
                fs.existsSync(path.join(videoOutputDirectory, `${baseFileName}-${res}.m3u8`))
            );
            if (m3u8Exists) {
                console.log(`M3U8 files for ${baseFileName} already exist. Skipping.`);
                continue;
            }

            const localMp4FilePath = path.join(videoOutputDirectory, baseFileName + '.mp4');
            await downloadFromR2(mp4Key, localMp4FilePath);


            /** @type {ResolutionLink[]} */
            const resolutionLinks = [];

            for (const resolution of resolutions) {
                const outputM3u8Path = await convertMp4ToM3u8(localMp4FilePath, videoOutputDirectory, baseFileName, resolution);
                resolutionLinks.push({ resolution, localPath: outputM3u8Path });
                console.log(`M3U8 file for ${resolution} created at ${outputM3u8Path}`);
            }

            fs.unlinkSync(localMp4FilePath);
            console.log(`Deleted temporary file: ${localMp4FilePath}`);

            // Pass the videoOutputDirectory to createMasterPlaylist
            const masterPlaylistPath = createMasterPlaylist(baseFileName, resolutionLinks, videoOutputDirectory);
            console.log(`Master playlist created at ${masterPlaylistPath}`);
        }
    } catch (error) {
        console.error('Error processing videos from R2:', error);
    }
}

processVideosFromR2().catch(console.error);
