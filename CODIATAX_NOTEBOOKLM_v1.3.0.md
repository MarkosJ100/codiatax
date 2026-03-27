# CodiaTax - Documentación Completa v1.3.0

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.3.0  
**Fecha de Release:** 23 de Marzo de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95, Vitest 4.0  
**Repositorio:** https://github.com/MarkosJ100/codiatax

## Descripción

CodiaTax es una aplicación completa de gestión para taxistas que incluye:
- Calculadora de tarifas con GPS inteligente y flujo continuo.
- Rediseño Premium con Modo Claro (Confort) y Oscuro Refinado.
- Gestión de servicios y gastos con topes de abonado automáticos.
- Control de kilometraje y mantenimiento preventivo.
- Gestión de turnos de aeropuerto con detección de colisiones.
- Sincronización en la nube con Supabase y persistencia local offline.
- Sistema de backup y restauración de datos mediante `PersistenceService`.
- Autenticación biométrica y PIN de seguridad.

## Novedades en v1.3.0 (Optimización y Robustez)

### 📱 Optimización para Android WebView ("Safe Render")
Se ha implementado un sistema de renderizado ultraligero exclusivo para el modo nativo (APK) para resolver fallos de GPU y pixelado:
- **Fondo Sólido**: Eliminación de gradientes radiales complejos en el `body`.
- **Sin Sombras ni Filtros**: Desactivación global de `box-shadow` y `backdrop-filter: blur` para evitar artefactos visuales.
- **Estabilización de Capas**: Uso de `transform: translateZ(0)` y `backface-visibility: hidden` para estabilizar el compositor de la WebView.
- **UI Estática**: Desactivación de transiciones de acordeón y animaciones de entrada en dispositivos nativos para mejorar la fluidez.

### 🛠️ Robustez en el Módulo de Mantenimiento (Taller)
- **Carga de Datos Segura**: Implementación de `loadMaintenanceRecords` con validación estricta de tipos de datos.
- **Normalización Automática**: Los registros corruptos o incompletos en `localStorage` son detectados, corregidos o filtrados automáticamente al iniciar el componente.
- **Wrapper de Almacenamiento**: Migración total al sistema `storage.ts` para garantizar coherencia en la persistencia local y manejo de errores de cuota.

### 🚀 Integración Nativa Mejorada
- **Detección de Plataforma**: Integración de `Capacitor.isNativePlatform()` en el flujo de renderizado de React.
- **Atributos Dinámicos**: Inyección de `data-platform="native"` en el elemento raíz para aplicar estilos CSS condicionales sin sobrecarga de JS.

## Arquitectura Técnica

### Frontend & Logic
- **Framework:** React 19 + TypeScript.
- **Domain Services:** Capa de servicios en `src/services/`.
- **Hooks de Dominio:** `useFinanceData`, `useShiftLogic`, `useAuth`, `useUI`.
- **CSS Architecture:** Sistema de tokens variables con soporte para "Safe Render" condicional.

### Backend y Datos
- **Cloud:** Supabase (Auth & Database).
- **LocalStorage:** Repositorios con fallback local para funcionamiento offline.
- **Sync:** Cola de sincronización basada en eventos.

---

## Build y Deployment

### build-apk.bat / npm run build
1. Compila el proyecto React (Vite).
2. Sincroniza con Capacitor (`npx cap sync android`).
3. Compila el código nativo Android con Gradle.
4. Genera el APK optimizado en `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Changelog Detallado

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.
