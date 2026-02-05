@echo off
REM Script para limpiar caches de Android Studio
REM Ejecutar con Android Studio CERRADO

echo ============================================
echo   Limpieza de Caches de Android Studio
echo ============================================
echo.

REM Verificar que Android Studio este cerrado
echo [1/5] Verificando que Android Studio este cerrado...
tasklist /FI "IMAGENAME eq studio64.exe" 2>NUL | find /I /N "studio64.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo.
    echo ADVERTENCIA: Android Studio esta abierto!
    echo Por favor, cierralo completamente y ejecuta este script de nuevo.
    echo.
    pause
    exit /b 1
)
echo OK - Android Studio esta cerrado

REM Limpiar cache de AppData Local
echo.
echo [2/5] Limpiando cache de AppData\Local...
set LOCAL_DIR=%LOCALAPPDATA%\Google\AndroidStudio

if exist "%LOCAL_DIR%\caches" (
    echo Eliminando: %LOCAL_DIR%\caches
    rmdir /s /q "%LOCAL_DIR%\caches" 2>NUL
    echo OK
) else (
    echo No encontrado (OK)
)

if exist "%LOCAL_DIR%\tmp" (
    echo Eliminando: %LOCAL_DIR%\tmp
    rmdir /s /q "%LOCAL_DIR%\tmp" 2>NUL
    echo OK
) else (
    echo No encontrado (OK)
)

if exist "%LOCAL_DIR%\compile-server" (
    echo Eliminando: %LOCAL_DIR%\compile-server
    rmdir /s /q "%LOCAL_DIR%\compile-server" 2>NUL
    echo OK
) else (
    echo No encontrado (OK)
)

REM Limpiar plugins corruptos de AppData Roaming
echo.
echo [3/5] Limpiando plugins de AppData\Roaming...
set ROAMING_DIR=%APPDATA%\Google\AndroidStudio

if exist "%ROAMING_DIR%\plugins" (
    echo Eliminando: %ROAMING_DIR%\plugins
    rmdir /s /q "%ROAMING_DIR%\plugins" 2>NUL
    echo OK
) else (
    echo No encontrado (OK)
)

REM Limpiar cache de .android
echo.
echo [4/5] Limpiando cache de .android...
set ANDROID_DIR=%USERPROFILE%\.android

if exist "%ANDROID_DIR%\cache" (
    echo Eliminando: %ANDROID_DIR%\cache
    rmdir /s /q "%ANDROID_DIR%\cache" 2>NUL
    echo OK
) else (
    echo No encontrado (OK)
)

REM Opcional: Limpiar build cache del proyecto
echo.
echo [5/5] Limpiando build cache del proyecto...
set PROJECT_DIR=%~dp0android

if exist "%PROJECT_DIR%\.gradle" (
    echo Eliminando: %PROJECT_DIR%\.gradle
    rmdir /s /q "%PROJECT_DIR%\.gradle" 2>NUL
    echo OK
)

if exist "%PROJECT_DIR%\app\build" (
    echo Eliminando: %PROJECT_DIR%\app\build
    rmdir /s /q "%PROJECT_DIR%\app\build" 2>NUL
    echo OK
)

echo.
echo ============================================
echo   Limpieza completada con exito!
echo ============================================
echo.
echo PROXIMOS PASOS:
echo 1. Abre Android Studio
echo 2. Si pregunta por importar configuracion: "Do not import"
echo 3. Ve a Configure -^> Plugins
echo 4. Verifica que esten activados:
echo    - Android Design Tools
echo    - Gradle
echo    - Kotlin
echo    - Git
echo 5. Abre el proyecto: %PROJECT_DIR%
echo.
pause
