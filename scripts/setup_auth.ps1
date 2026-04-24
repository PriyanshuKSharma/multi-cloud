# SSO and 2FA Setup Script

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..')).Path
Set-Location $RepoRoot

Write-Host "🔐 Setting up SSO and 2FA..." -ForegroundColor Cyan

# Step 1: Rebuild containers with new dependencies
Write-Host "`n📦 Step 1: Rebuilding containers..." -ForegroundColor Yellow
docker-compose down
docker-compose up -d --build

# Wait for services to start
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 2: Run database migration
Write-Host "`n🗄️ Step 2: Running database migration..." -ForegroundColor Yellow
docker exec -it multi-cloud-backend-1 python -m app.db.migrate

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Setup Google OAuth credentials at https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Update backend/.env with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" -ForegroundColor White
Write-Host "3. Restart backend: docker-compose restart backend" -ForegroundColor White
Write-Host "4. Access the app at http://localhost:5173" -ForegroundColor White
Write-Host "`nFor detailed instructions, see docs/SSO_2FA_SETUP.md" -ForegroundColor Gray
