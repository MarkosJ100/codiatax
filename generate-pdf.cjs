// Script para generar PDF de la documentación de CodiaTax
// Ejecutar con: node generate-pdf.js

const fs = require('fs');
const path = require('path');

// Contenido de la documentación
const content = `
CODIATAX - DOCUMENTACIÓN COMPLETA
Aplicación de Gestión Profesional para Taxistas
Versión 1.1.0

═══════════════════════════════════════════════════════════════

📱 ¿QUÉ ES CODIATAX?

CodiaTax es una aplicación móvil diseñada específicamente para 
profesionales del taxi que necesitan llevar un control diario de:

✓ Ingresos y gastos
✓ Servicios realizados  
✓ Mantenimiento del vehículo
✓ Turnos de aeropuerto
✓ Estadísticas y resúmenes

La app te ayuda a ahorrar tiempo, reducir errores en la 
contabilidad y tener toda la información de tu negocio siempre 
disponible en tu móvil.

═══════════════════════════════════════════════════════════════

🎯 ¿PARA QUIÉN ES ESTA APP?

• Propietarios de taxi que gestionan su propio negocio
• Conductores asalariados que necesitan reportar servicios
• Taxistas con turnos de aeropuerto que necesitan predicción
• Cualquier profesional del taxi que quiera profesionalizar 
  su gestión

═══════════════════════════════════════════════════════════════

🚀 FUNCIONALIDADES PRINCIPALES

1. 🏠 PANTALLA DE INICIO (DASHBOARD)

Lo primero que ves al abrir la app:

• Resumen diario: Ingresos de hoy, servicios realizados
• Odómetro virtual: Kilómetros totales del vehículo
• Alertas de mantenimiento: Te avisa cuándo toca revisión
• Acceso rápido: Botones para registrar servicios o km

¿Para qué sirve?
Tener una visión general de tu día de trabajo sin navegar 
por múltiples pantallas.

───────────────────────────────────────────────────────────────

2. 🚖 REGISTRO DE SERVICIOS

Cada vez que realizas un servicio (carrera), puedes registrarlo:

Datos que guardas:
• Hora de inicio y fin
• Origen y destino
• Tarifa cobrada (efectivo, tarjeta, bizum)
• Tipo de servicio (urbano, aeropuerto, nocturno, etc.)
• Kilómetros recorridos

Funcionalidades especiales:
✓ Editar servicios: Si cometiste un error, corrígelo
✓ Eliminar servicios: Para borrar duplicados
✓ Estadísticas automáticas: Ve cuánto ganaste por día/semana/mes

¿Para qué sirve?
Tener un histórico completo de todos tus servicios para:
- Declaraciones de impuestos
- Análisis de rentabilidad
- Justificación de ingresos ante gestoría

───────────────────────────────────────────────────────────────

3. 💰 GESTIÓN DE GASTOS (MEJORADO)

Uno de los módulos más potentes de la app.

TIPOS DE GASTOS:

🚗 Gastos de Vehículo:
• Gasoil / Gasolina
• Mantenimiento / Taller
• Seguro del coche
• Lavado / Limpieza
• Otros gastos vehículo

💼 Gastos de Negocio:
• Cuota de autónomo
• Gestoría (con cálculo de frecuencia)
• Impuestos / Tasas
• Asociación / Emisora
• Otros gastos negocio

✏️ Gastos Manuales:
• Para cualquier gasto personalizado

FUNCIONALIDADES ESPECIALES:

1. Cálculo automático de Gestoría:
   Ejemplo: Pagas 60€ trimestrales
   → La app calcula: 60€ ÷ 3 = 20€/mes
   → Se registra automáticamente como gasto mensual

2. Edición de gastos:
   Si te equivocaste → Click en ✏️ → Modifica y guarda

3. Borrado de gastos:
   Click en 🗑️ → Confirmación → Eliminado

4. Historial completo:
   Todos tus gastos ordenados por fecha, filtrados por 
   categoría, exportables para tu gestoría

¿Para qué sirve?
Controlar exactamente en qué gastas para:
- Maximizar deducciones fiscales
- Identificar gastos innecesarios
- Llevar contabilidad precisa

───────────────────────────────────────────────────────────────

4. 🔧 MANTENIMIENTO DE TALLER

Control profesional del estado de tu vehículo.

ARTÍCULOS PREDEFINIDOS CON INTERVALOS RECOMENDADOS:

Artículo                      | Intervalo
─────────────────────────────────────────────────────
Cambio de Aceite              | Cada 15,000 km
Filtros (Aire/Habitáculo)     | Cada 30,000 km
Aceite Caja de Cambios        | Cada 90,000 km

CÓMO FUNCIONA:

1. Registro de mantenimiento:
   • Seleccionas artículo (ej: Cambio de Aceite)
   • Introduces km actuales (ej: 75,000 km)
   • La app calcula: próximo cambio a los 90,000 km

2. Avisos automáticos:
   • Dashboard muestra: "Faltan 5,000 km para cambio de aceite"
   • Si te pasas: "¡Revisión atrasada!"

3. Historial de mantenimiento:
   • Lista completa de todo el mantenimiento
   • Fechas, kilómetros, y descripción

4. Exportación PDF:
   • Genera informe profesional en PDF
   • Perfecto para vender el coche o revisar historial

¿Para qué sirve?
- Nunca olvidar una revisión importante
- Mantener el vehículo en óptimas condiciones
- Aumentar el valor de reventa (con historial completo)

───────────────────────────────────────────────────────────────

5. ✈️ TURNOS DE AEROPUERTO

Sistema inteligente de predicción de turnos.

FUNCIONALIDADES:

1. Calendario visual:
   🟢 Verde: Turnos confirmados por ti
   🟡 Amarillo: Predicciones automáticas

2. Predicción inteligente:
   • El sistema sabe que los turnos son cada 11 días
   • Tú confirmas un turno (ej: 15 de diciembre)
   • La app predice: 26 dic, 6 ene, 17 ene...

3. Confirmación rápida:
   • Toca un día amarillo → se vuelve verde
   • Las predicciones se recalculan automáticamente

4. Persistencia total:
   • Los turnos NO se borran al cerrar la app
   • Sincroniza automáticamente

5. Enlaces útiles:
   • Botones para ver vuelos en tiempo real
   • Acceso rápido a información del aeropuerto

¿Para qué sirve?
- Planificar tu calendario mensual
- No olvidar nunca un turno
- Optimizar otros trabajos en días libres

───────────────────────────────────────────────────────────────

6. 🔐 SISTEMA DE ACCESO INTELIGENTE

Login mejorado con funcionalidades profesionales.

CARACTERÍSTICAS:

1. Recordar usuario:
   • Marca "Recordarme en este dispositivo"
   • La próxima vez entrarás automáticamente

2. Pre-llenado inteligente:
   • Si cierras sesión, tus datos siguen guardados
   • Solo tienes que darle a "Entrar" de nuevo

3. Multi-usuario:
   • Perfecto si múltiples personas usan la app
   • Cada uno con su perfil (Propietario o Asalariado)

4. Seguridad:
   • Datos cifrados en localStorage
   • No se comparten con terceros
   • Todo local en tu dispositivo

═══════════════════════════════════════════════════════════════

📊 VENTAJAS VS MÉTODOS TRADICIONALES

Método Tradicional          | CodiaTax
─────────────────────────────────────────────────────────────
📝 Libreta de papel         | 📱 Todo digital, siempre disponible
🧮 Calculadora manual       | ⚡ Cálculos automáticos
📁 Facturas en casa         | ☁️ Acceso desde cualquier lugar
🤷 Olvidar gastos           | 🔔 Recordatorios y avisos
⏰ Tiempo buscando datos    | 🔍 Búsqueda instantánea
📊 Sin estadísticas         | 📈 Gráficas automáticas

═══════════════════════════════════════════════════════════════

💡 CASOS DE USO REALES

CASO 1: DECLARACIÓN TRIMESTRAL
1. Fin de trimestre → Vas a Historial
2. Filtras por últimos 3 meses
3. Exportas PDF con todos los servicios y gastos
4. Se lo envías a tu gestor
5. ¡Listo en 2 minutos!

CASO 2: REVISIÓN DEL COCHE
1. Dashboard te avisa: "Cambio de aceite en 500 km"
2. Vas al taller
3. Registras el mantenimiento con el km actual
4. La app recalcula: próximo en 15,000 km
5. Ya no tienes que recordarlo

CASO 3: PLANIFICACIÓN MENSUAL
1. Abres "Turno Aero"
2. Ves todos tus turnos del mes (verde + amarillo)
3. Planificas otros trabajos en días libres
4. Confirmas turnos predichos tocándolos
5. Calendario siempre actualizado

═══════════════════════════════════════════════════════════════

🔒 SEGURIDAD Y PRIVACIDAD

TUS DATOS SON TUYOS:
✓ Todo se guarda localmente en tu móvil
✓ No hay servidores externos
✓ No se comparte información con terceros
✓ Sin cuentas en la nube
✓ Sin publicidad

CONTROL TOTAL:
• Puedes exportar tus datos cuando quieras
• Puedes borrar todo con un click
• No dependes de internet para usarla

═══════════════════════════════════════════════════════════════

📲 INSTALACIÓN Y REQUISITOS

REQUISITOS DEL SISTEMA:
• Android: 7.0 o superior
• iOS: 13.0 o superior (en desarrollo)
• Almacenamiento: ~50 MB
• Internet: Solo para la primera descarga

PERMISOS NECESARIOS:
• 📁 Almacenamiento: Para guardar datos
• 📸 Cámara (opcional): Para escanear tickets
• 🔔 Notificaciones: Para recordatorios

═══════════════════════════════════════════════════════════════

🎯 CONCLUSIÓN

CodiaTax es mucho más que una app de registro:

✅ Es tu asistente de negocio personal
✅ Tu contador automático de gastos
✅ Tu recordatorio de mantenimiento
✅ Tu planificador de turnos
✅ Tu herramienta profesional para ser más eficiente

TODO EN UNA SOLA APLICACIÓN, 
DISEÑADA POR TAXISTAS, PARA TAXISTAS.

EL RESULTADO:
✓ Más tiempo para ti
✓ Menos errores en cuentas
✓ Más control de tu negocio
✓ Más profesionalidad ante clientes y gestores

═══════════════════════════════════════════════════════════════

CodiaTax v1.1.0
Documentación generada el 21 de Diciembre de 2025
© 2025 CodiaTax - Todos los derechos reservados
`;

// Guardar como archivo de texto (que se puede convertir a PDF)
const outputPath = path.join(__dirname, 'CodiaTax_Documentacion_Completa.txt');
fs.writeFileSync(outputPath, content, 'utf8');

console.log('✅ Documentación generada exitosamente!');
console.log('📄 Ubicación:', outputPath);
console.log('');
console.log('Para convertir a PDF:');
console.log('1. Abre el archivo .txt');
console.log('2. Imprime a PDF (Ctrl+P)');
console.log('3. O usa: https://txt2pdf.com');
