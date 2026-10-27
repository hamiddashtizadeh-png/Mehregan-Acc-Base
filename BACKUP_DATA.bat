@echo off
chcp 65001 >nul 2>&1
title Mehregan ERP - پشتیبان‌گیری از داده‌ها
cd /d "%~dp0"

echo ==============================================================================
echo    ابزار پشتیبان‌گیری از داده‌های سامانه مهرگان (Data Backup Tool)
echo ==============================================================================
echo.

if not exist "%~dp0.mehregan-data\" (
    echo [اطلاع] هنوز هیچ پایگاه داده یا فایلی در پوشه .mehregan-data ایجاد نشده است.
    pause
    exit /b 0
)

set "BACKUP_DIR=%~dp0mehregan-data-backups"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "dt=%%I"
set "TIMESTAMP=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%"
set "TARGET_FOLDER=%BACKUP_DIR%\backup_%TIMESTAMP%"

echo در حال کپی از پوشه .mehregan-data به مسیر پشتیبان:
echo %TARGET_FOLDER%
echo.

xcopy "%~dp0.mehregan-data" "%TARGET_FOLDER%\" /E /I /H /Y >nul

if %errorlevel% equ 0 (
    echo [موفقیت] پشتیبان‌گیری با موفقیت انجام شد!
    echo فایل‌های پشتیبان در پوشه زیر ذخیره شدند:
    echo %TARGET_FOLDER%
) else (
    echo [خطا] در فرآیند پشتیبان‌گیری خطایی رخ داد.
)

echo.
pause
