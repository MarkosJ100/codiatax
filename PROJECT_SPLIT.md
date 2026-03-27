# Separacion de Proyectos

Desde esta fecha se trabajan como proyectos distintos:

- `codex/web-1.0`: solo cambios de la version web.
- `codex/android-apk`: solo cambios de la APK Android.

## Reglas de trabajo

1. No mezclar commits de web en ramas Android.
2. No mezclar commits Android en ramas web.
3. Si un cambio aplica a ambos, hacer 2 commits independientes (uno por rama).
4. Antes de empezar, verificar rama activa con `git branch --show-current`.

## Estado inicial

- Rama web base: commit `6ef9628` + fix Vite de dependencias.
- Rama Android base: commit `4edd63f`.
