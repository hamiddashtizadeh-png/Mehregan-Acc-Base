@echo off
chcp 65001 >nul 2>&1
title Mehregan ERP Launcher

set "APP_ROOT=%~dp0"
if exist "%APP_ROOT%package.json" goto SET_ROOT
if exist "%APP_ROOT%..\package.json" (
    pushd "%APP_ROOT%.."
    set "APP_ROOT=%CD%\"
    popd
)

:SET_ROOT
cd /d "%APP_ROOT%"

echo ==============================================================================
echo    راه‌انداز خودکار سامانه یکپارچه کسب‌وکار و حسابداری مهرگان
echo ==============================================================================
echo مسیر اجرایی سامانه: %APP_ROOT%
echo.

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
if exist "%APP_ROOT%runtime\node.exe" (
    set "PATH=%APP_ROOT%runtime;%PATH%"
    goto NODE_FOUND
)

echo [خطا] موتور Node.js روی سیستم یافت نشد.
echo لطفاً نسخه LTS نرم‌افزار Node.js را از https://nodejs.org نصب فرمایید.
explorer "https://nodejs.org"
pause
exit /b 1

:NODE_FOUND
echo [1/4] موتور اجرایی Node.js شناسایی شد.
echo.

if exist "%APP_ROOT%node_modules\" goto DEPS_FOUND

echo [2/4] در حال نصب خودکار پیش‌نیازها... لطفاً منتظر بمانید.
call npm install
if %errorlevel% neq 0 (
    echo [خطا] نصب بسته‌های پروژه با مشکل مواجه شد.
    pause
    exit /b 1
)

:DEPS_FOUND
echo [2/4] بسته‌های پیش‌نیاز آماده هستند.
echo.

echo [3/4] باز کردن مرورگر پیش‌فرض...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'" >nul 2>&1 &

echo.
echo ==============================================================================
echo  آدرس سامانه:          http://localhost:3000
echo  نام کاربری مدیر:      admin        ^| رمز عبور: admin
echo  نام کاربری نصاب:      installer_ali ^| رمز عبور: ali@123
echo  برای متوقف کردن سرور، این پنجره را ببندید یا Ctrl+C را فشار دهید.
echo ==============================================================================
echo.

echo [4/4] در حال راه‌اندازی سرور مرکزی روی پورت 3000...
call npm run dev
if %errorlevel% neq 0 (
    echo [تلاش مجدد] اجرای سرور با موتور جایگزین...
    call npm start
)

if %errorlevel% neq 0 (
    echo [خطا] اجرای سرور با خطا مواجه گردید.
    pause
)
