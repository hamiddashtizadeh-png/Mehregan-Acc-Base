@echo off
chcp 65001 >nul 2>&1
title Mehregan ERP - راه‌اندازی سامانه یکپارچه مهرگان
color 0B

cd /d "%~dp0"

echo ==============================================================================
echo    Mehregans ERP Business Suite - Windows Launcher
echo    سامانه یکپارچه مدیریت کسب و کار و حسابداری مهرگان
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

echo [ERROR] Node.js is not installed on this system!
echo [خطا] نرم‌افزار Node.js روی سیستم شما یافت نشد.
echo Please install Node.js LTS from official site: https://nodejs.org
explorer "https://nodejs.org"
pause
exit /b 1

:NODE_FOUND
echo [1/4] موتور اجرایی Node.js تایید شد:
call node -v
echo.

rem 2. Check dependencies
if exist "%~dp0node_modules\" goto DEPS_FOUND

echo [2/4] در حال نصب بسته‌های پیش‌نیاز... لطفاً شکیبا باشید.
call npm install
if %errorlevel% neq 0 goto DEPS_ERROR
goto DEPS_FOUND

:DEPS_ERROR
echo [خطا] نصب بسته‌های پروژه با خطا مواجه گردید.
pause
exit /b 1

:DEPS_FOUND
echo [2/4] بسته‌های پیش‌نیاز آماده هستند.
echo.

rem 3. Interactive Launch Mode Selection (Browser vs Standalone Window App)
echo ==============================================================================
echo  انتخاب نحوه نمایش و اجرای سامانه مهرگان:
echo  ----------------------------------------------------------------------------
echo  [1] اجرای در مرورگر وب (Browser Mode)
echo  [2] اجرای در پنجره مستقل اپلیکیشن ویندوز (Standalone App Window Mode)
echo  [3] انصراف و خروج
echo ==============================================================================
echo.

set "RUN_MODE=1"
set /p RUN_MODE="یک گزینه را انتخاب کنید [1 یا 2 - پیش‌فرض: 1]: "

if "%RUN_MODE%"=="2" goto MODE_APP_WINDOW
if "%RUN_MODE%"=="3" exit /b 0
goto MODE_BROWSER

:MODE_APP_WINDOW
echo.
echo [3/4] در حال راه‌اندازی در حالت «پنجره مستقل ویندوزی»...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; if (Get-Command msedge -ErrorAction SilentlyContinue) { Start-Process msedge '--app=http://localhost:3000' } else if (Get-Command chrome -ErrorAction SilentlyContinue) { Start-Process chrome '--app=http://localhost:3000' } else { Start-Process 'http://localhost:3000' }" >nul 2>&1 &
goto DISPLAY_INFO

:MODE_BROWSER
echo.
echo [3/4] در حال راه‌اندازی در حالت «مرورگر وب»...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'" >nul 2>&1 &
goto DISPLAY_INFO

:DISPLAY_INFO
echo.
echo ==============================================================================
echo  آدرس سامانه:          http://localhost:3000
echo  نام کاربری مدیر:      admin        ^| رمز عبور: admin
echo  نام کاربری نصاب:      installer_ali ^| رمز عبور: ali@123
echo  برای توقف سرور، این پنجره را ببندید یا Ctrl+C را بفشارید.
echo ==============================================================================
echo.

rem 4. Run server
echo [4/4] در حال راه‌اندازی سرور مرکزی روی پورت 3000...
call npm run dev
if %errorlevel% neq 0 goto SERVER_RETRY
goto SERVER_END

:SERVER_RETRY
echo.
echo [تلاش مجدد] اجرای سرور با npm start...
call npm start
if %errorlevel% neq 0 goto SERVER_FAIL
goto SERVER_END

:SERVER_FAIL
echo.
echo [خطا] اجرای سرور متوقف شد یا با خطا مواجه گردید.
pause
exit /b 1

:SERVER_END
echo.
echo سرور مهرگان خاتمه یافت.
pause
