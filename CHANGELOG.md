## [1.0.0] - 2026-03-27
### Added
- Lanzamiento de **Codiatx Version Web 1.0** como baseline web-first.
- Plan de ejecucion y control por fases en `CODIATX_WEB_1.0_PLAN.md`.
- Compatibilidad retroactiva de almacenamiento:
  - Migracion de claves `codiatax_*` a `codiatx_*` sin perdida de datos.
  - Migracion silenciosa al leer/escribir en localStorage.

### Changed
- Enrutado unificado para web (`createBrowserRouter`) y arranque marcado como plataforma web.
- Sustitucion de puntos de acoplamiento nativo por alternativas web:
  - Preferencias/PIN con wrapper web (`src/utils/webPreferences.ts`).
  - Exportacion y comparticion PDF en flujo web (descarga/`mailto`).
  - Enlaces externos con `window.open`.
- Limpieza de scripts y dependencias moviles en `package.json` para foco web.

### Fixed
- Correccion de errores bloqueantes de lint en `src` para estabilizar QA.
- Ajustes de configuracion de ESLint para excluir rutas auxiliares no productivas del chequeo principal.

### QA
- `npm run build`: OK.
- `npm run lint`: OK sin errores (warnings no bloqueantes).
- `npm run test -- --run`: bloqueado por entorno (`spawn EPERM` en Vitest/esbuild).
## [1.3.0] - 2026-03-12
### Added
- **Overhaul de Responsividad UI (MÃ³vil)**: RediseÃ±o completo para dispositivos de cualquier tamaÃ±o.
  - Grid adaptativo en Dashboard (`auto-fit`).
  - Apilamiento vertical de campos de fecha/hora en Facturas y Mantenimiento.
  - Layouts flexibles (`flex-wrap`) en listas para evitar desbordamientos de iconos.
- **OptimizaciÃ³n para Android WebView ("Safe Render")**: 
  - DesactivaciÃ³n de gradientes, sombras y filtros CSS en modo nativo para resolver pixelado de GPU.
  - EstabilizaciÃ³n del compositor mediante `transform: translateZ(0)`.
- **Robustez de Datos (Taller)**: 
  - ValidaciÃ³n y normalizaciÃ³n automÃ¡tica de registros de mantenimiento desde `localStorage`.
  - MigraciÃ³n al wrapper `storage.ts` para persistencia segura.
- **Capa de Servicios de Dominio**: Nueva arquitectura que separa la lÃ³gica de negocio de React (`src/services/`). (Heredado de beta 1.2.6)
  - `FinanceService`, `FareService`, `SyncService`, `ShiftService`, `PersistenceService`.
- **Suite de Tests**: ImplementaciÃ³n de 27 tests unitarios con **Vitest**.
- **GuÃ­a de Usuario**: Nueva guÃ­a visual integrada en formato HTML/PDF.

### Changed
- NormalizaciÃ³n de destinos: "AEROPUERTO DE JEREZ".
- RefactorizaciÃ³n de `StatsDashboard.tsx` y `ServiceForm.tsx` con componentes modulares.
- Solucionados advertencias de hidrataciÃ³n en React Router.


## [1.2.3] - 2026-02-12
### Added
- Nuevo sistema de pestaÃ±as diferenciadas para **Taxi** (Azul) y **Abonados** (Violeta).
- Desglose financiero detallado en el Dashboard (Taxi vs AutÃ³nomos vs Total).
- PestaÃ±as de filtrado por tipo de servicio en el registro diario e historial completo.
- Componente `PageTransition` para animaciones suaves entre pantallas.
- ConfiguraciÃ³n de firma de lanzamiento (`release signing`) para APKs de Android.

