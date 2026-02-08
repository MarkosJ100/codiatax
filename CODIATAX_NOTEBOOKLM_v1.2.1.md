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
- Calculadora de tarifas con GPS
- Gestión de servicios y gastos
- Control de kilometraje y mantenimiento
- Gestión de turnos de aeropuerto compartidos
- Sincronización en la nube con Supabase
- Sistema de backup y restauración de datos
- Autenticación biométrica

## Novedades en v1.2.1 (🚀 GPS Pro Update)

### 🗺️ Calculadora de Flujo Continuo
- **Interfaz "Always-On":** Campos de origen y destino siempre visibles en la parte superior.
- **Auto-Cálculo:** Cálculo automático de ruta, precio, clima y tráfico al seleccionar una sugerencia.
- **Sin Botón de Reset:** Experiencia fluida donde se puede editar el destino en cualquier momento sin reiniciar la vista.
- **Origen Interactivo:** Posibilidad de refrescar la ubicación actual pulsando sobre el campo de origen.

### 🌤️ Información Inteligente de Destino
- **Clima en Tiempo Real:** Temperatura y estado del cielo en el destino mediante Open-Meteo.
- **Alertas de Tráfico DGT:** Lista detallada de incidencias (obras, retenciones, cierres) en la provincia de destino.
- **Navegación GPS Nativa:** Botón directo para iniciar la navegación en Google Maps o Apple Maps con la ruta ya cargada.

### 🔍 Autocompletado Robusto
- **Motor OpenStreetMap:** Sugerencias basadas exclusivamente en Nominatim para evitar errores de geocodificación.
- **Limpieza de Direcciones:** Nombres más cortos y legibles (sin códigos postales ni países redundantes).
- **Priorización Local:** Búsqueda optimizada para resultados en la zona de Cádiz y Andalucía.

## Novedades en v1.2.0 (Anterior)

### 🎉 Sistema de Backup y Restauración
- **Ubicación:** Configuración de la App → Gestión de Datos
- **Formato:** JSON con todos los datos de la aplicación para migración fácil entre dispositivos.

### 🐛 Correcciones Importantes
- **Reset Nuclear:** Limpieza total de datos incluyendo Supabase y local storage.
- **Botón Deshacer:** Rediseño del botón flotante en turnos para no obstruir la navegación.

## Estructura de Datos (Actualización v1.2.1)

### Resultados de GPS
```typescript
interface GPSInfo {
  weather: {
    temperature: number;
    condition: string;
    icon: string;
  };
  traffic: Array<{
    road: string;
    type: string;
    description: string;
    level: 'yellow' | 'red';
  }>;
}
```

## Flujo de Trabajo GPS
1. **Búsqueda:** El usuario empieza a escribir el destino.
2. **Selección:** Al elegir una sugerencia, la app dispara `handleCalculate` automáticamente.
3. **Análisis:** Se obtiene la ruta de OSRM, el clima y los avisos de la DGT.
4. **Respuesta:** El panel de resultados aparece dinámicamente debajo de los inputs.
5. **Acción:** El usuario pulsa "INICIAR NAVEGACIÓN" para abrir su app de mapas favorita.

---
**Desarrollador:** Antigravity AI Assistant  
**Repositorio:** https://github.com/MarkosJ100/codiatax  
**Versión:** 1.2.1  
**Última actualización:** 8 de Febrero de 2026
