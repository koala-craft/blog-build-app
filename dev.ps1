# AuraEngine Dev Restart Script (PowerShell)

Write-Host "--- AuraEngine: 全サービスを再起動中... ---" -ForegroundColor Cyan

# 1. データベース (Docker)
Write-Host "[1/3] データベースを起動しています..." -ForegroundColor Yellow
docker compose up -d db

# 2. バックエンド (FastAPI / uvicorn)
Write-Host "[2/3] バックエンドを起動しています (Port 8000)..." -ForegroundColor Yellow
# 既存の 8000 ポートプロセスを終了 (Windows)
$backendProc = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendProc) {
    Stop-Process -Id $backendProc.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

# 3. フロントエンド (Next.js / pnpm)
Write-Host "[3/3] フロントエンドを起動しています (Port 3000)..." -ForegroundColor Yellow
# 既存の 3000 ポートプロセスを終了 (Windows)
$frontendProc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendProc) {
    Stop-Process -Id $frontendProc.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; pnpm dev"

Write-Host "--- 全てのサービスが立ち上がりました ---" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
