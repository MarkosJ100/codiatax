# CodiaTax - Documentación Completa v1.2.0

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.0  
**Fecha de Release:** 7 de Febrero de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95  
**Repositorio:** https://github.com/MarkosJ100/codiatax

## Descripción

CodiaTax es una aplicación completa de gestión para taxistas que incluye:
- Calculadora de tarifas con GPS
- Gestión de servicios y gastos
- Control de kilometraje y mantenimiento
- Gestión de turnos de aeropuerto compartidos
- Sincronización en la nube con Supabase
- Sistema de backup y restauración de datos
- Autenticación biométrica

## Novedades en v1.2.0

### 🎉 Sistema de Backup y Restauración

#### Exportar Backup
- **Ubicación:** Configuración de la App → Gestión de Datos
- **Formato:** JSON con todos los datos de la aplicación
- **Contenido exportado:**
  - Servicios registrados
  - Gastos registrados
  - Información del vehículo
  - Registros de kilometraje
  - Configuración anual
  - Almacenamiento de turnos
  - Metadata (fecha de exportación, versión)

#### Restaurar Backup
- **Proceso:**
  1. Clic en botón verde "Subir JSON"
  2. Seleccionar archivo de backup (.json)
  3. Validación automática del archivo
  4. Restauración a estado local y Supabase
  5. Notificación de éxito/error

- **Características:**
  - Validación de estructura del archivo
  - Restauración completa a React state
  - Sincronización con localStorage
  - Sincronización con Supabase (si hay usuario logueado)
  - Manejo de errores robusto

### 🐛 Correcciones Importantes

#### Reset Nuclear de Datos
- **Problema resuelto:** Los datos persistían después del reset
- **Solución implementada:**
  - Eliminación de registros en Supabase ANTES de limpiar local
  - Limpieza de localStorage, sessionStorage y Capacitor Preferences
  - Reset de todos los estados de React
  - Recarga forzada y redirección a /login
  - Confirmación en dos pasos para evitar borrados accidentales

#### Botón de Deshacer en Turnos de Aeropuerto
- **Problema:** Botón flotante tapaba los menús de navegación
- **Solución:** Convertido a botón normal en el flujo del contenido
- **Ubicación:** Debajo del panel de acciones de turnos
- **Estilo:** Botón completo con ancho 100%, color primario

### 📱 Mejoras para Android

#### Permisos de GPS
- **Agregados al AndroidManifest.xml:**
  - `ACCESS_FINE_LOCATION` - GPS preciso
  - `ACCESS_COARSE_LOCATION` - Ubicación aproximada
- **Uso:** Calculadora de precios con rutas GPS
- **Comportamiento:** La app solicita permiso en primer uso

## Arquitectura Técnica

### Frontend
- **Framework:** React 19 con TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7 con data loaders
- **State Management:** Context API
- **UI:** CSS custom properties, Framer Motion
- **Icons:** Lucide React

### Backend y Datos
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth + Biometría local
- **Storage Local:** localStorage, sessionStorage, Capacitor Preferences
- **Sincronización:** Automática con Supabase en cada operación

### Mobile
- **Framework:** Capacitor 8
- **Plataformas:** Android (iOS preparado)
- **Plugins:**
  - @capacitor/browser
  - @capacitor/filesystem
  - @capacitor/local-notifications
  - @capacitor/preferences
  - @capacitor/share

## Estructura de Datos

### Servicios (servicios)
```typescript
interface Service {
  id: number;
  fecha: string;
  origen: string;
  destino: string;
  importe: number;
  tipo: 'efectivo' | 'tarjeta' | 'app';
  pagado: boolean;
  fecha_pagado?: string;
  user_id: string;
}
```

### Gastos (gastos)
```typescript
interface Expense {
  id: number;
  fecha: string;
  concepto: string;
  importe: number;
  categoria: string;
  user_id: string;
}
```

### Vehículo (vehiculos)
```typescript
interface Vehicle {
  user_id: string;
  license_plate: string;
  model: string;
  initial_odometer: number;
  maintenance_data: MaintenanceData;
}
```

### Turnos (turnos_storage)
```typescript
interface ShiftStorage {
  user_id: string;
  data_json: {
    assignments: AirportShift[];
    restDays: string[];
    userConfigs: Record<string, any>;
  };
}
```

## Funcionalidades Principales

### 1. Calculadora de Tarifas
- **Ubicación:** Menú principal → Calculadora
- **Modos:**
  - Destinos fijos (aeropuerto, estaciones, etc.)
  - Ruta GPS personalizada
- **Tarifas:**
  - Urbana: Bajada de bandera + km
  - Interurbana: Tarifa doble por km (sin bajada de bandera)
- **Características:**
  - Integración con API de routing (OpenRouteService)
  - Cálculo automático de distancia
  - Sugerencias de destinos frecuentes

### 2. Gestión de Servicios
- **Registro:** Fecha, origen, destino, importe, tipo de pago
- **Estados:** Pendiente de cobro / Pagado
- **Filtros:** Por fecha, estado de pago, tipo
- **Exportación:** Calendario .ics

