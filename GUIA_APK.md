# 📱 Guía para Crear la APP (APK) de Codiatax

Como tu asistente de IA, he preparado todo el código del proyecto. Ahora, para convertir ese código en una aplicación instalable en tu móvil (archivo .apk), necesitas seguir estos pasos en tu ordenador.

## Paso 1: Instalar Android Studio 🛠️
Si ya lo tienes, salta al Paso 2.

1.  Descarga **Android Studio** desde: [developer.android.com/studio](https://developer.android.com/studio)
2.  Instálalo aceptando todas las opciones por defecto.
3.  Ábrelo una vez para que termine de descargar los componentes necesarios (SDK).

## Paso 2: Preparar el Proyecto 📂
1.  Abre una terminal (PowerShell o CMD) en la carpeta de tu proyecto:
    `C:\Users\papa\.gemini\antigravity\scratch\codiatax`
2.  Ejecuta este comando mágico que he creado para ti:
    ```bash
    npm run build:android
    ```
    *¿Qué hace esto?*
    *   Construye la página web.
    *   Sincroniza los archivos con el proyecto Android.
    *   **Abre Android Studio** automáticamente con tu proyecto cargado.

## Paso 3: Generar el Archivo APK 📦
Una vez se abra Android Studio:

1.  Espera a que termine la barra de carga inferior (puede tardar unos minutos la primera vez).
2.  En el menú superior, ve a: **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
3.  Cuando termine, aparecerá un aviso abajo a la derecha ("APK(s) generated successfully").
4.  Haz clic en el enlace azul **"locate"** de ese aviso.
5.  Se abrirá una carpeta con un archivo llamado `app-debug.apk`.

## Paso 4: ¡Al Móvil! 📲
1.  Copia ese archivo `app-debug.apk` a tu móvil (por USB, WhatsApp, Drive...).
2.  Ábrelo en el móvil e instálalo.
3.  ¡Disfruta de CODIATAX!

---
*Nota: Si tienes dudas en algún paso, dímelo y lo resolvemos.*
