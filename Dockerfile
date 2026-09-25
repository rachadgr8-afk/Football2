# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# FOOTBALL CINEMATIC AI — production image
# Node 20 + FFmpeg (required for the real video rendering pipeline)
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim

# Install FFmpeg + curl (curl is used by the engine to fetch remote sources)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (npm ci needs the lockfile)
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy the rest of the source
COPY . .

# Build the client (dist/) and the server bundle (server.js)
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

# Use the bundled server (fast startup, no tsx needed at runtime)
CMD ["node", "server.js"]
