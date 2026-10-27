@echo off
REM ==============================================================================
REM Mehregan Business Suite — Windows Launcher
REM Starts local server with bundled runtime & opens default browser
REM ==============================================================================

chcp 65001 >nul 2>&1
title Mehregan ERP Launcher
color 0B

REM 1. Resolve project root whether executed from /launcher or project root
set "APP_ROOT=%~dp0"
if exist "%APP_ROOT%package.json" (
    rem Script is located directly in project root
) else if exist "%APP_ROOT%..\package.json" (
    pushd "%APP_ROOT%.."
    set "APP_ROOT=%CD%\"
    popd
)

cd /d "%APP_ROOT%"

echo ==============================================================================
echo    راه‌انداز خودکار سامانه یکپارچه کسب‌وکار و حسابداری مهرگان
echo ==============================================================================
echo مسیر اجرایی سامانه: %APP_ROOT%
echo.

REM 2. Identify Node.js runtime
set "NODE_EXEC="
if exist "%APP_ROOT%runtime\node.exe" (
    set "NODE_EXEC=%APP_ROOT%runtime\node.exe"
    set "PATH=%APP_ROOT%runtime;%PATH%"
    echo [1/4] استفاده از موتور تعبیه‌شده در بسته نصبی: %NODE_EXEC%
) else (
    where node >nul 2>&1
    if %errorlevel% equ 0 (
        set "NODE_EXEC=node"
        echo [1/4] موتور اجرایی Node.js در سیستم شناسایی شد.
    ) else if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXEC=C:\Program Files\nodejs\node.exe"
        set "PATH=%PATH%;C:\Program Files\nodejs"
        echo [1/4] موتور اجرایی در مسیر پیش‌فرض سیستم یافت شد.
    ) else if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
        set "NODE_EXEC=%LOCALAPPDATA%\Programs\node\node.exe"
        set "PATH=%PATH%;%LOCALAPPDATA%\Programs\node"
        echo [1/4] موتور اجرایی در مسیر کاربر (AppData) یافت شد.
    ) else (
        echo [خطا] موتور Node.js روی سیستم یافت نشد.
        echo لطفاً نسخه LTS نرم‌افزار Node.js را از https://nodejs.org نصب فرمایید.
        pause
        exit /b 1
    )
)

REM 3. Check and install dependencies if needed
if not exist "%APP_ROOT%node_modules\" (
    echo [2/4] در حال نصب خودکار پیش‌نیازها و بسته‌های پروژه... لطفاً منتظر بمانید.
    call npm install
    if %errorlevel% neq 0 (
        echo [خطا] نصب بسته‌های پروژه با مشکل مواجه شد. لطفاً اتصال اینترنت را بررسی کنید.
        pause
        exit /b 1
    )
    echo [2/4] بسته‌های پیش‌نیاز با موفقیت نصب شدند.
) else (
    echo [2/4] بسته‌های پیش‌نیاز آماده هستند.
)

REM 4. Check frontend build
if not exist "%APP_ROOT%dist\index.html" (
    echo [3/4] در حال آماده‌سازی فایل‌های کامپایل‌شده رابط کاربری (Vite Build)...
    call npm run build
) else (
    echo [3/4] رابط کاربری آماده است.
)

REM 5. Server Launch
set "PORT=3000"
echo.
echo ==============================================================================
echo  [4/4] در حال راه‌اندازی سرور مرکزی روی پورت %PORT%...
echo ------------------------------------------------------------------------------
echo  * آدرس سامانه:          http://localhost:%PORT%
echo  * نام کاربری مدیر:      admin        ^| رمز عبور: admin
echo  * نام کاربری نصاب:      installer_ali ^| رمز عبور: ali@123
echo.
echo  برای متوقف کردن سرور، پنجره را ببندید یا کلیدهای Ctrl+C را فشار دهید.
echo ==============================================================================
echo.

REM Open browser after 3 seconds in background without blocking
start "" cmd /c "ping 127.0.0.1 -n 4 >nul & start http://localhost:%PORT%"

REM Start server process in foreground so terminal stays active and logs are visible
if exist "%APP_ROOT%server.cjs" (
    call "%NODE_EXEC%" "%APP_ROOT%server.cjs"
) else (
    call npm run dev
)

if %errorlevel% neq 0 (
    echo.
    echo [تلاش مجدد] اجرای سرور با موتور جایگزین...
    call npm start
)

if %errorlevel% neq 0 (
    echo.
    echo [خطا] اجرای سرور با خطا مواجه گردید. لطفاً خطای نمایش داده شده را بررسی کنید.
    pause
)
