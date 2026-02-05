# 🚖 CODIATAX - Resumen del Proyecto

**Versión:** 1.0.0
**Fecha:** 14 de Diciembre de 2024
**Desarrollado para:** Gestión Integral de Taxi

---

## 1. Introducción
**Codiatax** es una aplicación móvil híbrida (Android/Web) diseñada para facilitar la gestión diaria de taxistas y conductores profesionales. La aplicación permite un control exhaustivo de servicios, gastos, mantenimiento mecánica y turnos de trabajo, diferenciando claramente entre funciones de **Propietario** (Autónomo) y **Asalariado**.

---

## 2. Gestión de Roles y Seguridad

### 🔐 Inicio de Sesión Inteligente
- **Validación de Licencia**: El campo de licencia municipal cuenta con una validación estricta que solo permite introducir **exactamente 3 dígitos numéricos** (ej: `001`, `152`), evitando errores de formato.
- **Roles de Usuario**:
    - **Propietario**: Acceso total a gestión de negocio, gastos deducibles y taller.
    - **Asalariado**: Interfaz simplificada centrada en recaudación diaria, sueldo y gastos laborales básicos.

---

## 3. Funcionalidades Principales

### 📊 Panel Principal (Dashboard)
- **Resumen del Día**: Visualización rápida de la recaudación bruta, número de servicios y kilometraje.
- **Finanzas (Solo Asalariados)**: Sección exclusiva para ver sueldo acumulado y propinas.

### 📝 Gestión de Servicios
- Registro rápido de carreras (Importe, Método de pago).
- Opción de añadir servicios a empresa o facturados.

### 💸 Control de Gastos (Diferenciado)
- **Modo Asalariado**: Registro de gastos básicos (Comida, Uniforme).
- **Modo Propietario (Negocio)**:
    - **Categorías Profesionales**: Gasolina, Cuota Autónomos, Seguros.
    - **Gestoría Inteligente**: Cálculo automático de provisiones para gestoría (Mensual, Trimestral, Anual).

### 📅 Histórico de Servicios (Nuevo)
- **Vista Calendario**: Calendario visual donde se marcan los días trabajados.
- **Buscador Avanzado**: Herramienta "Lupa" para filtrar servicios por **Día, Mes, Año y Concepto** de forma combinada.
- **Exportación PDF**: Generación de informes profesionales en PDF de los resultados filtrados. Compatible con "Compartir" en Android.

### ✈️ Turnos de Aeropuerto (Turno Aero.)
- **Gestión de Cuadrante**: Calendario específico para marcar días de servicio en aeropuerto.
- **Predicción Inteligente**: Algoritmo que **predice los futuros turnos** sumando ciclos de 11 días desde el último confirmado.
    - **Verde**: Confirmado.
    - **Amarillo**: Previsto (Click para confirmar).
- **Notificaciones Automáticas**: Al confirmar un día, la app programa alarmas en el móvil:
    - **Día anterior (20:00)**: Preaviso.
    - **Mismo día (08:00)**: Aviso de servicio.
- **Información de Vuelos en Tiempo Real**: Accesos directos integrados (Navegador In-App) para consultar llegadas y salidas en el Aeropuerto de Jerez (XRY) a través de Aena, Skyscanner y FlightAware.

### 🔧 Mantenimiento
- Control de revisiones, cambios de aceite y reparaciones del vehículo.

---

## 4. Aspectos Técnicos

- **Tecnología**: React + Vite.
- **Plataforma Nativa**: Capacitor (Android).
- **Almacenamiento**: Local (No requiere conexión permanente para datos históricos básicos).
- **Integraciones**:
    - `@capacitor/local-notifications` para alertas.
    - `@capacitor/filesystem` y `@capacitor/share` para gestión de reportes PDF.
    - `@capacitor/browser` para consultas web seguras.

---

**© 2024 Codiatax Dev Team**
