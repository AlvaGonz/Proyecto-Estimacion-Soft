@echo off
title EstimaPro - Lauch Field Test
cls
echo =======================================================
echo   ESTIMAPRO - SOFTWARE ESTIMATION PLATFORM
echo   UCE - Escuela de Ingenieria de Software
echo =======================================================
echo.
echo [*] Iniciando despliegue de Docker...
echo [*] Comando: docker-compose up --build --force-recreate -d
echo.

docker-compose up --build --force-recreate -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] ERROR: No se pudieron levantar los contenedores.
    echo [!] Asegurate de que Docker Desktop este abierto.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo   ¡DESPLIEGUE EXITOSO!
echo =======================================================
echo.
echo  - Frontend: http://localhost:3000
echo  - Backend UI: http://localhost:4000/api
echo.
echo  [*] Presiona cualquier tecla para cerrar esta ventana.
echo =======================================================
pause > nul
