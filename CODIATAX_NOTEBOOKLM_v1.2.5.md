# CodiaTax - Documentación Completa v1.2.5

## Información General

**Nombre:** CodiaTax  
**Versión:** 1.2.5  
**Fecha de Release:** 26 de Febrero de 2026  
**Plataforma:** Web Progressive App (PWA) + Android APK  
**Tecnologías:** React 19, TypeScript, Vite, Capacitor 8, Supabase 2.95, XLSX (SheetJS)
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
- **Importación Inteligente de Servicios (App Taxi/Gestaxi)**

## Novedades en v1.2.5

### 📊 Importación de Datos Robusta (App Taxi / Turnos)

#### Soporte para Archivos "Disfrazados"
- **Detección Automática:** El sistema ahora detecta si un archivo `.csv` es en realidad un `.xlsx` (común en exportaciones de ciertas apps de taxi).
- **Fallback a CSV:** Si la librería `xlsx` lee el archivo pero concatena todas las columnas en una sola celda (Columna A), el sistema lo identifica y re-parsea automáticamente como CSV.

#### Parser CSV Pro (Quote-Aware)
- **Manejo de Comas Decimales:** El nuevo `csvSplitLine` es capaz de diferenciar entre una coma que separa columnas y una coma decimal (ej: `"6,23"`). Esto garantiza que los importes se importen con sus decimales correctos.
- **Campos Entrecomillados:** Soporta campos que contienen saltos de línea o comas internas siempre que estén delimitados por comillas dobles.

#### Corrección Automática de Encoding (UTF-8 Double-Encoded)
- **Fix "CÃ¡diz" → "Cádiz":** Se ha implementado una función `fixEncoding` que detecta y corrige automáticamente el texto corrupto por doble codificación UTF-8, asegurando que nombres de calles y ciudades se lean correctamente.
- **Limpieza de Cabeceras:** Eliminación de caracteres invisibles y símbolos de control en las cabeceras para un mapeo de columnas 100% fiable.

### 🛡️ Mejoras en Mapeo de Columnas
- **Match Parcial Inteligente:** El buscador de columnas ahora es inmune a variaciones de acentos o caracteres rotos (ej: busca `DIRECCI` en lugar de la palabra exacta para encontrar `DIRECCIÓN` con encoding corrupto).
- **Prioridad de Fechas:** Diferenciación inteligente entre "FECHA INICIO" (importante) y "FECHA FIN" para evitar servicios con duración cero o errónea.

## Versiones Anteriores (Resumen)

### v1.2.4 (24 Feb 2026)
- **Tarifas 2026:** Integración oficial BOJA (0.88€/1.11€) exclusiva para Jerez.
- **Abonados:** Funcionalidad de borrado con sincronización cloud.

### v1.2.2 (10 Feb 2026)
- **Autenticación:** Supabase Auth + Persistencia nativa.
- **Seguridad:** PIN de acceso con bloqueo en segundo plano.

---

## Changelog v1.2.5

- **Update:** `src/utils/importData.ts` recodificado para máxima robustez.
- **Feature:** Soporte para archivos de turno de App Taxi (XLSX con estructura CSV interna).
- **Fix:** Caracteres especiales (acentos, ñ) en importación de servicios históricos.

---

Ver [CHANGELOG.md](CHANGELOG.md) para historial completo de versiones.
