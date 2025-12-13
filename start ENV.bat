@echo off
title Entorno Portable Zingueria

echo ============================================
echo   Inicializando entorno portable Laravel
echo ============================================
echo.

REM --- 1. Agregar PHP portable al PATH (temporal) ---
echo Configurando PHP 8.3 portable...
set PATH=C:\Users\u593244\DEV_LARAVEL\proyectos\zingueria\php83;%PATH%

echo PHP version:
php -v
echo.

REM --- 2. Iniciar MariaDB portable ---
echo Iniciando servidor MariaDB portable...
start "" cmd /C "C:\Portable\mariadb\bin\mysqld.exe --datadir=C:\Portable\mariadb\data --port=3306"
timeout /t 3 >nul

echo Servidor MySQL iniciado en el puerto 3306
echo.

REM --- 3. Ir al proyecto Laravel ---
cd /d C:\Users\u593244\DEV_LARAVEL\proyectos\zingueria

REM --- 4. Limpiar caches ---
echo Limpiando cache de Laravel...
php artisan optimize:clear
echo.

REM --- 5. Iniciar servidor Laravel ---
echo Iniciando Laravel en http://127.0.0.1:8000 ...
start "" cmd /C "php artisan serve"

echo.
echo ============================================
echo       Entorno listo. Puedes trabajar.
echo ============================================
pause
