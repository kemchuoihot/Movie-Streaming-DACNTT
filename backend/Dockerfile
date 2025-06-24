# Dockerfile - Updated with FFmpeg support
FROM node:18-alpine

# ✅ INSTALL FFMPEG for HLS transcoding
RUN apk add --no-cache \
    ffmpeg \
    wget \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# ✅ CREATE TEMP DIRECTORY for video processing
RUN mkdir -p /app/temp && \
    mkdir -p /tmp/hls-temp

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ✅ GIVE PROPER PERMISSIONS for temp directories
RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /tmp/hls-temp && \
    chmod 755 /app/temp

USER nodejs

# Expose port
EXPOSE 5000

# ✅ ENHANCED HEALTH CHECK
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/upload/health || exit 1

# Start command
CMD ["npm", "start"]