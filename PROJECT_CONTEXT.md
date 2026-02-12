# CodiaTax - Documentación de Contexto del Proyecto (v1.2.3)

Este documento centraliza el estado actual de la aplicación CodiaTax para su uso en herramientas de IA como NotebookLM.

## 📌 Visión General
CodiaTax es un gestor de facturación y servicios para taxistas, desarrollado con **React 19**, **Vite**, **Supabase** y **Capacitor**.

## 🚀 Novedades v1.2.3 (Última Versión)

### 1. Sistema Diferenciado: Taxi vs Abonados
- **Identidad Visual**: Pestañas de registro y visualización diferenciadas por colores.
  - **Taxi (Azul)**: Servicios urbanos estándar.
  - **Abonados (Violeta)**: Servicios para empresas y facturación periódica.
- **Desglose Financiero**: El Dashboard ahora muestra ingresos separados para tener un control real de la rentabilidad por sector.
- **Histórico Inteligente**: Filtros por tipo de servicio tanto en el registro diario como en el historial general.

### 2. Optimización Técnica
- **Lazy Loading**: Las rutas de la aplicación se cargan bajo demanda, reduciendo el peso del bundle inicial y acelerando el arranque en móviles.
- **Paginación en Listas**: El historial de servicios ahora utiliza paginación (botón "Cargar más") para mantener la fluidez incluso con miles de registros.
- **Transiciones Smooth**: Navegación fluida entre pantallas mediante `framer-motion`.

### 3. Seguridad y Producción
- **Firma de APK**: La aplicación Android ahora cuenta con una configuración de firma de lanzamiento (`release signing`) para permitir su instalación directa en cualquier dispositivo.
- **Pin Guard**: Sistema de protección de acceso mediante código PIN.
- **Sincronización Cloud**: Integración completa con Supabase para respaldo de datos y autenticación (Email/OAuth).

## 🛠️ Stack Tecnológico
- **Frontend**: React 19, Lucide React (Iconografía), Recharts (Gráficos), Framer Motion (Animaciones).
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage).
- **Móvil**: Ionic Capacitor (Acceso a API nativa).
- **Estilos**: Vanilla CSS con variables modernas (Glassmorphism).

## 📁 Estructura del Proyecto
- `/src/pages`: Pantallas principales (Home, Services, History, Expenses, etc.)
- `/src/context`: Gestión de estado global (`AppContext`).
- `/src/components`: Componentes UI reutilizables.
- `/src/utils`: Lógica de cálculo financiero y helpers.
- `/src/services`: Integración con APIs externas y Supabase.
