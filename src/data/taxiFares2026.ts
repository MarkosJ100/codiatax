// Taxi Fare Data for Jerez de la Frontera 2026
// Source: Resolución 4 febrero 2026, Dirección General de Tributos, Financiación,
// Relaciones Financieras con las Corporaciones Locales y Juego (BOJA nº 32, 17/02/2026)

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

// Urban Tariff configuration (Jerez Town - BOJA 2026)
export const URBAN_TARIFFS: Record<string, TariffInfo> = {
    tarifa7: {
        type: 'tarifa7',
        label: 'Tarifa 1 - Urbana',
        description: 'Lunes a Viernes, 7:00-21:00',
        pricePerKm: 0.88,
        bajadaBandera: 1.52,
        hourlyWait: 21.46,
        minPerception: 4.26,
        wait15min: 5.36
    },
    tarifa8: {
        type: 'tarifa8',
        label: 'Tarifa 2 - Urbana',
        description: 'Sábados, Festivos y Nocturna',
        pricePerKm: 1.11,
        bajadaBandera: 1.89,
        hourlyWait: 26.83,
        minPerception: 5.35,
        wait15min: 6.70
    }
};

// Interurban Tariff configuration (Andalucía - No change)
export const INTERURBAN_TARIFFS: Record<string, TariffInfo> = {
    tarifa7: {
        type: 'tarifa7',
        label: 'Tarifa 7 - Interurbana',
        description: 'Diurna interurbana',
        pricePerKm: 0.71,
        bajadaBandera: 0,
        hourlyWait: 0,
        minPerception: 0,
        wait15min: 0
    },
    tarifa8: {
        type: 'tarifa8',
        label: 'Tarifa 8 - Interurbana',
        description: 'Nocturna/Festiva interurbana',
        pricePerKm: 0.82,
        bajadaBandera: 0,
        hourlyWait: 0,
        minPerception: 0,
        wait15min: 0
    }
};

export const TARIFFS = URBAN_TARIFFS; // Default

// Holidays for 2026
const HOLIDAYS_2026 = [
    '2026-01-01', // Año Nuevo
    '2026-01-06', // Reyes Magos
    '2026-02-28', // Día de Andalucía
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
    '2026-05-07', // Feria de Jerez (local estimada)
    '2026-05-08', // Feria de Jerez
    '2026-05-09', // Feria de Jerez
    '2026-05-10', // Feria de Jerez
    '2026-05-11', // Feria de Jerez
    '2026-08-15', // Asunción de la Virgen
    '2026-09-08', // Virgen de la Merced (local Jerez)
    '2026-10-12', // Fiesta Nacional de España
    '2026-11-01', // Todos los Santos
    '2026-12-06', // Día de la Constitución
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
];

const ALL_HOLIDAYS = [...HOLIDAYS_2026];

const isHoliday = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return ALL_HOLIDAYS.includes(dateStr);
};

export const getCurrentTariff = (date: Date = new Date()): TariffInfo => {
    const day = date.getDay();
    const hour = date.getHours();

    // Tarifa 2: weekends, holidays, or night hours (21:00-7:00 per BOJA 2026)
    if (day === 0 || day === 6 || isHoliday(date) || hour >= 21 || hour < 7) {
        return TARIFFS.tarifa8;
    }
    return TARIFFS.tarifa7;
};

export const getTariffReason = (date: Date = new Date()): string => {
    const day = date.getDay();
    const hour = date.getHours();

    if (isHoliday(date)) return 'Día festivo';
    if (day === 0) return 'Domingo';
    if (day === 6) return 'Sábado';
    if (hour >= 21 || hour < 7) return 'Horario nocturno (21h-7h)';
    return 'Día laborable';
};

export const CATEGORIES = [
    { id: 'general', label: '📍 Destinos Generales' },
    { id: 'cercanias', label: '🏘️ Cercanías / Rural' },
    { id: 'ventas', label: '🍽️ Ventas' },
    { id: 'playas', label: '🏖️ Playas' },
    { id: 'hoteles', label: '🏨 Hoteles' }
];

// Helper to determine if a destination is interurban or fixed BOJA
const isInterurban = (category: string) => category === 'general';

const calc = (km: number, tariff: 1 | 2, category: string) => {
    if (isInterurban(category)) {
        const rate = tariff === 1 ? 0.71 : 0.82;
        return parseFloat((km * rate * 2).toFixed(2));
    }
    // For local/rural (if any km-based calculation were needed, 
    // but BOJA provides fixed prices for these).
    const rate = tariff === 1 ? 0.88 : 1.11;
    return parseFloat((km * rate).toFixed(2)); // Urban calculation is usually different
};

