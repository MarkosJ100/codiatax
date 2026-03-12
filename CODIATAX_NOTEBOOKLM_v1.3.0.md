# CodiaTax - Documentación Completa v1.3.0

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.3.0  
**Fecha de Release:** 12 de Marzo de 2026  
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

## Novedades en v1.3.0 (Responsividad y Pulido Móvil)

### 📱 Overhaul de Responsividad UI
Se ha realizado una revisión exhaustiva de todas las pantallas para garantizar una experiencia perfecta en dispositivos móviles de cualquier tamaño:
- **Grid Adaptativo de Estadísticas**: En la pantalla de Inicio, los 4 indicadores financieros ahora usan `auto-fit`, permitiendo que se reordenen según el ancho disponible.
- **Campos de Fecha Inteligentes**: En el Generador de Facturas y Mantenimiento, los campos de fecha ahora se apilan verticalmente si no hay espacio suficiente (min-width 200px), evitando que los selectores nativos de Android desborden el contenedor.
- **Historial de Gastos y Mantenimiento**: Reemplazo de posicionamientos absolutos por Layouts Flexibles (`flex-wrap`) para asegurar que los botones de acción (Editar/Borrar) nunca se salgan del widget ni se solapen con el texto.

### 🏗️ Arquitectura de Servicios de Dominio (Heredado v1.2.3)
- **FinanceService**: Centraliza cálculos de bruto, neto y aplicación de topes de abonado.
- **FareService**: Maneja el cálculo de distancias (Haversine) y selección de tarifas 2026.
- **ShiftService**: Lógica de rotaciones de aeropuerto y validación de colisiones.
- **SyncService**: Gestión de colas de sincronización con soporte offline persistente.
- **PersistenceService**: Operaciones seguras de limpieza y restauración de backups.

### 🧪 Suite de Tests Unitarios
- **27 Tests Unitarios** exitosos cubriendo el 100% de la lógica crítica.
- Validación de reactividad en hooks (`useFinanceData`, `useShiftLogic`).

### 🚀 Módulo Inteligente de Facturas de Combustible (GOP)
- **Extracción de PDF Mejorada**: Integración de `pdfjs-dist` para procesar facturas de "Global Oil Petroleum".
- **Regex Basado en Coordenadas**: Lectura secuencial de fechas, litros e importes totales.
- **Auto-clasificación**: Agrupación automática de tickets en gastos agregados mensuales.

### 🎨 Refinamiento UI y Estandarización
- **Normalización de Destinos**: Limpieza automática y migración del string del Aeropuerto de Jerez ("AEROPUERTO DE JEREZ").
- **Fallbacks React Router v6**: Resolución de advertencias de hidratación mediante `<LoadingFallback />`.

---

## Arquitectura Técnica

### Frontend & Logic
- **Framework:** React 19 + TypeScript.
- **Domain Services:** Capa de servicios en `src/services/`.
- **Hooks de Dominio:** `useFinanceData`, `useShiftLogic`, `useAuth`, `useUI`.
- **Testing:** Vitest + Testing Library.

### Backend y Datos
- **Cloud:** Supabase (Auth & Database).
- **LocalStorage:** Repositorios con fallback local para funcionamiento offline.
- **Sync:** Cola de sincronización basada en eventos.

---

## Build y Deployment

### build-apk.bat
1. Compila el proyecto React (Vite).
2. Sincroniza con Capacitor.
3. Compila el código nativo Android.
4. Genera el APK en `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## Changelog Detallado

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo.
