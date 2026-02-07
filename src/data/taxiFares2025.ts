// Taxi Fare Data for Jerez de la Frontera 2025
// Source: Resolución 18 febrero 2025, Dirección General de Movilidad y Transportes (BOJA)

export interface FareDestination {
    name: string;
    km: number;
    tarifa7: number;
    tarifa8: number;
    category: string;
}

export interface TariffInfo {
    type: 'tarifa7' | 'tarifa8';
    label: string;
    description: string;
    pricePerKm: number;
    bajadaBandera: number;
    hourlyWait: number;
    minPerception: number;
    wait15min: number;
}

// Tariff configuration
export const TARIFFS: Record<string, TariffInfo> = {
    tarifa7: {
        type: 'tarifa7',
        label: 'Tarifa 7 - Diurna',
        description: 'Lunes a Viernes, 6:00-22:00',
        pricePerKm: 0.71,
        bajadaBandera: 3.66,
        hourlyWait: 17.57,
        minPerception: 3.83,
        wait15min: 4.38
    },
    tarifa8: {
        type: 'tarifa8',
        label: 'Tarifa 8 - Nocturna/Festiva',
        description: 'Sábados, Domingos, Festivos y 22:00-6:00',
        pricePerKm: 0.82,
        bajadaBandera: 3.60,
        hourlyWait: 20.71,
        minPerception: 4.51,
        wait15min: 5.18
    }
};

// Spanish National Holidays + Jerez Local Holidays (2025-2026)
// Tarifa 8 applies on these days
const HOLIDAYS_2025 = [
    '2025-01-01', // Año Nuevo
    '2025-01-06', // Reyes Magos
    '2025-02-28', // Día de Andalucía
    '2025-04-17', // Jueves Santo
    '2025-04-18', // Viernes Santo
    '2025-05-01', // Día del Trabajo
    '2025-05-15', // Feria de Jerez (local)
    '2025-05-16', // Feria de Jerez (local)
    '2025-05-17', // Feria de Jerez (local)
    '2025-05-18', // Feria de Jerez (local)
    '2025-05-19', // Feria de Jerez (local)
    '2025-08-15', // Asunción de la Virgen
    '2025-09-08', // Virgen de la Merced (local Jerez)
    '2025-10-12', // Fiesta Nacional de España
    '2025-11-01', // Todos los Santos
    '2025-12-06', // Día de la Constitución
    '2025-12-08', // Inmaculada Concepción
    '2025-12-25', // Navidad
];

const HOLIDAYS_2026 = [
    '2026-01-01', // Año Nuevo
    '2026-01-06', // Reyes Magos
    '2026-02-28', // Día de Andalucía
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
    '2026-05-07', // Feria de Jerez (estimado)
    '2026-05-08', // Feria de Jerez (estimado)
    '2026-05-09', // Feria de Jerez (estimado)
    '2026-05-10', // Feria de Jerez (estimado)
    '2026-05-11', // Feria de Jerez (estimado)
    '2026-08-15', // Asunción de la Virgen
    '2026-09-08', // Virgen de la Merced (local Jerez)
    '2026-10-12', // Fiesta Nacional de España
    '2026-11-01', // Todos los Santos (cae en domingo, puede trasladarse)
    '2026-12-06', // Día de la Constitución (cae en domingo)
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
];

const ALL_HOLIDAYS = [...HOLIDAYS_2025, ...HOLIDAYS_2026];

// Check if a date is a holiday
const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return ALL_HOLIDAYS.includes(dateStr);
};

// Determine which tariff applies based on date and time
export const getCurrentTariff = (date: Date = new Date()): TariffInfo => {
    const day = date.getDay(); // 0=Sunday, 6=Saturday
    const hour = date.getHours();

    // Tarifa 8: weekends, holidays, or night hours (22:00-6:00)
    if (day === 0 || day === 6 || isHoliday(date) || hour >= 22 || hour < 6) {
        return TARIFFS.tarifa8;
    }
    return TARIFFS.tarifa7;
};

// Get tariff reason for UI display
export const getTariffReason = (date: Date = new Date()): string => {
    const day = date.getDay();
    const hour = date.getHours();

    if (isHoliday(date)) return 'Día festivo';
    if (day === 0) return 'Domingo';
    if (day === 6) return 'Sábado';
    if (hour >= 22 || hour < 6) return 'Horario nocturno';
    return 'Día laborable';
};

