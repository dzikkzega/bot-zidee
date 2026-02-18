# ============================================
# Dockerfile for ZideeBot WhatsApp Bot
# Base: Node.js 20 Alpine (Lightweight)
# ============================================

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for WhatsApp Bot
# - ffmpeg: untuk audio/video processing
# - python3, make, g++: untuk native dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
# Using --legacy-peer-deps karena beberapa dependencies mungkin conflict
RUN npm install --legacy-peer-deps --production

# Copy all application files
COPY . .

# Create necessary directories for data persistence
RUN mkdir -p \
    session \
    temp \
    tmp \
    logs \
    products \
    data \
    assets

# Set permissions
RUN chmod +x *.js *.sh 2>/dev/null || true

# Environment variables (can be overridden)
ENV NODE_ENV=production \
    TZ=Asia/Jakarta

# Expose port (optional, jika bot memiliki web panel)
# EXPOSE 3000

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('Bot is running')" || exit 1

# Volume untuk data persistence
VOLUME ["/app/session", "/app/temp", "/app/tmp", "/app/logs", "/app/products", "/app/data"]

# Command untuk menjalankan bot
CMD ["node", "index.js"]
CMD ["node", "index.js"]
