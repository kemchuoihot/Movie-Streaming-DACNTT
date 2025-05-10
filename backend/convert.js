/**
 * @typedef {Object} ResolutionLink
 * @property {string} resolution
 * @property {string} s3Key
 */

import { S3Client, ListObjectsCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Cấu hình AWS S3
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'ap-southeast-2';

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const bucketName = process.env.S3_BUCKET_NAME || 'testlistmovies';
const outputBaseDirectory = './converted-videos'; // Thư mục gốc
const s3OutputDirectory = 'videos'; // Thư mục trên S3 để lưu video

// Đảm bảo thư mục gốc tồn tại
if (!fs.existsSync(outputBaseDirectory)) {
  fs.mkdirSync(outputBaseDirectory);
}

// Thiết lập đường dẫn cho FFmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function convertMp4ToM3u8(mp4FilePath, outputDirectory, baseFileName, resolution) {
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
        console.log(`Chuyển đổi thành công: ${mp4FilePath} sang ${outputM3u8Path}`);
        resolve(outputM3u8Path); // Resolve về đường dẫn file m3u8
      })
      .on('error', (error) => {
        console.error(`Lỗi trong quá trình chuyển đổi: ${error.message}`);
        reject(error);
      })
      .run();
  });
}

// Kiểm tra xem file có tồn tại
function checkIfExists(filePath) {
  return fs.existsSync(filePath);
}

// Upload file lên S3
async function uploadToS3(filePath, s3Key) {
  const readStream = createReadStream(filePath);
  const uploadParams = {
    Bucket: bucketName,
    Key: s3Key,
    Body: readStream,
  };

  try {
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`Đã tải lên ${filePath} thành công lên S3 với key ${s3Key}`);
    return {
      Location: result.Location,
      Key: s3Key,
    }; // Trả về Location và Key
  } catch (error) {
    console.error(`Lỗi tải lên ${filePath} lên S3:`, error);
    throw error;
  }
}

// Tạo Master Playlist
function createMasterPlaylist(videoName, resolutions) {
  let masterPlaylistContent = '#EXTM3U\n';

  resolutions.forEach((item) => {
    const bandwidth = estimateBandwidth(item.resolution);
    masterPlaylistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${item.resolution}\n`;
    masterPlaylistContent += `${item.s3Key}\n`;
  });

  const masterPlaylistPath = path.join(outputBaseDirectory, `${videoName}.m3u8`);
  fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
  return masterPlaylistPath;
}

// Ước tính băng thông (đơn giản hóa)
function estimateBandwidth(resolution) {
  const dimensions = resolution.split('x').map(Number);
  const pixels = dimensions[0] * dimensions[1];

  // Ước tính rất đơn giản, có thể cần điều chỉnh
  if (pixels > 1920 * 1080) return 8000000;
  if (pixels > 1280 * 720) return 5000000;
  if (pixels > 854 * 480) return 3000000;
  return 1000000;
}

// Xử lý video trong bucket S3
async function processVideos() {
  try {
    const listCommand = new ListObjectsCommand({ Bucket: bucketName });
    const data = await s3Client.send(listCommand);

    if (data.Contents) {
      for (const item of data.Contents) {
        if (item.Key?.endsWith('.mp4')) {
          const mp4Key = item.Key;
          const baseFileName = path.basename(mp4Key, '.mp4');
          const videoOutputDirectory = path.join(outputBaseDirectory, baseFileName);
          const resolutions = ['1920x1080', '1280x720', '854x480', '640x360'];

          // Tạo thư mục cho video nếu nó chưa tồn tại
          if (!fs.existsSync(videoOutputDirectory)) {
            fs.mkdirSync(videoOutputDirectory, { recursive: true });
          }

          // Kiểm tra nếu thư mục chứa các file m3u8 đã được tạo trước đó, nếu có thì bỏ qua.
          const m3u8Exists = resolutions.some(resolution =>
            fs.existsSync(path.join(videoOutputDirectory, `${baseFileName}-${resolution}.m3u8`))
          );
          if (m3u8Exists) {
            console.log(`Các tệp M3U8 cho ${baseFileName} đã tồn tại. Bỏ qua.`);
            continue; // Chuyển sang video tiếp theo
          }

          // Tải file mp4 từ S3
          const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: mp4Key });
          const response = await s3Client.send(getObjectCommand);

          const tempMp4FilePath = path.join(videoOutputDirectory, mp4Key);
          const writeStream = createWriteStream(tempMp4FilePath);
          response.Body?.pipe(writeStream);

          await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          });

          console.log(`Đã tải xuống: ${mp4Key} vào ${tempMp4FilePath}`);

          /** @type {ResolutionLink[]} */
          const resolutionLinks = []; // Array để lưu thông tin resolution và link S3

          for (const resolution of resolutions) {
            const outputM3u8Key = `${s3OutputDirectory}/${baseFileName}/${baseFileName}-${resolution}.m3u8`; // Đường dẫn trên S3
            const outputM3u8Path = path.join(videoOutputDirectory, `${baseFileName}-${resolution}.m3u8`);

            // Kiểm tra xem M3U8 đã tồn tại chưa
            if (!checkIfExists(outputM3u8Path)) {
              const localM3u8Path = await convertMp4ToM3u8(tempMp4FilePath, videoOutputDirectory, baseFileName, resolution);
              console.log(`Tệp ${outputM3u8Key} đã được lưu tại ${outputM3u8Path}`);
              try {
                // Upload file m3u8 lên s3
                const s3Result = await uploadToS3(localM3u8Path, outputM3u8Key);
                resolutionLinks.push({ resolution, s3Key: s3Result.Key });
              } catch (error) {
                console.error(`Upload failed for ${outputM3u8Key}:`, error);
                // Xử lý lỗi
              }
            } else {
              console.log(`Tệp ${outputM3u8Key} đã tồn tại. Bỏ qua việc chuyển đổi.`);
            }
          }
          fs.unlinkSync(tempMp4FilePath);
          console.log(`Đã xóa file tạm: ${tempMp4FilePath}`);

          // Tạo và upload Master Playlist
          const masterPlaylistPath = createMasterPlaylist(baseFileName, resolutionLinks);
          const masterPlaylistKey = `${s3OutputDirectory}/${baseFileName}/${baseFileName}.m3u8`;
          try {
            await uploadToS3(masterPlaylistPath, masterPlaylistKey);
            console.log(`Đã tải lên Master Playlist: ${masterPlaylistKey}`);
          } catch (error) {
                console.error("Failed to upload master playlist", error)
          }
          fs.unlinkSync(masterPlaylistPath);
        }
      }
    }
  } catch (error) {
    console.error('Error in processVideos:', error);
  }
}

processVideos().catch(console.error);