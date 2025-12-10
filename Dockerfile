# ============================================
# Stage 1: Build Backend (Go)
# ============================================
FROM golang:1.24-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the backend application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o turbozap ./cmd/api

# Build database setup script
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o setup_db ./scripts/setup_db.go

# Build seed script
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o seed_db ./scripts/seed.go

# ============================================
# Stage 2: Build Frontend (Next.js)
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/web

# Copy package files
COPY web/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY web/ ./

# Build Next.js application
RUN npm run build

# ============================================
# Stage 3: Runtime
# ============================================
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    nodejs \
    curl \
    bash \
    netcat-openbsd

# Runtime defaults (can be overridden at deploy time)
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    FRONTEND_PORT=3000 \
    BACKEND_PORT=8080

# Create app user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy backend binary from builder
COPY --from=backend-builder /app/turbozap /app/turbozap

# Copy database setup scripts
COPY --from=backend-builder /app/setup_db /app/setup_db
COPY --from=backend-builder /app/seed_db /app/seed_db

# Copy frontend standalone build from builder
# Next.js standalone output includes only necessary files
COPY --from=frontend-builder /app/web/.next/standalone /app/web/
COPY --from=frontend-builder /app/web/.next/static /app/web/.next/static
COPY --from=frontend-builder /app/web/public /app/web/public

# Create startup script
RUN cat <<'EOF' > /app/start.sh
#!/bin/bash
set -euo pipefail

# Respect env overrides coming from the platform
BACKEND_PORT="${BACKEND_PORT:-${SERVER_PORT:-8080}}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

export SERVER_HOST="${SERVER_HOST:-0.0.0.0}"
export SERVER_PORT="${SERVER_PORT:-$BACKEND_PORT}"
export PORT="${FRONTEND_PORT}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="${NODE_ENV:-production}"
export NEXT_TELEMETRY_DISABLED="${NEXT_TELEMETRY_DISABLED:-1}"

# Wait for database to be ready (if using external DB)
if [ -n "${DATABASE_URL:-}" ]; then
  echo "⏳ Aguardando banco de dados estar pronto..."
  max_attempts=30
  attempt=0
  
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  
  if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    while [ $attempt -lt $max_attempts ]; do
      if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
        echo "✅ Banco de dados está pronto!"
        break
      fi
      attempt=$((attempt + 1))
      echo "  Tentativa $attempt/$max_attempts..."
      sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
      echo "⚠️  Aviso: Não foi possível conectar ao banco após $max_attempts tentativas"
      echo "   Continuando mesmo assim..."
    fi
  fi
  
  # Setup database (create, migrate, seed)
  echo "🔧 Configurando banco de dados..."
  if [ -f /app/setup_db ]; then
    /app/setup_db || {
      echo "⚠️  Aviso: Erro ao configurar banco de dados"
      echo "   Continuando mesmo assim..."
    }
  else
    echo "⚠️  Aviso: Script setup_db não encontrado"
  fi
fi

echo "Starting TurboZap API (port: ${SERVER_PORT})..."
/app/turbozap &
BACKEND_PID=$!

# Small delay for backend bootstrap
sleep 2

echo "Starting TurboZap Web (port: ${PORT})..."
cd /app/web
node server.js &
FRONTEND_PID=$!

cleanup() {
  echo "Received shutdown signal, stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID 2>/dev/null || true
  wait $FRONTEND_PID 2>/dev/null || true
  echo "Services stopped"
  exit 0
}

trap cleanup SIGTERM SIGINT

while true; do
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Backend process died, exiting..."
    cleanup
  fi
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "Frontend process died, exiting..."
    cleanup
  fi
  sleep 5
done
EOF

RUN chmod +x /app/start.sh

# Change ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose ports
# 8080 for backend API
# 3000 for frontend Next.js
EXPOSE 8080 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health && curl -f http://localhost:3000 || exit 1

# Start both services
CMD ["/app/start.sh"]
