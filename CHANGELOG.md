# CodiaTax - Changelog

## [1.3.0] - 2026-02-28
### Added
- **Capa de Servicios de Dominio**: Nueva arquitectura que separa la lógica de negocio de React (`src/services/`).
  - `FinanceService`: Balances y topes de abonado.
  - `FareService`: Cálculos Haversine y tarifas 2026.
  - `SyncService`: Cola de sincronización resiliente.
  - `ShiftService`: Gestión de colas de aeropuerto.
  - `PersistenceService`: Backup y reset nuclear.
- **Suite de Tests**: Implementación de 27 tests unitarios con **Vitest** (Servicios + Hooks).
- **Componentes UI Pro**: `MetricCard` y `TabSelector` para una interfaz más consistente.

### Changed
- Refactorización masiva de `StatsDashboard.tsx` y `ServiceForm.tsx`.
- Eliminación de estilos inline en favor de `Services.css` y `Dashboard.css`.
- Mejora en la precisión del cálculo de abonados y visualización de impuestos.


## [1.2.3] - 2026-02-12
### Added
- Nuevo sistema de pestañas diferenciadas para **Taxi** (Azul) y **Abonados** (Violeta).
- Desglose financiero detallado en el Dashboard (Taxi vs Autónomos vs Total).
- Pestañas de filtrado por tipo de servicio en el registro diario e historial completo.
- Componente `PageTransition` para animaciones suaves entre pantallas.
- Configuración de firma de lanzamiento (`release signing`) para APKs de Android.

### Changed
- **Rendimiento**: Implementación de **Lazy Loading** en todas las rutas para reducir el tiempo de carga inicial.
- **Rendimiento**: Implementación de **Paginación** en el historial (`ServiceList`) para mejorar la fluidez con grandes volúmenes de datos.
- **Visual**: Refinado sistema de sombras y bordes ("Glassmorphism 2.0") en `index.css`.
- Actualizada la versión del proyecto a 1.2.3.

## Version 1.2.2 (2026-02-10)

### 🗺️ Continuous Flow GPS Pro
- **New UI Architecture**: Implemented a "Continuous Flow" model where inputs remain visible at the top and results appear dynamically below.
- **Auto-Calculation**: Automatic route and price calculation when a destination suggestion is selected.
- **Improved Autocomplete**: Switched to a pure OpenStreetMap (Nominatim) provider with local prioritization (Cádiz Area).
- **Navigation Shortcuts**: Added a button to launch native GPS navigation (Google/Apple Maps) with the full route.

### 🌤️ Smart Destination Info
- **Weather Integration**: Destination temperature and condition display using Open-Meteo.
- **Real-time Traffic (DGT)**: Detailed list of traffic alerts and incidents from official DGT data.
- **Address Formatting**: Cleaned up destination names by removing redundant postal codes and country data.

### 🐛 Bug Fixes
- **Geocoding Reliability**: Fixed "Dirección no encontrada" errors by storing and using exact coordinates from suggestions.
- **Traffic Alerts**: Restored the detailed list of incidents in the UI (previously only showing count).

---

## Version 1.2.0 (2026-02-07)

### 🎉 New Features

#### Backup & Restore System
- **Backup Export**: Export all application data (services, expenses, vehicle, mileage, config, shifts) to JSON file
- **Backup Restore**: Upload and restore data from backup JSON files
  - Validates backup file structure
  - Restores to React state, localStorage, and Supabase
  - Shows success/error notifications
- **UI Integration**: New "Gestión de Datos" card in settings with three actions:
  - 📥 Download Backup (yellow button)
  - 📤 Restore Backup (green button)
  - 🗑️ Reset App Data (red button with confirmation)

### 🐛 Bug Fixes

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

### 📱 Mobile Improvements

#### Android APK
- **GPS Permissions**: Added location permissions to AndroidManifest.xml
  - `ACCESS_FINE_LOCATION` for precise GPS
  - `ACCESS_COARSE_LOCATION` for approximate location
  - Enables fare calculator GPS functionality
- **Build Script**: Automated APK generation with `build-apk.bat`

### 🔧 Technical Changes

#### AppContext Updates
- Added `restoreAppData` function with full Supabase sync
- Enhanced `resetAppData` with Supabase deletion
- Improved error handling and user feedback

#### Component Updates
- **DataSettings.tsx**: Complete redesign with backup/restore/reset features
- **AirportShifts.tsx**: Improved undo button positioning
- **AndroidManifest.xml**: Added location permissions

### 📚 Documentation
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

