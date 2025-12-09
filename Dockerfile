# ============================================
# Stage 1: Build Backend (Go)
# ============================================
FROM golang:1.24-alpine AS backend-builder

RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build backend API
RUN CGO_ENABLED=0 GOOS=linux go build -o turbozap ./cmd/api

# Build create_db helper
RUN CGO_ENABLED=0 GOOS=linux go build -o create_db ./scripts/create_db.go

# ============================================
# Stage 2: Build Frontend (Next.js)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

COPY web/package*.json ./
RUN npm ci

COPY web/ ./
RUN npm run build

# ============================================
# Stage 3: Runtime
# ============================================
FROM alpine:3.19

RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    nodejs \
    npm \
    curl \
    bash \
    postgresql-client

RUN adduser -D -g '' appuser

WORKDIR /app

# Copy backend binaries
COPY --from=backend-builder /app/turbozap /app/turbozap
COPY --from=backend-builder /app/create_db /app/create_db

# Copy frontend standalone build
COPY --from=frontend-builder /app/web/.next/standalone /app/web/
COPY --from=frontend-builder /app/web/.next/static /app/web/.next/static
COPY --from=frontend-builder /app/web/public /app/web/public

# ============================================
# Startup Script (Banco + Backend + Frontend)
# ============================================
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
echo \"🚀 Starting TurboZap...\"\n\
\n\
# =======================\n\
# Create database\n\
# =======================\n\
if [ -z \"$DATABASE_URL\" ]; then\n\
  echo \"❌ ERROR: DATABASE_URL not set\"\n\
  exit 1\n\
fi\n\
\n\
echo \"🏦 Checking database...\"\n\
/app/create_db || true\n\
\n\
# =======================\n\
# Start Backend\n\
# =======================\n\
echo \"🚀 Starting Backend API...\"\n\
/app/turbozap &\n\
BACKEND_PID=$!\n\
\n\
sleep 2\n\
\n\
# =======================\n\
# Start Frontend\n\
# =======================\n\
echo \"🌐 Starting Frontend...\"\n\
cd /app/web\n\
PORT=3000 node server.js &\n\
FRONTEND_PID=$!\n\
\n\
cleanup() {\n\
  echo \"🛑 Shutting down...\"\n\
  kill $BACKEND_PID 2>/dev/null || true\n\
  kill $FRONTEND_PID 2>/dev/null || true\n\
  exit 0\n\
}\n\
trap cleanup SIGTERM SIGINT\n\
\n\
while true; do\n\
  sleep 5\n\
done\n' > /app/start.sh

RUN chmod +x /app/start.sh
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health && curl -f http://localhost:3000 || exit 1

CMD ["/app/start.sh"]
