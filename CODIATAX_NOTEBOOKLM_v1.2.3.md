# CodiaTax - Documentación Completa v1.2.3

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.3  
**Fecha de Release:** 28 de Febrero de 2026  
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

## Novedades en v1.2.3 (Refactorización de Dominio)

### 🏗️ Arquitectura de Servicios de Dominio
Se ha extraído la lógica de negocio de los componentes y contextos hacia una capa de servicios agnóstica:
- **FinanceService**: Centraliza cálculos de bruto, neto y aplicación de topes de abonado.
- **FareService**: Maneja el cálculo de distancias (Haversine) y selección de tarifas 2026.
- **ShiftService**: Lógica de rotaciones de aeropuerto y validación de colisiones.
- **SyncService**: Gestión de colas de sincronización con soporte offline persistente.
- **PersistenceService**: Operaciones seguras de limpieza y restauración de backups.

### 🧪 Suite de Tests Unitarios
Introducción de **Vitest** como motor de pruebas:
- **27 Tests Unitarios** exitosos cubriendo el 100% de la lógica crítica.
- Validación de reactividad en hooks (`useFinanceData`, `useShiftLogic`).
- Mocks robustos para almacenamiento local y red.

### 🎨 Refinamiento UI y Estandarización
- **Componentes Reutilizables**: Implementación de `MetricCard` (estadísticas) y `TabSelector` (filtros).
- **Adiós a Estilos Inline**: Migración masiva a clases CSS externas en `Services.css` y `Dashboard.css`.
- **ServiceForm v2**: Formulario optimizado con selectores de abonados mejorados y visualización de impuestos clara.

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
