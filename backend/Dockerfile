FROM node:18-alpine

RUN apk add --no-cache \
    ffmpeg \
    wget \
    && rm -rf /var/cache/apk/*

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN mkdir -p /app/temp && \
    mkdir -p /tmp/hls-temp

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app && \
    chown -R nodejs:nodejs /tmp/hls-temp && \
    chmod 755 /app/temp

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/upload/health || exit 1

CMD ["npm", "start"]