# CodiaTax - Documentación Completa v1.2.4

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.4  
**Fecha de Release:** 24 de Febrero de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK (Debug/Release)  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95  
**Repositorio:** https://github.com/MarkosJ100/codiatax

## Descripción

CodiaTax es una aplicación completa de gestión para taxistas que incluye:
- Calculadora de tarifas con GPS inteligente y flujo continuo.
- Gestión diferenciada de servicios (**Taxi vs Abonados**) con identidad visual propia.
- **Tarifas Oficiales 2026** integradas (BOJA 17/02/2026).
- Gestión de servicios, gastos, mantenimiento y turnos de aeropuerto.
- Sincronización en la nube con Supabase y sistema de backup/restauración.

## Novedades en v1.2.4

### 🚖 Actualización Masiva de Tarifas 2026
- **Cumplimiento BOJA**: Integración de la resolución del 17 de febrero de 2026.
  - **Tarifa 1 (Urbana)**: Incrementada a 0.88 €/km.
  - **Tarifa 2 (Urbana)**: Incrementada a 1.11 €/km.
  - **Mínimos de Aeropuerto**: Actualizados a 16.72 € (T1) y 21.13 € (T2).
- **Distinción Local/Interurbano**: 
  - Las nuevas tarifas (0.88/1.11) se aplican exclusivamente al término municipal de Jerez (Local y Pedanías).
  - Los trayectos interurbanos (Fuera de Jerez) mantienen los tipos de **0.71 €/km** y **0.82 €/km** para no encarecer rutas de largo recorrido innecesariamente.
- **UI Actualizada**: Todas las menciones visuales en el Dashboard, Calculadora e Historial reflejan ahora el año "2026".

### 👥 Gestión de Abonados (Borrado)
- **Herramienta de Gestión**: Añadido un nuevo flujo para gestionar la lista de clientes abonados.
- **Funcionalidad de Borrado**: Ahora es posible eliminar abonados antiguos o erróneos desde el formulario de servicios.
- **Sincronización Total**: Los borrados se reflejan instantáneamente en Supabase y en los selectores de todos los dispositivos sincronizados.

### 🛠️ Mejoras Técnicas
- **Data Layer Separation**: El archivo de tarifas se ha modularizado para permitir diferentes configuraciones de precios según el destino (Urbano vs Interurbano).
- **APK Builder**: Script de compilación optimizado para generar APKs de prueba rápidos con las últimas tarifas integradas.

## Estructura de Archivos Clave (v1.2.4)
```
src/
├── data/
│   └── taxiFares2026.ts        # [NUEVO] Base de datos oficial 2026
├── services/
│   └── routingService.ts       # [MODIFICADO] Lógica de precios dual (Local/Inter)
├── pages/
│   ├── TaxiCalculator.tsx      # [MODIFICADO] Switcher inteligente de precios/km
│   └── Home.tsx                # [MODIFICADO] Header y banners actualizados a 2026
└── ...
```

## Changelog v1.2.4
- Actualizadas las tarifas base a 0.88€ (T1) y 1.11€ (T2) según BOJA 2026.
- Implementada lógica de precios dual: Urbano (Nuevo) vs Interurbano (Legado).
- Añadida funcionalidad de borrado de abonados con sincronización Supabase.
- Actualizada toda la interfaz de usuario con referencias al año 2026.
- Eliminado archivo de datos obsoleto `taxiFares2025.ts`.
- Generado nuevo APK de pruebas v1.2.4.
