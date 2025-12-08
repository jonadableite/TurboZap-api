#!/bin/bash

# Script para build e push das imagens Docker
# Uso: ./scripts/build-and-push.sh [registry] [tag]
# Exemplo: ./scripts/build-and-push.sh docker.io/seu-usuario v1.0.0

set -e

REGISTRY=${1:-"docker.io/seu-usuario"}
TAG=${2:-"latest"}

echo "🚀 Building and pushing TurboZap images..."
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

# Build backend
echo "📦 Building backend..."
docker build -f Dockerfile.backend -t ${REGISTRY}/turbozap-backend:${TAG} .
echo "✅ Backend built successfully"

# Build frontend
echo "📦 Building frontend..."
docker build -f Dockerfile.frontend -t ${REGISTRY}/turbozap-frontend:${TAG} .
echo "✅ Frontend built successfully"

# Push backend
echo "📤 Pushing backend..."
docker push ${REGISTRY}/turbozap-backend:${TAG}
echo "✅ Backend pushed successfully"

# Push frontend
echo "📤 Pushing frontend..."
docker push ${REGISTRY}/turbozap-frontend:${TAG}
echo "✅ Frontend pushed successfully"

echo ""
echo "🎉 All images built and pushed successfully!"
echo ""
echo "Backend: ${REGISTRY}/turbozap-backend:${TAG}"
echo "Frontend: ${REGISTRY}/turbozap-frontend:${TAG}"

