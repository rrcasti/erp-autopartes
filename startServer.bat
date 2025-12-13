@echo off
echo === INICIANDO PHP 8.3 ===
set PATH=C:\Users\u593244\Laragon-portable\bin\php\php-8.3.16-Win32-vs16-x64;%PATH%

echo === INICIANDO MARIADB ===
start "" "C:\Portable\mariadb\bin\mysqld.exe"

timeout /t 3 >nul

echo === LEVANTANDO SERVIDOR LARAVEL ===
php artisan serve

pause
