@echo off
REM Script para compilar CodiaTax APK
REM Autor: Antigravity Assistant
REM Fecha: 2025-12-21

echo ============================================
echo   CodiaTax - APK Builder
echo ============================================
echo.

REM Paso 1: Buscar Java en ubicaciones comunes
echo [1/4] Buscando instalacion de Java...

set JAVA_PATHS[0]="C:\Program Files\Android\Android Studio\jbr"
set JAVA_PATHS[1]="C:\Program Files\Java\jdk-17"
set JAVA_PATHS[2]="C:\Program Files\Java\jdk-11"
set JAVA_PATHS[3]="C:\Program Files\Eclipse Adoptium\jdk-17"

set JAVA_FOUND=0

for %%P in (%JAVA_PATHS[0]% %JAVA_PATHS[1]% %JAVA_PATHS[2]% %JAVA_PATHS[3]%) do (
    if exist %%P\bin\java.exe (
        set "JAVA_HOME=%%~P"
        set JAVA_FOUND=1
        echo Java encontrado en: %%~P
        goto :java_found
    )
)

:java_found
if %JAVA_FOUND%==0 (
    echo.
    echo ERROR: No se encontro Java en tu sistema
    echo.
    echo SOLUCION RAPIDA:
    echo 1. Descarga Java JDK 17 desde:
    echo    https://adoptium.net/temurin/releases/
    echo 2. Instala con opciones por defecto
    echo 3. Ejecuta este script de nuevo
    echo.
    pause
    exit /b 1
)

REM Paso 2: Verificar que gradlew existe
echo.
echo [2/4] Verificando Gradle Wrapper...
cd /d "%~dp0android"
if not exist "gradlew.bat" (
    echo ERROR: No se encuentra gradlew.bat
    echo Ejecuta primero: npx cap sync android
    pause
    exit /b 1
)

REM Paso 3: Compilar APK
echo.
echo [3/4] Compilando APK (esto puede tardar 2-5 minutos)...
echo Por favor espera...
echo.

call gradlew.bat assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: La compilacion fallo
    echo Revisa los mensajes de error arriba
    pause
    exit /b 1
)

REM Paso 4: Localizar APK generado
echo.
echo [4/4] Buscando APK generado...

set APK_PATH=app\build\outputs\apk\debug\app-debug.apk

if exist "%APK_PATH%" (
    echo.
    echo ============================================
    echo   EXITO! APK generado correctamente
    echo ============================================
    echo.
    echo Ubicacion: %CD%\%APK_PATH%
    echo.
    echo Para instalar en tu movil:
    echo 1. Copia el archivo a tu telefono
    echo 2. Abre el archivo desde el explorador
    echo 3. Acepta la instalacion
    echo.
    
    REM Intentar abrir el explorador en esa ubicación
    explorer /select,"%APK_PATH%"
) else (
    echo ERROR: No se encontro el APK en la ubicacion esperada
    echo Busca manualmente en: app\build\outputs\apk\debug\
)

echo.
pause
