@echo off
chcp 65001 >nul 2>&1
title Mehregan ERP - اجرای مستقیم در پنجره مستقل ویندوز
color 0B

cd /d "%~dp0"

echo ==============================================================================
echo    سامانه مهرگان — راه‌اندازی مستقیم در حالت پنجره مستقل اپلیکیشن
echo ==============================================================================
echo.

rem 1. Check Node.js
where node >nul 2>&1
if %errorlevel% equ 0 goto NODE_FOUND

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=%PATH%;C:\Program Files\nodejs"
    goto NODE_FOUND
)
if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
    set "PATH=%PATH%;%LOCALAPPDATA%\Programs\node"
    goto NODE_FOUND
)
if exist "%~dp0runtime\node.exe" (
    set "PATH=%~dp0runtime;%PATH%"
    goto NODE_FOUND
)

echo [خطا] نرم‌افزار Node.js روی سیستم شما یافت نشد.
pause
exit /b 1

:NODE_FOUND
if exist "%~dp0node_modules\" goto DEPS_FOUND
call npm install

:DEPS_FOUND
echo در حال باز کردن پنجره اختصاصی نرم‌افزار...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; if (Get-Command msedge -ErrorAction SilentlyContinue) { Start-Process msedge '--app=http://localhost:3000' } else if (Get-Command chrome -ErrorAction SilentlyContinue) { Start-Process chrome '--app=http://localhost:3000' } else { Start-Process 'http://localhost:3000' }" >nul 2>&1 &

echo.
echo ==============================================================================
echo  آدرس سامانه:          http://localhost:3000
echo  برای توقف سرور، این پنجره را ببندید یا Ctrl+C را بفشارید.
echo ==============================================================================
echo.

call npm run dev
if %errorlevel% neq 0 call npm start
pause
