@echo off
echo --- AI Action Figure Generator Startup ---

echo.
echo Launching Stable Diffusion WebUI...
start cmd /k "cd /d stable-diffusion-webui && webui-user.bat"

echo Launching Backend Server...
start cmd /k "cd /d backend && npm start"

echo.
echo Both services are launching in separate windows!
echo Please wait 15 seconds for them to load before opening your browser...
timeout /t 15 /nobreak >nul

echo Opening frontend in browser...
start http://localhost:3000
