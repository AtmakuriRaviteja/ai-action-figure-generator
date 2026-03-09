# Startup script for AI Action Figure Generator

$RootDir = Get-Location
$WebUIDir = Join-Path $RootDir "stable-diffusion-webui\stable-diffusion-webui-master"
$BackendDir = Join-Path $RootDir "backend"

Write-Host "--- AI Action Figure Generator Startup ---" -ForegroundColor Cyan

# 1. Start Stable Diffusion WebUI in a new window
Write-Host "Launching Stable Diffusion WebUI..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/c cd /d `"$WebUIDir`" && webui-user.bat"

# 2. Wait for a moment to let SD start initializing (it takes a while)
Write-Host "Waiting 5 seconds for SD to initialize..." -ForegroundColor Green
Start-Sleep -Seconds 5

# 3. Start Backend in a new window
Write-Host "Launching Backend Server..." -ForegroundColor Yellow
Start-Process "cmd.exe" -ArgumentList "/c cd /d `"$BackendDir`" && npm start"

Write-Host "`nBoth services are launching in separate windows." -ForegroundColor Green
Write-Host "1. Wait for Stable Diffusion to show 'Running on local URL: http://0.0.0.0:7860'" -ForegroundColor Gray
Write-Host "2. Then open frontend\index.html in your browser." -ForegroundColor Gray
Write-Host "3. Enjoy creating your AI Action Figures!" -ForegroundColor Gray
