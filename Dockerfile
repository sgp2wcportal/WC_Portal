# syntax=docker/dockerfile:1.7

# ===== Stage 1: Build the Vite/React frontend =====
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build


# ===== Stage 2: Python runtime =====
FROM python:3.12-slim AS runtime

# System libraries needed by Pillow, bcrypt, openpyxl, sqlite
RUN apt-get update && apt-get install -y --no-install-recommends \
        libjpeg62-turbo \
        zlib1g \
        libfreetype6 \
        libffi8 \
        sqlite3 \
        ca-certificates \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first so the layer caches across code changes
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r ./backend/requirements.txt \
 && pip install --no-cache-dir "bcrypt>=4.0,<5.0"

# Backend application code
COPY backend/ ./backend/

# Frontend build output (served by FastAPI at /, /assets/*, and the SPA fallback)
COPY --from=frontend-build /app/dist ./frontend/dist

# Persistent paths live on the Fly volume mounted at /data.
# A symlink at /app/storage means the legacy "../storage/..." paths inside the
# code (qrcodes, menu_images, receipts, payment_qrs, emails) resolve via
# /app/backend/../storage -> /data/storage automatically.
RUN mkdir -p /data/storage \
 && ln -s /data/storage /app/storage

ENV PYTHONUNBUFFERED=1 \
    DATABASE_URL="sqlite:////data/society.db" \
    UPLOAD_FOLDER="/data/storage" \
    BACKUP_FOLDER="/data/backup" \
    DEBUG="False" \
    FRONTEND_DIR="/app/frontend/dist"

WORKDIR /app/backend

EXPOSE 8080

# 2 workers gives a little parallelism for event-day spikes without doubling memory.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2", "--log-level", "info"]