// Categories
export const CATEGORIES = [
    { id: 'general', label: '📍 Destinos Generales' },
    { id: 'cercanias', label: '🏘️ Cercanías' },
    { id: 'ventas', label: '🍽️ Ventas' },
    { id: 'cortijos', label: '🏡 Cortijos y Fincas' },
    { id: 'playas', label: '🏖️ Playas' },
    { id: 'ecuestres', label: '🐴 Centros Ecuestres' },
    { id: 'clubes', label: '🎉 Clubes' },
    { id: 'hoteles', label: '🏨 Hoteles' }
];

// Airport fares (origin: Aeropuerto)
export const AIRPORT_FARES: FareDestination[] = [
    // General destinations
    { name: 'Albacete', km: 540, tarifa7: 766.80, tarifa8: 885.60, category: 'general' },
    { name: 'Alcalá de Guadaira', km: 90, tarifa7: 127.80, tarifa8: 147.60, category: 'general' },
    { name: 'Alcalá de los Gazules', km: 65, tarifa7: 92.30, tarifa8: 106.60, category: 'general' },
    { name: 'Algeciras', km: 110, tarifa7: 156.20, tarifa8: 180.40, category: 'general' },
    { name: 'Arcos de la Frontera', km: 37, tarifa7: 52.54, tarifa8: 60.68, category: 'general' },
    { name: 'Barbate', km: 100, tarifa7: 142.00, tarifa8: 164.00, category: 'general' },
    { name: 'Barcelona', km: 1070, tarifa7: 1519.40, tarifa8: 1754.80, category: 'general' },
    { name: 'Benalmádena', km: 215, tarifa7: 305.30, tarifa8: 352.60, category: 'general' },
    { name: 'Cádiz', km: 45, tarifa7: 63.90, tarifa8: 73.80, category: 'general' },
    { name: 'Chiclana', km: 55, tarifa7: 78.10, tarifa8: 90.20, category: 'general' },
    { name: 'Chipiona', km: 42, tarifa7: 59.64, tarifa8: 68.88, category: 'general' },
    { name: 'Conil', km: 75, tarifa7: 106.50, tarifa8: 123.00, category: 'general' },
    { name: 'Córdoba', km: 200, tarifa7: 284.00, tarifa8: 328.00, category: 'general' },
    { name: 'Dos Hermanas', km: 80, tarifa7: 113.60, tarifa8: 131.20, category: 'general' },
    { name: 'El Cuervo', km: 15, tarifa7: 21.30, tarifa8: 24.60, category: 'general' },
    { name: 'El Puerto de Santa María', km: 30, tarifa7: 42.60, tarifa8: 49.20, category: 'general' },
    { name: 'Estepona', km: 155, tarifa7: 220.10, tarifa8: 254.20, category: 'general' },
    { name: 'Fuengirola', km: 210, tarifa7: 298.20, tarifa8: 344.40, category: 'general' },
    { name: 'Gibraltar', km: 125, tarifa7: 177.50, tarifa8: 205.00, category: 'general' },
    { name: 'Granada', km: 270, tarifa7: 383.40, tarifa8: 442.80, category: 'general' },
    { name: 'Grazalema', km: 90, tarifa7: 127.80, tarifa8: 147.60, category: 'general' },
    { name: 'Huelva', km: 185, tarifa7: 262.70, tarifa8: 303.40, category: 'general' },
    { name: 'La Línea', km: 120, tarifa7: 170.40, tarifa8: 196.80, category: 'general' },
    { name: 'Lebrija', km: 25, tarifa7: 35.50, tarifa8: 41.00, category: 'general' },
    { name: 'Madrid', km: 630, tarifa7: 894.60, tarifa8: 1033.20, category: 'general' },
    { name: 'Málaga', km: 240, tarifa7: 340.80, tarifa8: 393.60, category: 'general' },
    { name: 'Marbella', km: 180, tarifa7: 255.60, tarifa8: 295.20, category: 'general' },
    { name: 'Medina Sidonia', km: 45, tarifa7: 63.90, tarifa8: 73.80, category: 'general' },
    { name: 'Olvera', km: 100, tarifa7: 142.00, tarifa8: 164.00, category: 'general' },
    { name: 'Puerto Real', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'general' },
    { name: 'Ronda', km: 120, tarifa7: 170.40, tarifa8: 196.80, category: 'general' },
    { name: 'Rota', km: 40, tarifa7: 56.80, tarifa8: 65.60, category: 'general' },
    { name: 'San Fernando', km: 47, tarifa7: 66.74, tarifa8: 77.08, category: 'general' },
    { name: 'Sanlúcar de Barrameda', km: 37, tarifa7: 52.54, tarifa8: 60.68, category: 'general' },
    { name: 'Sevilla', km: 105, tarifa7: 149.10, tarifa8: 172.20, category: 'general' },
    { name: 'Sevilla Aeropuerto', km: 110, tarifa7: 156.20, tarifa8: 180.40, category: 'general' },
    { name: 'Sotogrande', km: 130, tarifa7: 184.60, tarifa8: 213.20, category: 'general' },
    { name: 'Tarifa', km: 130, tarifa7: 184.60, tarifa8: 213.20, category: 'general' },
    { name: 'Torremolinos', km: 225, tarifa7: 319.50, tarifa8: 369.00, category: 'general' },
    { name: 'Trebujena', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'general' },
    { name: 'Ubrique', km: 80, tarifa7: 113.60, tarifa8: 131.20, category: 'general' },
    { name: 'Utrera', km: 65, tarifa7: 92.30, tarifa8: 106.60, category: 'general' },
    { name: 'Valencia', km: 715, tarifa7: 1015.30, tarifa8: 1172.60, category: 'general' },
    { name: 'Vejer de la Frontera', km: 82, tarifa7: 116.44, tarifa8: 134.48, category: 'general' },
    { name: 'Villamartín', km: 60, tarifa7: 85.20, tarifa8: 98.40, category: 'general' },
    { name: 'Zahara de los Atunes', km: 105, tarifa7: 149.10, tarifa8: 172.20, category: 'general' },
    // Cercanías
    { name: 'Aqualand', km: 24, tarifa7: 34.08, tarifa8: 39.36, category: 'cercanias' },
    { name: 'Casino Bahía de Cádiz', km: 25, tarifa7: 35.50, tarifa8: 41.00, category: 'cercanias' },
    { name: 'Circuito de Velocidad', km: 15, tarifa7: 21.30, tarifa8: 24.60, category: 'cercanias' },
    { name: 'Cuartillos', km: 17, tarifa7: 24.14, tarifa8: 27.88, category: 'cercanias' },
    { name: 'Ford Electrónica', km: 25, tarifa7: 35.50, tarifa8: 41.00, category: 'cercanias' },
    { name: 'La Ina', km: 23, tarifa7: 32.66, tarifa8: 37.72, category: 'cercanias' },
    { name: 'Mesas de Asta', km: 23, tarifa7: 32.66, tarifa8: 37.72, category: 'cercanias' },
    { name: 'Nueva Jarilla', km: 15, tarifa7: 21.30, tarifa8: 24.60, category: 'cercanias' },
    { name: 'Poblado Doña Blanca', km: 26, tarifa7: 36.92, tarifa8: 42.64, category: 'cercanias' },
    // Ventas
    { name: 'Venta Andrés', km: 36, tarifa7: 51.12, tarifa8: 59.04, category: 'ventas' },
    { name: 'Venta Antonio', km: 20, tarifa7: 28.40, tarifa8: 32.80, category: 'ventas' },
    { name: 'Venta La Cartuja', km: 19, tarifa7: 26.98, tarifa8: 31.16, category: 'ventas' },
    { name: 'Venta Faisán Dorado', km: 30, tarifa7: 42.60, tarifa8: 49.20, category: 'ventas' },
    { name: 'Venta La Molinera', km: 45, tarifa7: 63.90, tarifa8: 73.80, category: 'ventas' },
    // Playas
    { name: 'Playa La Ballena', km: 42, tarifa7: 59.64, tarifa8: 68.88, category: 'playas' },
    { name: 'Playa La Barrosa', km: 65, tarifa7: 92.30, tarifa8: 106.60, category: 'playas' },
    { name: 'Caños de Meca', km: 87, tarifa7: 123.54, tarifa8: 142.68, category: 'playas' },
    { name: 'Fuentebravía', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'playas' },
    { name: 'El Palmar', km: 79, tarifa7: 112.18, tarifa8: 129.56, category: 'playas' },
    { name: 'Valdelagrana', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'playas' },
    { name: 'Zahora', km: 85, tarifa7: 120.70, tarifa8: 139.40, category: 'playas' },
    // Hoteles
    { name: 'Hotel Montecastillo', km: 16, tarifa7: 22.72, tarifa8: 26.24, category: 'hoteles' },
    { name: 'Hotel Monasterio', km: 27, tarifa7: 38.34, tarifa8: 44.28, category: 'hoteles' },
    { name: 'Hotel Novo Sancti Petri', km: 65, tarifa7: 92.30, tarifa8: 106.60, category: 'hoteles' },
    { name: 'Hotel Fuerte Conil', km: 75, tarifa7: 106.50, tarifa8: 123.00, category: 'hoteles' },
    { name: 'Hotel Playa de la Luz', km: 40, tarifa7: 56.80, tarifa8: 65.60, category: 'hoteles' }
];

