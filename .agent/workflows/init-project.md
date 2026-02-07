---
description: Project Initialization and Mandatory Tools Setup
---

Este workflow debe ejecutarse al inicio de cada nuevo proyecto para asegurar que las herramientas de IA tengan el contexto y las capacidades de testing necesarias.

1. **Setup de Habilidades (Skills)**:
   - Copiar la carpeta `.agent/skills/context7` para permitir búsquedas de documentación en tiempo real.
   - Copiar la carpeta `.agent/skills/testsprite` para habilitar el testing automatizado.

2. **Verificación de Servidores MCP**:
   - Comprobar que `context7` está configurado en `claude_desktop_config.json`.
   - Comprobar que `testsprite` está configurado con una API Key válida en `claude_desktop_config.json`.

3. **Análisis de Dependencias**:
   - Consultar `package.json` o equivalente.
   - Usar la skill `context7` para obtener las mejores prácticas de las versiones específicas detectadas.

4. **Plan de Pruebas Inicial**:
   - Una vez definido el core del proyecto, usar `testsprite.create_test_plan` para establecer una base de pruebas estable desde el principio.

// turbo
5. **Generar Reporte de Inicio**:
   - Crear un archivo `project_init_report.md` en el directorio de la conversación resumiendo el estado de las herramientas.
