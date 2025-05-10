import { S3Client, ListObjectsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Cấu hình AWS S3
const accessKeyId = process.env.AWS_ACCESS_KEY_ID; 
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});


const bucketName = process.env.S3_BUCKET_NAME || 'testlistmovies';
const outputBaseDirectory = './converted-videos'; // Thư mục để lưu video đã chuyển sang m3u8

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
        resolve();
      })
      .on('error', (error) => {
        console.error(`Lỗi trong quá trình chuyển đổi: ${error.message}`);
        reject(error);
      })
      .run();
  });
}

// Kiểm tra xem thư mục và tệp M3U8 có tồn tại chưa
function checkIfExists(filePath) {
  return fs.existsSync(filePath);
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

          // Tải tệp mp4 từ S3
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

          for (const resolution of resolutions) {
            const outputM3u8Key = `${baseFileName}-${resolution}.m3u8`;
            const outputM3u8Path = path.join(videoOutputDirectory, outputM3u8Key);

            // Kiểm tra xem M3U8 đã tồn tại chưa
            if (!checkIfExists(outputM3u8Path)) {
              await convertMp4ToM3u8(tempMp4FilePath, videoOutputDirectory, baseFileName, resolution);
              console.log(`Tệp ${outputM3u8Key} đã được lưu tại ${outputM3u8Path}`);
            } else {
              console.log(`Tệp ${outputM3u8Key} đã tồn tại. Bỏ qua việc chuyển đổi.`);
            }
          }
          fs.unlinkSync(tempMp4FilePath); // Xóa tệp MP4 sau khi chuyển đổi
          console.log(`Đã xóa tệp tạm: ${tempMp4FilePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in processVideos:', error);
  }
}

processVideos().catch(console.error);