// City fares (origin: Jerez Ciudad)
export const CITY_FARES: FareDestination[] = [
    // General destinations
    { name: 'Albacete', km: 570, tarifa7: 809.40, tarifa8: 934.80, category: 'general' },
    { name: 'Alcalá de Guadaira', km: 100, tarifa7: 142.00, tarifa8: 164.00, category: 'general' },
    { name: 'Alcalá de los Gazules', km: 55, tarifa7: 78.10, tarifa8: 90.20, category: 'general' },
    { name: 'Algeciras', km: 105, tarifa7: 149.10, tarifa8: 172.20, category: 'general' },
    { name: 'Arcos de la Frontera', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'general' },
    { name: 'Barbate', km: 80, tarifa7: 113.60, tarifa8: 131.20, category: 'general' },
    { name: 'Barcelona', km: 1086, tarifa7: 1542.12, tarifa8: 1781.04, category: 'general' },
    { name: 'Benalmádena', km: 212, tarifa7: 301.04, tarifa8: 347.68, category: 'general' },
    { name: 'Cádiz', km: 38, tarifa7: 53.96, tarifa8: 62.32, category: 'general' },
    { name: 'Chiclana', km: 45, tarifa7: 63.90, tarifa8: 73.80, category: 'general' },
    { name: 'Chipiona', km: 34, tarifa7: 48.28, tarifa8: 55.76, category: 'general' },
    { name: 'Conil', km: 62, tarifa7: 88.04, tarifa8: 101.68, category: 'general' },
    { name: 'Córdoba', km: 210, tarifa7: 298.20, tarifa8: 344.40, category: 'general' },
    { name: 'Dos Hermanas', km: 90, tarifa7: 127.80, tarifa8: 147.60, category: 'general' },
    { name: 'El Cuervo', km: 26, tarifa7: 36.92, tarifa8: 42.64, category: 'general' },
    { name: 'El Puerto de Santa María', km: 16, tarifa7: 22.72, tarifa8: 26.24, category: 'general' },
    { name: 'Estepona', km: 143, tarifa7: 203.06, tarifa8: 234.52, category: 'general' },
    { name: 'Fuengirola', km: 202, tarifa7: 286.84, tarifa8: 331.28, category: 'general' },
    { name: 'Gibraltar', km: 113, tarifa7: 160.46, tarifa8: 185.32, category: 'general' },
    { name: 'Granada', km: 265, tarifa7: 376.30, tarifa8: 434.60, category: 'general' },
    { name: 'Grazalema', km: 85, tarifa7: 120.70, tarifa8: 139.40, category: 'general' },
    { name: 'Huelva', km: 182, tarifa7: 258.44, tarifa8: 298.48, category: 'general' },
    { name: 'La Línea', km: 110, tarifa7: 156.20, tarifa8: 180.40, category: 'general' },
    { name: 'Lebrija', km: 35, tarifa7: 49.70, tarifa8: 57.40, category: 'general' },
    { name: 'Madrid', km: 635, tarifa7: 901.70, tarifa8: 1041.40, category: 'general' },
    { name: 'Málaga', km: 228, tarifa7: 323.76, tarifa8: 373.92, category: 'general' },
    { name: 'Marbella', km: 171, tarifa7: 242.82, tarifa8: 280.44, category: 'general' },
    { name: 'Medina Sidonia', km: 36, tarifa7: 51.12, tarifa8: 59.04, category: 'general' },
    { name: 'Olvera', km: 100, tarifa7: 142.00, tarifa8: 164.00, category: 'general' },
    { name: 'Puerto Real', km: 23, tarifa7: 32.66, tarifa8: 37.72, category: 'general' },
    { name: 'Ronda', km: 125, tarifa7: 177.50, tarifa8: 205.00, category: 'general' },
    { name: 'Rota', km: 32, tarifa7: 45.44, tarifa8: 52.48, category: 'general' },
    { name: 'San Fernando', km: 40, tarifa7: 56.80, tarifa8: 65.60, category: 'general' },
    { name: 'Sanlúcar de Barrameda', km: 28, tarifa7: 39.76, tarifa8: 45.92, category: 'general' },
    { name: 'Sevilla', km: 105, tarifa7: 149.10, tarifa8: 172.20, category: 'general' },
    { name: 'Sevilla Aeropuerto', km: 112, tarifa7: 159.04, tarifa8: 183.68, category: 'general' },
    { name: 'Sotogrande', km: 120, tarifa7: 170.40, tarifa8: 196.80, category: 'general' },
    { name: 'Tarifa', km: 120, tarifa7: 170.40, tarifa8: 196.80, category: 'general' },
    { name: 'Torremolinos', km: 216, tarifa7: 306.72, tarifa8: 354.24, category: 'general' },
    { name: 'Trebujena', km: 23, tarifa7: 32.66, tarifa8: 37.72, category: 'general' },
    { name: 'Ubrique', km: 78, tarifa7: 110.76, tarifa8: 127.92, category: 'general' },
    { name: 'Utrera', km: 74, tarifa7: 105.08, tarifa8: 121.36, category: 'general' },
    { name: 'Valencia', km: 758, tarifa7: 1076.36, tarifa8: 1243.12, category: 'general' },
    { name: 'Vejer de la Frontera', km: 72, tarifa7: 102.24, tarifa8: 118.08, category: 'general' },
    { name: 'Villamartín', km: 55, tarifa7: 78.10, tarifa8: 90.20, category: 'general' },
    { name: 'Zahara de los Atunes', km: 90, tarifa7: 127.80, tarifa8: 147.60, category: 'general' },
    // Cercanías
    { name: 'Aqualand', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Casino Bahía de Cádiz', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Circuito de Velocidad', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Cuartillos', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Ford Electrónica', km: 16, tarifa7: 22.72, tarifa8: 26.24, category: 'cercanias' },
    { name: 'La Ina', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Mesas de Asta', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    { name: 'Nueva Jarilla', km: 17, tarifa7: 24.14, tarifa8: 27.88, category: 'cercanias' },
    { name: 'Poblado Doña Blanca', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'cercanias' },
    // Ventas
    { name: 'Venta Andrés', km: 24, tarifa7: 34.08, tarifa8: 39.36, category: 'ventas' },
    { name: 'Venta Antonio', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'ventas' },
    { name: 'Venta La Cartuja', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'ventas' },
    { name: 'Venta Faisán Dorado', km: 23, tarifa7: 32.66, tarifa8: 37.72, category: 'ventas' },
    { name: 'Venta La Molinera', km: 39, tarifa7: 55.38, tarifa8: 63.96, category: 'ventas' },
    // Playas
    { name: 'Playa La Ballena', km: 30, tarifa7: 42.60, tarifa8: 49.20, category: 'playas' },
    { name: 'Playa La Barrosa', km: 52, tarifa7: 73.84, tarifa8: 85.28, category: 'playas' },
    { name: 'Caños de Meca', km: 75, tarifa7: 106.50, tarifa8: 123.00, category: 'playas' },
    { name: 'Fuentebravía', km: 25, tarifa7: 35.50, tarifa8: 41.00, category: 'playas' },
    { name: 'El Palmar', km: 67, tarifa7: 95.14, tarifa8: 109.88, category: 'playas' },
    { name: 'Valdelagrana', km: 22, tarifa7: 31.24, tarifa8: 36.08, category: 'playas' },
    { name: 'Zahora', km: 72, tarifa7: 102.24, tarifa8: 118.08, category: 'playas' },
    // Hoteles
    { name: 'Hotel Montecastillo', km: 12, tarifa7: 17.04, tarifa8: 19.68, category: 'hoteles' },
    { name: 'Hotel Monasterio', km: 15, tarifa7: 21.30, tarifa8: 24.60, category: 'hoteles' },
    { name: 'Hotel Novo Sancti Petri', km: 52, tarifa7: 73.84, tarifa8: 85.28, category: 'hoteles' },
    { name: 'Hotel Fuerte Conil', km: 59, tarifa7: 83.78, tarifa8: 96.76, category: 'hoteles' },
    { name: 'Hotel Playa de la Luz', km: 33, tarifa7: 46.86, tarifa8: 54.12, category: 'hoteles' }
];

// Get fares based on origin
export const getFares = (origin: 'airport' | 'city'): FareDestination[] => {
    return origin === 'airport' ? AIRPORT_FARES : CITY_FARES;
};

// Search destinations
export const searchDestinations = (
    query: string,
    origin: 'airport' | 'city',
    category?: string
): FareDestination[] => {
    const fares = getFares(origin);
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return fares.filter(fare => {
        const nameMatch = fare.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .includes(normalizedQuery);
        const categoryMatch = !category || category === 'all' || fare.category === category;
        return nameMatch && categoryMatch;
    });
};
