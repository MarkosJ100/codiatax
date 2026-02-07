// Fuel Prices Service for Jerez de la Frontera
// Data source: Ministerio de Industria y Turismo - https://datos.gob.es

const JEREZ_MUNICIPALITY_ID = '1782';
const BASE_URL = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes';

export interface FuelStation {
    id: string;
    name: string;
    address: string;
    schedule: string;
    dieselA: number | null;
    gasoline95: number | null;
    gasolinePremium: number | null;
    latitude: number;
    longitude: number;
}

export interface FuelPricesData {
    stations: FuelStation[];
    cheapestDiesel: FuelStation | null;
    cheapestGasoline: FuelStation | null;
    lastUpdate: string;
}

const parsePrice = (priceStr: string): number | null => {
    if (!priceStr || priceStr.trim() === '') return null;
    const parsed = parseFloat(priceStr.replace(',', '.'));
    return isNaN(parsed) ? null : parsed;
};

export const fetchFuelPrices = async (): Promise<FuelPricesData | null> => {
    try {
        const response = await fetch(
            `${BASE_URL}/EstacionesTerrestres/FiltroMunicipio/${JEREZ_MUNICIPALITY_ID}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.ResultadoConsulta !== 'OK' || !data.ListaEESSPrecio) {
            return null;
        }

        const stations: FuelStation[] = data.ListaEESSPrecio.map((station: Record<string, string>) => ({
            id: station['IDEESS'] || Math.random().toString(),
            name: station['Rótulo'] || 'Desconocida',
            address: station['Dirección'] || '',
            schedule: station['Horario'] || '',
            dieselA: parsePrice(station['Precio Gasoleo A']),
            gasoline95: parsePrice(station['Precio Gasolina 95 E5']),
            gasolinePremium: parsePrice(station['Precio Gasoleo Premium']),
            latitude: parseFloat((station['Latitud'] || '0').replace(',', '.')),
            longitude: parseFloat((station['Longitud (WGS84)'] || '0').replace(',', '.'))
        }));

        // Filter out stations without prices
        const stationsWithDiesel = stations.filter(s => s.dieselA !== null);
        const stationsWithGasoline = stations.filter(s => s.gasoline95 !== null);

        // Sort by price
        stationsWithDiesel.sort((a, b) => (a.dieselA || 999) - (b.dieselA || 999));
        stationsWithGasoline.sort((a, b) => (a.gasoline95 || 999) - (b.gasoline95 || 999));

        return {
            stations: stationsWithDiesel,
            cheapestDiesel: stationsWithDiesel[0] || null,
            cheapestGasoline: stationsWithGasoline[0] || null,
            lastUpdate: data.Fecha || new Date().toLocaleString('es-ES')
        };
    } catch (error) {
        console.error('Error fetching fuel prices:', error);
        return null;
    }
};

// Cache fuel prices in localStorage with 4-hour expiry
const CACHE_KEY = 'codiatax_fuel_prices';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

export const getCachedFuelPrices = async (): Promise<FuelPricesData | null> => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (e) {
        // Ignore cache errors
    }

    // Fetch fresh data
    const freshData = await fetchFuelPrices();
    if (freshData) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: freshData,
            timestamp: Date.now()
        }));
    }

    return freshData;
};
