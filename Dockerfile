# ============================================
# Stage 1: Build Backend (Go)
# ============================================
FROM golang:1.22-alpine AS backend-builder

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
    npm \
    curl \
    bash

# Create app user
RUN adduser -D -g '' appuser

WORKDIR /app

# Copy backend binary from builder
COPY --from=backend-builder /app/turbozap /app/turbozap

# Copy frontend standalone build from builder
# Next.js standalone output includes only necessary files
COPY --from=frontend-builder /app/web/.next/standalone /app/web/
COPY --from=frontend-builder /app/web/.next/static /app/web/.next/static
COPY --from=frontend-builder /app/web/public /app/web/public

# Create startup script
RUN printf '#!/bin/bash\n\
    set -e\n\
    \n\
    echo "Starting TurboZap API..."\n\
    \n\
    # Start backend in background\n\
    /app/turbozap &\n\
    BACKEND_PID=$!\n\
    echo "Backend started with PID: $BACKEND_PID"\n\
    \n\
    # Wait a bit for backend to initialize\n\
    sleep 2\n\
    \n\
    # Start frontend in background\n\
    cd /app/web\n\
    PORT=3000 node server.js &\n\
    FRONTEND_PID=$!\n\
    echo "Frontend started with PID: $FRONTEND_PID"\n\
    \n\
    # Function to handle shutdown\n\
    cleanup() {\n\
    echo "Received shutdown signal, stopping services..."\n\
    kill $BACKEND_PID 2>/dev/null || true\n\
    kill $FRONTEND_PID 2>/dev/null || true\n\
    wait $BACKEND_PID 2>/dev/null || true\n\
    wait $FRONTEND_PID 2>/dev/null || true\n\
    echo "Services stopped"\n\
    exit 0\n\
    }\n\
    \n\
    # Trap signals for graceful shutdown\n\
    trap cleanup SIGTERM SIGINT\n\
    \n\
    # Wait for both processes and monitor them\n\
    while true; do\n\
    if ! kill -0 $BACKEND_PID 2>/dev/null; then\n\
    echo "Backend process died, exiting..."\n\
    cleanup\n\
    fi\n\
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then\n\
    echo "Frontend process died, exiting..."\n\
    cleanup\n\
    fi\n\
    sleep 5\n\
    done\n' > /app/start.sh

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