// Airport Fares (2026)
export const AIRPORT_FARES: FareDestination[] = [
    { name: 'Cádiz', km: 45, tarifa7: calc(45, 1, 'general'), tarifa8: calc(45, 2, 'general'), category: 'general' },
    { name: 'Sevilla', km: 105, tarifa7: calc(105, 1, 'general'), tarifa8: calc(105, 2, 'general'), category: 'general' },
    { name: 'Sevilla Aeropuerto', km: 110, tarifa7: calc(110, 1, 'general'), tarifa8: calc(110, 2, 'general'), category: 'general' },
    { name: 'El Puerto de Santa María', km: 30, tarifa7: calc(30, 1, 'general'), tarifa8: calc(30, 2, 'general'), category: 'general' },
    { name: 'Sanlúcar de Barrameda', km: 37, tarifa7: calc(37, 1, 'general'), tarifa8: calc(37, 2, 'general'), category: 'general' },
    { name: 'Rota', km: 40, tarifa7: calc(40, 1, 'general'), tarifa8: calc(40, 2, 'general'), category: 'general' },
    { name: 'Chipiona', km: 42, tarifa7: calc(42, 1, 'general'), tarifa8: calc(42, 2, 'general'), category: 'general' },
    { name: 'Arcos de la Frontera', km: 37, tarifa7: calc(37, 1, 'general'), tarifa8: calc(37, 2, 'general'), category: 'general' },
    { name: 'Conil', km: 75, tarifa7: calc(75, 1, 'general'), tarifa8: calc(75, 2, 'general'), category: 'general' },
    { name: 'Barbate', km: 100, tarifa7: calc(100, 1, 'general'), tarifa8: calc(100, 2, 'general'), category: 'general' },
    { name: 'Tarifa', km: 130, tarifa7: calc(130, 1, 'general'), tarifa8: calc(130, 2, 'general'), category: 'general' },
    { name: 'Sotogrande', km: 130, tarifa7: calc(130, 1, 'general'), tarifa8: calc(130, 2, 'general'), category: 'general' },
    { name: 'Algeciras', km: 110, tarifa7: calc(110, 1, 'general'), tarifa8: calc(110, 2, 'general'), category: 'general' },

    // ELAS (Fixed prices from BOJA 2026)
    { name: 'El Torno', km: 26, tarifa7: 26.89, tarifa8: 33.52, category: 'cercanias' },
    { name: 'Estella del Marqués', km: 10, tarifa7: 10.67, tarifa8: 13.31, category: 'cercanias' },
    { name: 'La Barca de la Florida', km: 30, tarifa7: 29.93, tarifa8: 37.31, category: 'cercanias' },
    { name: 'Nueva Jarilla', km: 23, tarifa7: 23.69, tarifa8: 29.53, category: 'cercanias' },
    { name: 'San Isidro del Guadalete', km: 25, tarifa7: 25.42, tarifa8: 31.69, category: 'cercanias' },
    { name: 'Torrecera', km: 30, tarifa7: 29.93, tarifa8: 37.31, category: 'cercanias' },

    // Rural Barrios (Fixed prices from BOJA 2026)
    { name: 'Cuartillos', km: 16, tarifa7: 16.78, tarifa8: 20.92, category: 'cercanias' },
    { name: 'El Mojo Gallardo', km: 27, tarifa7: 27.40, tarifa8: 34.17, category: 'cercanias' },
    { name: 'El Portal', km: 9, tarifa7: 9.21, tarifa8: 11.50, category: 'cercanias' },
    { name: 'Gibalbín', km: 40, tarifa7: 39.75, tarifa8: 49.57, category: 'cercanias' },
    { name: 'La Corta', km: 9, tarifa7: 9.48, tarifa8: 11.82, category: 'cercanias' },
    { name: 'La Ina', km: 17, tarifa7: 17.46, tarifa8: 21.76, category: 'cercanias' },
    { name: 'Las Pachecas', km: 16, tarifa7: 16.91, tarifa8: 21.09, category: 'cercanias' },
    { name: 'Las Tablas', km: 13, tarifa7: 13.87, tarifa8: 17.28, category: 'cercanias' },
    { name: 'Lomopardo', km: 12, tarifa7: 12.01, tarifa8: 14.97, category: 'cercanias' },
    { name: 'Albarizones', km: 8, tarifa7: 8.16, tarifa8: 10.18, category: 'cercanias' },
    { name: 'Majarromaque', km: 34, tarifa7: 34.18, tarifa8: 42.62, category: 'cercanias' },
    { name: 'Mesas de Asta', km: 24, tarifa7: 24.35, tarifa8: 30.36, category: 'cercanias' },
    { name: 'Mesas de Santa Rosa', km: 11, tarifa7: 11.34, tarifa8: 14.15, category: 'cercanias' },
    { name: 'Puente de la Guareña', km: 23, tarifa7: 23.56, tarifa8: 29.38, category: 'cercanias' },
    { name: 'Rajamancera', km: 20, tarifa7: 20.24, tarifa8: 25.23, category: 'cercanias' },
    { name: 'Torremelgarejo', km: 16, tarifa7: 16.12, tarifa8: 20.10, category: 'cercanias' },

    // Points of Interest
    { name: 'Aeropuerto <-> Circuito/Montecastillo', km: 16, tarifa7: 24.75, tarifa8: 30.86, category: 'hoteles' }
];

// City Fares (2026)
export const CITY_FARES: FareDestination[] = [
    { name: 'Cádiz', km: 38, tarifa7: calc(38, 1, 'general'), tarifa8: calc(38, 2, 'general'), category: 'general' },
    { name: 'Sevilla', km: 105, tarifa7: calc(105, 1, 'general'), tarifa8: calc(105, 2, 'general'), category: 'general' },
    { name: 'El Puerto de Santa María', km: 16, tarifa7: calc(16, 1, 'general'), tarifa8: calc(16, 2, 'general'), category: 'general' },
    { name: 'Sanlúcar de Barrameda', km: 28, tarifa7: calc(28, 1, 'general'), tarifa8: calc(28, 2, 'general'), category: 'general' },
    // Points of Interest
    { name: 'Ciudad <-> Circuito/Montecastillo', km: 12, tarifa7: 17.46, tarifa8: 21.76, category: 'hoteles' }
];

export const getFares = (origin: 'airport' | 'city'): FareDestination[] => {
    return origin === 'airport' ? AIRPORT_FARES : CITY_FARES;
};

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
