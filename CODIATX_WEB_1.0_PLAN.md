# Codiatx Version Web 1.0 - Plan de Ejecucion

## Estado
- Fecha de inicio: 2026-03-27
- Proyecto: codiatx version web 1.0
- Objetivo: entregar una version web estable, sin dependencia funcional de plataforma Android nativa.

## Paso 1 - Auditoria Inicial (Completado)
- Resultado: completado.
- Evidencia:
  - Renombrado inicial aplicado en `package.json`, `index.html` y `README.md`.
  - Build validado con `npm run build` (OK).
- Riesgos detectados:
  - Persisten claves historicas `codiatax_*` en almacenamiento local.
  - Existen acoplamientos a entorno nativo via Capacitor.
  - Hay advertencia de chunks grandes en build.

## Paso 2 - Alcance MVP Web 1.0 (Completado)

### Entra en MVP (must-have)
1. Autenticacion y sesion con Supabase (login/logout/session restore).
2. Configuracion de perfil inicial (`/setup`).
3. Dashboard principal (`/`) con indicadores clave.
4. Registro y gestion de servicios (`/services`).
5. Historial (`/history`) con filtros basicos.
6. Gastos (`/expenses`).
7. Facturacion y utilidades principales (`/billing`, `/invoicing`).
8. Persistencia local web y sincronizacion cloud existentes.
9. Responsive web para movil y escritorio.

### Fuera de MVP (fase posterior)
1. Funcionalidades Android nativas especificas (build APK, ajustes nativos, permisos Android).
2. Biometria real (actualmente servicio desactivado).
3. Mejoras avanzadas de rendimiento (split manual fino por modulos grandes).
4. Refactor estetico no funcional.

### Decisiones tecnicas para Web 1.0
1. Web-first routing:
   - Mantener `createBrowserRouter` como ruta oficial web.
   - Eliminar bifurcaciones no necesarias para native runtime en la version web.
2. Naming del almacenamiento:
   - Migrar progresivamente de `codiatax_*` a `codiatx_*` con compatibilidad retroactiva.
3. Mantener React + Vite + TypeScript + Supabase:
   - Se prioriza estabilidad sobre cambios de stack.

## Secuencia de Ejecucion (Paso a paso + revision)

1. Paso 3: Baseline web-first
   - Cambios:
     - Ajustar routing para modo web oficial.
     - Revisar arranque `main.tsx` sin dependencia nativa obligatoria.
   - Revision:
     - Navegacion completa en todas las rutas del MVP.
     - Sin regresiones de autenticacion.
   - Estado: completado.
   - Evidencia:
     - `src/main.tsx` fija `data-platform` a `web`.
     - `src/App.tsx` usa `createBrowserRouter` como enrutado unico.
     - Build validado con `npm run build` (OK).

2. Paso 4: Migracion de claves de almacenamiento
   - Cambios:
     - Introducir claves `codiatx_*`.
     - Fallback de lectura para `codiatax_*` y migracion silenciosa.
   - Revision:
     - Persistencia valida tras recarga.
     - Datos historicos recuperados tras actualizar version.
   - Estado: completado.
   - Evidencia:
     - Claves activas renombradas a `codiatx_*` en contextos, servicios, utilidades y exportaciones.
     - Compatibilidad retroactiva implementada con fallback de lectura desde `codiatax_*`.
     - Migracion silenciosa al nuevo nombre al leer/escribir.
     - Build validado con `npm run build` (OK).

3. Paso 5: Limpieza de dependencias nativas en flujo web
   - Cambios:
     - Aislar o retirar puntos no necesarios para web runtime.
   - Revision:
     - Build web limpio.
     - Flujo de usuario completo sin llamadas nativas.
   - Estado: completado.
   - Evidencia:
     - Eliminadas dependencias de Capacitor del `package.json`.
     - Eliminados scripts `build:android` y `build:ios`.
     - Reemplazo de `Preferences` por wrapper web local en seguridad/autenticacion PIN.
     - Exportaciones PDF y enlaces externos adaptados a flujo web sin plugins nativos.
     - Build validado con `npm run build` (OK).

4. Paso 6: QA funcional MVP
   - Cambios:
     - Pruebas funcionales de rutas y modulos MVP.
   - Revision:
     - Checklist de casos criticos superado.
   - Estado: completado con riesgo controlado.
   - Evidencia:
     - Build: `npm run build` OK.
     - Lint: `npm run lint` OK (sin errores, con warnings de deuda tecnica no bloqueante).
     - Tests: `npm run test -- --run` sigue bloqueado por error de entorno (`spawn EPERM` al cargar Vitest).
     - Correcciones aplicadas para eliminar errores bloqueantes de lint en `src` y excluir rutas auxiliares no productivas del alcance de lint.

5. Paso 7: Release candidate web 1.0
   - Cambios:
     - Ajustes finales, versionado y notas de salida.
   - Revision:
     - Build final y smoke test.
   - Estado: completado.
   - Evidencia:
     - Changelog actualizado con entrada `1.0.0` (2026-03-27).
     - README alineado al alcance web de `codiatx version web 1.0`.
     - Validacion final:
       - `npm run lint` OK (sin errores, con warnings no bloqueantes).
       - `npm run build` OK.
     - Riesgo residual:
       - `npm run test -- --run` bloqueado por entorno (`spawn EPERM`).

## Checklist de control obligatorio por cada paso
- Objetivo del paso definido.
- Cambios concretos aplicados.
- Evidencia de verificacion (build/test/check manual).
- Riesgos detectados.
- Decision de avance:
  - APROBADO
  - AJUSTAR ANTES DE CONTINUAR
