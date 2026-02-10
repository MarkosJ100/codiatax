# CodiaTax - Documentación Completa v1.2.2

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.2  
**Fecha de Release:** 10 de Febrero de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95  
**Repositorio:** https://github.com/MarkosJ100/codiatax

## Descripción

CodiaTax es una aplicación completa de gestión para taxistas que incluye:
- Calculadora de tarifas con GPS inteligente y flujo continuo
- Rediseño Premium con Modo Claro (Confort) y Oscuro Refinado
- Gestión de servicios y gastos
- Control de kilometraje y mantenimiento
- Gestión de turnos de aeropuerto compartidos
- Sincronización en la nube con Supabase
- Sistema de backup y restauración de datos
- Autenticación con email/contraseña + PIN de seguridad
- Persistencia de sesión nativa con Capacitor Preferences

## Novedades en v1.2.2

### 🔐 Autenticación Completa

#### Login con Email y Contraseña
- **Supabase Auth:** Integración completa con login, registro y recuperación de contraseña.
- **Pantalla AuthScreen:** Interfaz premium con animaciones, modos login/registro/forgot, validación de campos.
- **Confirmación por Email:** Registro requiere verificación de email antes de acceder.
- **Persistencia de Sesión:** Sesión guardada con `@capacitor/preferences` para que el login se mantenga entre reinicios.

#### PIN de Seguridad
- **PinGuard:** Componente que bloquea la app al volver de segundo plano si el PIN está activado.
- **PinEntry:** Interfaz de teclado numérico premium para introducir el PIN.
- **PinSetup:** Configuración desde ajustes de seguridad, con hash salteado almacenado en Preferences.

#### Perfil de Usuario
- **ProfileSetup:** Pantalla de configuración inicial tras primer login (nombre, licencia, rol, modo de trabajo).
- **Normalización de Roles:** `owner` → `propietario`, `employee` → `asalariado` automáticamente.

### ☁️ Sincronización de Datos (Cloud as Truth)

#### Estrategia
- **Cloud como Fuente de Verdad:** Los datos en Supabase tienen prioridad. Borrados y cambios hechos en la web se reflejan automáticamente en la app.
- **Mapeo camelCase ↔ snake_case:** `companyName` en la app se convierte a `company_name` para Supabase y viceversa.

#### Sincronización Inteligente
- **Guardia Anti-Loop (`isSyncingFromCloud`):** Cuando la app descarga datos de la nube, desactiva temporalmente la subida automática para evitar re-subir los mismos datos.
- **Fetch Único por Sesión (`hasFetchedCloud`):** Solo se hace una descarga de datos al iniciar sesión, no cada vez que se re-renderiza.
- **Debounce de 2 segundos:** Los cambios locales se agrupan antes de sincronizar con la nube.

### ⚡ Optimización de Rendimiento Post-Login

#### Problema Resuelto
Antes de la optimización, al hacer login se ejecutaban ~12 llamadas a Supabase:
1. `appDataLoader` → 4 consultas (servicios, gastos, vehículo, turnos)
2. `fetchCloudData` → 4 consultas idénticas (duplicadas)
3. `useLocalStorage` → 4 subidas de vuelta (re-upload innecesario)

#### Resultado
Ahora solo se ejecutan **4 llamadas** gracias a:
- Guardia `isSyncingFromCloud` que bloquea la re-subida
- Ref `hasFetchedCloud` que evita descargas duplicadas
- Debounce aumentado de 1s a 2s

### 🛡️ Fix: Pantalla en Blanco tras Login

#### Causa Raíz
Condición de carrera: `onAuthStateChange` actualizaba el estado React (`setUser`) pero el `useEffect` que guardaba en `localStorage` aún no había ejecutado. El route loader leía `localStorage` → encontraba vacío → redirigía a `/auth` → bucle infinito.

#### Solución
1. **`AppContext.tsx`:** `localStorage.setItem()` se ejecuta ANTES de `setUser()` en el listener de autenticación.
2. **`App.tsx`:** El route loader consulta `supabase.auth.getSession()` como fallback si `localStorage` está vacío.

## Arquitectura Técnica

### Frontend
- **Framework:** React 19 con TypeScript
- **Routing:** React Router v7 (Data Router con loaders)
- **State Management:** Context API + useLocalStorage hook con debounce
- **UI:** CSS Variables, Framer Motion, Lucide React icons
- **Seguridad:** PinGuard + PinEntry + hash SHA-256 con salt

### Backend y Datos
- **Base de Datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password)
- **Tablas:** `servicios`, `gastos`, `vehiculos`, `turnos_storage`
- **Backup:** Exportación JSON manual + Restauración robusta
- **Sincronización:** Cloud sync bidireccional con guardia anti-loop

### Estructura de Archivos Clave
```
src/
├── App.tsx                    # Router con loaders y guards
├── context/AppContext.tsx     # Estado global, sync, auth listener
├── loaders/appLoader.ts       # Data loader para Supabase
├── pages/
│   ├── AuthScreen.tsx         # Login/Register/Forgot
│   ├── ProfileSetup.tsx       # Configuración inicial
│   ├── Home.tsx               # Dashboard principal
│   └── ...
├── components/
│   ├── Auth/PinGuard.tsx      # Guardia de PIN
│   ├── Auth/PinEntry.tsx      # Entrada de PIN
│   └── ...
├── services/
│   └── weatherService.ts     # Clima Open-Meteo
└── utils/
    ├── supabaseStorage.ts    # Adapter Capacitor Preferences
    └── userHelpers.ts        # Normalización de usuarios
```

## Build y Deployment

### build-apk.bat
Script automatizado que genera el APK de depuración:
1. Compila el proyecto React (Vite)
2. Sincroniza con Capacitor
3. Compila el código nativo Android
4. Facilita la ruta del APK generado

### Ubicación APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Changelog Detallado

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo de versiones.
