# Guía de Compilación para iOS (Apple)

Para compilar y distribuir la aplicación CodiaTax en dispositivos iOS, es necesario seguir estos pasos desde un ordenador **Mac**.

## Requisitos Previos

- **Computadora Mac** (MacBook, Mac mini, iMac, etc.).
- **Xcode** instalado (desde la Mac App Store).
- **Node.js y npm** instalados en el Mac.
- Haber clonado el repositorio o copiado el código al Mac.

## Pasos para Abrir el Proyecto en Xcode

1. Abre una terminal en la carpeta raíz del proyecto.
2. Instala las dependencias (solo si es la primera vez en ese Mac):
   ```bash
   npm install
   ```
3. Ejecuta el comando de construcción y apertura:
   ```bash
   npm run build:ios
   ```
   *Este comando compilará la versión web (Vite), sincronizará los cambios con la carpeta iOS de Capacitor y abrirá automáticamente el proyecto en Xcode.*

## Compilación en Xcode

Una vez que Xcode esté abierto con el proyecto:

1. Conecta tu iPhone o selecciona un simulador en la barra superior.
2. Asegúrate de configurar el "Team" en la pestaña **Signing & Capabilities** del target principal (`App`).
3. Presiona el botón **Play** (triángulo) en la parte superior izquierda.

## Notas para el Desarrollador

- **Actualizaciones**: Cada vez que hagas cambios en el código de React, debes ejecutar `npm run build:ios` (o simplemente `npx cap sync ios`) para que se reflejen en la app nativa.
- **Plugins**: Los plugins de Capacitor ya están configurados para ser detectados automáticamente por Xcode.
