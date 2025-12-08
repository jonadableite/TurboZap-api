# ============================================
# Stage 1: Build Backend (Go)
# ============================================
FROM golang:1.24-alpine AS backend-builder

RUN apk add --no-cache git gcc musl-dev
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o wavezap ./cmd/api

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
    postgresql-client   # necessário para criar banco

RUN adduser -D -g '' appuser
WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/wavezap /app/wavezap

# Copy frontend standalone build
COPY --from=frontend-builder /app/web/.next/standalone /app/web/
COPY --from=frontend-builder /app/web/.next/static /app/web/.next/static
COPY --from=frontend-builder /app/web/public /app/web/public

# Create startup script
RUN printf '#!/bin/bash\n\
set -e\n\
echo "Starting WaveZap..."\n\
\n\
# ================================\n\
# 1) CHECK / CREATE DATABASE\n\
# ================================\n\
echo "Checking PostgreSQL connection..."\n\
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do\n\
  echo "Waiting for PostgreSQL..."\n\
  sleep 2\n\
done\n\
\n\
echo "Checking if database exists: $DB_NAME"\n\
DB_EXISTS=$(psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -tAc "SELECT 1 FROM pg_database WHERE datname='\''$DB_NAME'\''")\n\
if [ "$DB_EXISTS" != "1" ]; then\n\
  echo "Database $DB_NAME does not exist. Creating..."\n\
  psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME"\n\
else\n\
  echo "Database $DB_NAME already exists. Skipping creation."\n\
fi\n\
\n\
# ================================\n\
# 2) START BACKEND\n\
# ================================\n\
echo "Starting WaveZap API..."\n\
/app/wavezap &\n\
BACKEND_PID=$!\n\
echo "Backend started with PID: $BACKEND_PID"\n\
\n\
sleep 2\n\
\n\
# ================================\n\
# 3) START FRONTEND\n\
# ================================\n\
cd /app/web\n\
PORT=3000 node server.js &\n\
FRONTEND_PID=$!\n\
echo "Frontend started with PID: $FRONTEND_PID"\n\
\n\
# ================================\n\
# 4) CLEANUP HANDLER\n\
# ================================\n\
cleanup() {\n\
  echo "Shutdown signal received. Stopping services..."\n\
  kill $BACKEND_PID 2>/dev/null || true\n\
  kill $FRONTEND_PID 2>/dev/null || true\n\
  wait $BACKEND_PID 2>/dev/null || true\n\
  wait $FRONTEND_PID 2>/dev/null || true\n\
  echo "WaveZap stopped."\n\
  exit 0\n\
}\n\
\n\
trap cleanup SIGTERM SIGINT\n\
\n\
# ================================\n\
# 5) PROCESS MONITOR\n\
# ================================\n\
while true; do\n\
  if ! kill -0 $BACKEND_PID 2>/dev/null; then\n\
    echo "Backend died. Exiting..."\n\
    cleanup\n\
  fi\n\
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then\n\
    echo "Frontend died. Exiting..."\n\
    cleanup\n\
  fi\n\
  sleep 5\n\
done\n\
' > /app/start.sh

RUN chmod +x /app/start.sh
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health && curl -f http://localhost:3000 || exit 1

CMD ["/app/start.sh"]