### 3. Control de Gastos
- **Categorías:** Combustible, mantenimiento, seguros, impuestos, otros
- **Tracking:** Fecha, concepto, importe
- **Análisis:** Gráficos de gastos por categoría y período

### 4. Gestión de Turnos de Aeropuerto
- **Sistema compartido:** Múltiples usuarios pueden gestionar turnos
- **Ciclos automáticos:** Generación de turnos cada 11 días
- **Tipos de turno:** Normal, Día completo
- **Notificaciones:** Alertas 1 día antes y el mismo día
- **Calendario:** Vista mensual con turnos asignados
- **Predicciones:** Muestra próximos turnos estimados
- **Deshacer:** Botón para revertir último cambio

### 5. Mantenimiento del Vehículo
- **Tracking:** Kilometraje actual
- **Alertas:** Próximos mantenimientos
- **Historial:** Registro de servicios realizados

### 6. Backup y Seguridad
- **Backup Manual:** Exportación JSON completa
- **Restauración:** Importación desde archivo
- **Reset Nuclear:** Borrado completo con confirmación
- **Autenticación:** PIN + Biometría opcional
- **Encriptación:** Datos sensibles encriptados

## Configuración de Supabase

### Tablas Requeridas

#### servicios
```sql
CREATE TABLE servicios (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  origen TEXT,
  destino TEXT,
  importe DECIMAL(10,2),
  tipo TEXT,
  pagado BOOLEAN DEFAULT FALSE,
  fecha_pagado DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### gastos
```sql
CREATE TABLE gastos (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  fecha DATE NOT NULL,
  concepto TEXT,
  importe DECIMAL(10,2),
  categoria TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### vehiculos
```sql
CREATE TABLE vehiculos (
  user_id TEXT PRIMARY KEY,
  license_plate TEXT,
  model TEXT,
  initial_odometer INTEGER,
  maintenance_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### turnos_storage
```sql
CREATE TABLE turnos_storage (
  user_id TEXT PRIMARY KEY,
  data_json JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Variables de Entorno
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Build y Deployment

### Desarrollo Local
```bash
npm install
npm run dev
```

### Build Web
```bash
npm run build
```

### Build Android APK
```bash
# Opción 1: Script automatizado
.\build-apk.bat

# Opción 2: Manual
npm run build
npx cap sync android
npx cap open android
# En Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### Ubicación APK
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Instalación en Android

1. Copiar `app-debug.apk` al dispositivo
2. Habilitar "Fuentes desconocidas" en Configuración → Seguridad
3. Abrir el archivo APK desde el explorador
4. Aceptar permisos:
   - Ubicación (para GPS)
   - Notificaciones (para alertas de turnos)
   - Almacenamiento (para backups)

## Flujo de Usuario Típico

### Primera Vez
1. **Login/Setup:** Nombre, matrícula, modo de trabajo
2. **Configuración inicial:** Kilometraje inicial del vehículo
3. **Configuración de turnos:** Si trabaja en aeropuerto

### Uso Diario
1. **Registrar servicios:** Después de cada carrera
2. **Calcular tarifas:** Antes de iniciar servicio
3. **Revisar turnos:** Verificar calendario de aeropuerto
4. **Registrar gastos:** Combustible, mantenimiento, etc.

### Mantenimiento
1. **Backup semanal:** Exportar datos a JSON
2. **Revisar estadísticas:** Ingresos vs gastos
3. **Actualizar kilometraje:** Registrar odómetro

## Mejores Prácticas

### Seguridad
- Hacer backup antes de reset
- Usar PIN + biometría
- No compartir credenciales de Supabase

### Rendimiento
- Limpiar servicios antiguos periódicamente
- Mantener backups organizados por fecha
- Sincronizar con buena conexión a internet

### Datos
- Registrar servicios inmediatamente
- Verificar datos antes de marcar como pagado
- Revisar gastos mensualmente

## Solución de Problemas

### La app no solicita permisos de GPS
- Verificar que la APK incluye permisos en AndroidManifest.xml
- Reinstalar la app
- Verificar permisos en Configuración → Aplicaciones → CodiaTax

### Datos no se sincronizan
- Verificar conexión a internet
- Verificar credenciales de Supabase en .env
- Revisar consola del navegador para errores

### Error al restaurar backup
- Verificar que el archivo JSON es válido
- Verificar que el backup es de CodiaTax
- Intentar con un backup más reciente

## Roadmap Futuro

### Próximas Versiones
- [ ] Versión iOS
- [ ] Backup automático programado
- [ ] Exportación a Excel/PDF
- [ ] Integración con contabilidad
- [ ] Modo offline completo
- [ ] Estadísticas avanzadas con gráficos
- [ ] Compartir servicios entre taxistas

## Contacto y Soporte

**Desarrollador:** Antigravity AI Assistant  
**Repositorio:** https://github.com/MarkosJ100/codiatax  
**Versión:** 1.2.0  
**Última actualización:** 7 de Febrero de 2026

---

## Changelog Detallado

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo de versiones.

