# CodiaTax - Documentación Completa v1.2.1

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.1  
**Fecha de Release:** 8 de Febrero de 2026  
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
- Autenticación biométrica

## Novedades en v1.2.1

### 🎨 Rediseño Premium (Modo Confort)

#### Modo Claro "Warm Stone"
- **Objetivo:** Eliminar el deslumbramiento y la fatiga visual.
- **Paleta:** Base en Gris Piedra Cálido (#e7e7e4) y tarjetas en Crema Suave (#f5f5f4).
- **Contraste:** Texto en Gris Grafito para una lectura más natural y parecida al papel.
- **Estandarización:** Todos los widgets y gráficas adaptados automáticamente a esta paleta.

#### Modo Oscuro Refinado
- **Estética:** Fondo azul medianoche profundo (#020617) para una apariencia más pro y moderna.
- **Detalles:** Bordes y sombras optimizados para máxima claridad en pantallas OLED.

#### Selector de Apariencia
- **Ubicación:** Configuración de la App (Dashboard principal).
- **Interruptor Premium:** Nuevo switch animado para cambiar entre temas al instante.

### 🗺️ GPS Pro (Flujo Continuo)

#### Arquitectura de Interfaz
- **Entrada Persistente:** Los campos de búsqueda (Origen/Destino) siempre visibles.
- **Cálculo Automático:** Al seleccionar una sugerencia, se inicia el cálculo de ruta, tarifa, tráfico y clima sin clics adicionales.
- **Integración de Navegador:** Botón directo para abrir Google/Apple Maps con las coordenadas exactas.

#### Datos Inteligentes
- **Tráfico en Tiempo Real:** Lista detallada de incidencias DGT.
- **Clima en Destino:** Temperatura y estado del cielo directo en el resultado.
- **Autocomplete Optimizado:** Solo direcciones reales de OpenStreetMap con prioridad local.

## Arquitectura Técnica

### Frontend
- **Framework:** React 19 con TypeScript
- **State Management:** Context API (Theme Provider integrado)
- **UI:** CSS Variables baseline en :root, Framer Motion
- **Icons:** Lucide React

### Backend y Datos
- **Base de Datos:** Supabase (PostgreSQL)
- **Backup:** Exportación JSON manual + Restauración robusta
- **Sincronización:** Cloud sync bidireccional

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