### Changed
- **Rendimiento**: ImplementaciÃ³n de **Lazy Loading** en todas las rutas para reducir el tiempo de carga inicial.
- **Rendimiento**: ImplementaciÃ³n de **PaginaciÃ³n** en el historial (`ServiceList`) para mejorar la fluidez con grandes volÃºmenes de datos.
- **Visual**: Refinado sistema de sombras y bordes ("Glassmorphism 2.0") en `index.css`.
- Actualizada la versiÃ³n del proyecto a 1.2.3.

## Version 1.2.2 (2026-02-10)

### ðŸ—ºï¸ Continuous Flow GPS Pro
- **New UI Architecture**: Implemented a "Continuous Flow" model where inputs remain visible at the top and results appear dynamically below.
- **Auto-Calculation**: Automatic route and price calculation when a destination suggestion is selected.
- **Improved Autocomplete**: Switched to a pure OpenStreetMap (Nominatim) provider with local prioritization (CÃ¡diz Area).
- **Navigation Shortcuts**: Added a button to launch native GPS navigation (Google/Apple Maps) with the full route.

### ðŸŒ¤ï¸ Smart Destination Info
- **Weather Integration**: Destination temperature and condition display using Open-Meteo.
- **Real-time Traffic (DGT)**: Detailed list of traffic alerts and incidents from official DGT data.
- **Address Formatting**: Cleaned up destination names by removing redundant postal codes and country data.

### ðŸ› Bug Fixes
- **Geocoding Reliability**: Fixed "DirecciÃ³n no encontrada" errors by storing and using exact coordinates from suggestions.
- **Traffic Alerts**: Restored the detailed list of incidents in the UI (previously only showing count).

---

## Version 1.2.0 (2026-02-07)

### ðŸŽ‰ New Features

#### Backup & Restore System
- **Backup Export**: Export all application data (services, expenses, vehicle, mileage, config, shifts) to JSON file
- **Backup Restore**: Upload and restore data from backup JSON files
  - Validates backup file structure
  - Restores to React state, localStorage, and Supabase
  - Shows success/error notifications
- **UI Integration**: New "GestiÃ³n de Datos" card in settings with three actions:
  - ðŸ“¥ Download Backup (yellow button)
  - ðŸ“¤ Restore Backup (green button)
  - ðŸ—‘ï¸ Reset App Data (red button with confirmation)

### ðŸ› Bug Fixes

#### Data Reset Improvements
- **Nuclear Reset**: Complete data wipe now includes:
  - Supabase database deletion (services, expenses, vehicles, shifts)
  - localStorage clearing
  - sessionStorage clearing
  - Capacitor Preferences clearing
  - Force reload to login page
- **Fixed Data Persistence**: Resolved issue where data would reappear after reset due to Supabase sync

#### UI/UX Fixes
- **Airport Shifts Undo Button**: Changed from fixed floating button to normal inline button
  - No longer blocks navigation menus
  - Better mobile experience
  - Appears below shift action panel

### ðŸ“± Mobile Improvements

#### Android APK
- **GPS Permissions**: Added location permissions to AndroidManifest.xml
  - `ACCESS_FINE_LOCATION` for precise GPS
  - `ACCESS_COARSE_LOCATION` for approximate location
  - Enables fare calculator GPS functionality
- **Build Script**: Automated APK generation with `build-apk.bat`

### ðŸ”§ Technical Changes

#### AppContext Updates
- Added `restoreAppData` function with full Supabase sync
- Enhanced `resetAppData` with Supabase deletion
- Improved error handling and user feedback

#### Component Updates
- **DataSettings.tsx**: Complete redesign with backup/restore/reset features
- **AirportShifts.tsx**: Improved undo button positioning
- **AndroidManifest.xml**: Added location permissions

### ðŸ“š Documentation
- Updated walkthrough.md with restore functionality details
- Updated task.md with v1.2.0 release checklist
- Created comprehensive changelog

---

## Version 1.1.0 (Previous)

### Features
- Fare calculator with GPS routing
- Airport shift management
- Service and expense tracking
- Supabase cloud synchronization
- Biometric authentication
- Dark mode UI


