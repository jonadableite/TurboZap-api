# Script PowerShell para build e push das imagens Docker
# Uso: .\scripts\build-and-push.ps1 -Registry "docker.io/seu-usuario" -Tag "v1.0.0"

param(
    [string]$Registry = "docker.io/seu-usuario",
    [string]$Tag = "latest"
)

Write-Host "🚀 Building and pushing TurboZap images..." -ForegroundColor Cyan
Write-Host "Registry: $Registry" -ForegroundColor Yellow
Write-Host "Tag: $Tag" -ForegroundColor Yellow
Write-Host ""

# Build backend
Write-Host "📦 Building backend..." -ForegroundColor Green
docker build -f Dockerfile.backend -t "${Registry}/turbozap-backend:${Tag}" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend built successfully" -ForegroundColor Green

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Green
docker build -f Dockerfile.frontend -t "${Registry}/turbozap-frontend:${Tag}" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green

# Push backend
Write-Host "📤 Pushing backend..." -ForegroundColor Cyan
docker push "${Registry}/turbozap-backend:${Tag}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend pushed successfully" -ForegroundColor Green

# Push frontend
Write-Host "📤 Pushing frontend..." -ForegroundColor Cyan
docker push "${Registry}/turbozap-frontend:${Tag}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend pushed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All images built and pushed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: ${Registry}/turbozap-backend:${Tag}" -ForegroundColor Yellow
Write-Host "Frontend: ${Registry}/turbozap-frontend:${Tag}" -ForegroundColor Yellow

