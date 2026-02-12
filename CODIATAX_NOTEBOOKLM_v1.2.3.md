# CodiaTax - Documentación Completa v1.2.3

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.3  
**Fecha de Release:** 12 de Febrero de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK (Firmado)  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95  
**Repositorio:** https://github.com/MarkosJ100/codiatax

## Descripción

CodiaTax es una aplicación completa de gestión para taxistas que incluye:
- Calculadora de tarifas con GPS inteligente y flujo continuo
- Gestión diferenciada de servicios (**Taxi vs Abonados**) con identidad visual propia
- Optimizaciones de rendimiento (**Lazy Loading** y **Paginación**)
- Rediseño Premium con Modo Claro (Confort) y Oscuro Refinado
- Gestión de servicios, gastos, mantenimiento y turnos de aeropuerto
- Sincronización en la nube con Supabase y sistema de backup/restauración

## Novedades en v1.2.3

### 🚖 Separación Estratégica: Taxi vs Abonados
- **Identidad Visual**: El sistema ahora distingue claramente entre servicios diarios y servicios de facturación empresarial.
  - **Color Taxi**: Azul Corporativo (`var(--accent-primary)`).
  - **Color Abonados**: Violeta Vibrante (Nuevo color secundario).
- **Dashboard Desglosado**: La vista principal muestra ahora tres tarjetas de totales: Ingresos Taxi, Ingresos Abonados y Total General.
- **Formularios Dinámicos**: `ServiceForm` cambia de color de fondo y acento según la pestaña seleccionada para reducir errores de entrada.
- **Historial Filtrable**: Tanto en el registro diario como en el historial general se han añadido pestañas para filtrar rápidamente por tipo de servicio.

### ⚡ Optimizaciones de Rendimiento (Ultra Fluidity)
- **Lazy Loading de Rutas**: Implementación de `React.lazy` y `Suspense` en `App.tsx`. La aplicación solo carga el código de la pantalla que el usuario está viendo, mejorando drásticamente el tiempo de inicio.
- **Paginación de Listas**: El componente `ServiceList` ahora renderiza los servicios en bloques de 20. Se ha añadido un botón de "Cargar más" para manejar grandes volúmenes de datos sin pérdida de FPS.
- **Transiciones de Página**: Navegación suave entre pantallas mediante el nuevo componente `PageTransition` y `framer-motion`.

### 📱 Producción y APK
- **APK Firmado (Signed Release)**: Configuración de `signingConfigs` en Gradle. La aplicación ya se puede instalar en cualquier dispositivo Android sin errores de "Paquete no válido".
- **Refinamiento de index.css**: Actualización de sombras ("Glassmorphism 2.0") y estados hover para una experiencia más táctil y premium.

## Arquitectura Técnica (Actualizada)

### Frontend
- **Framework:** React 19 con TypeScript
- **Animaciones:** Framer Motion (Transiciones de página y micro-interacciones)
- **Lazy Loading:** `Suspense` + `React.lazy` para bundle splitting
- **Routing:** React Router v7 con `PageWrapper` para animaciones automáticas

### Backend y Datos
- **Sincronización Inteligente:** Cloud sync bidireccional optimizado con protecciones contra bucles de actualización.
- **Persistencia Nativa:** `@capacitor/preferences` para tokens de acceso y PIN.

## Estructura de Archivos Clave (v1.2.3)
```
src/
├── App.tsx                    # Router optimizado con Lazy Loading
├── components/
│   ├── Layout/
│   │   └── PageTransition.tsx # [NUEVO] Wrapper de animaciones
│   ├── Services/
│   │   └── ServiceList.tsx    # [OPTIMIZADO] Con paginación y filtros
│   └── ...
├── pages/
│   ├── History.tsx            # [MODIFICADO] Con pestañas de filtrado
│   └── ...
└── index.css                  # [MODIFICADO] Variables de diseño 2.0
```

## Build y APK
- **Generación**: `.\gradlew assembleRelease` desde la carpeta `/android`.
- **Ubicación**: `android/app/build/outputs/apk/release/app-release.apk`
- **Keystore**: `my-release-key.keystore` (almacenado en el proyecto para consistencia).

---

## Changelog v1.2.3
- Implementado sistema de pestañas Taxi/Abonados en Dashboard e Historial.
- Añadido Lazy Loading para todas las rutas principales.
- Implementada paginación en `ServiceList.tsx`.
- Creado componente `PageTransition` para navegación fluida.
- Configurada firma de lanzamiento (Release Signing) para Android.
- Refinados estilos visuales (sombras, bordes y colores).
