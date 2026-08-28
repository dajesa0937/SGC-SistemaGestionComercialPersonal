@echo off
chcp 65001 >nul
title SGC Personal
cd /d "%~dp0"
echo.
echo   ============================
echo    SGC Personal
echo   ============================
echo.
if not exist "node_modules\" (
  echo   Primera vez: instalando dependencias.
  echo   Esto tarda un par de minutos y solo pasa una vez.
  echo.
  call npm install || goto :error
)
echo   Preparando la aplicacion...
call npm run build || goto :error
echo.
echo   Listo. Abriendo http://localhost:4173
echo.
echo   Deja esta ventana abierta mientras trabajes.
echo   Para cerrar la aplicacion, cierra esta ventana.
echo.
call npx vite preview --open
goto :fin

:error
echo.
echo   Algo fallo. El mensaje del error esta arriba.
echo.
pause

:fin
