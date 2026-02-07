// Routing Service using OSRM (Open Source Routing Machine)
// Free API - no key required
// https://router.project-osrm.org/

export interface RouteResult {
    distance: number; // in kilometers
    duration: number; // in minutes
    geometry?: [number, number][]; // Array of [lat, lng] points
    success: boolean;
    error?: string;
}

export interface Coordinates {
    lat: number;
    lng: number;
}

// Calculate route between two points using OSRM
export const calculateRoute = async (
    origin: Coordinates,
    destination: Coordinates
): Promise<RouteResult> => {
    try {
        // OSRM expects coordinates as lng,lat (not lat,lng!)
        // Asking for geometries=geojson to get coordinate array
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            return {
                distance: 0,
                duration: 0,
                success: false,
                error: 'No se pudo calcular la ruta'
            };
        }

        const route = data.routes[0];

        // Convert [lng, lat] from OSRM to [lat, lng] for Leaflet
        const geometry = route.geometry?.coordinates?.map((coord: [number, number]) => [coord[1], coord[0]]) || [];

        return {
            distance: route.distance / 1000, // Convert meters to km
            duration: route.duration / 60,    // Convert seconds to minutes
            geometry: geometry,
            success: true
        };
    } catch (error) {
        console.error('Error calculating route:', error);
        return {
            distance: 0,
            duration: 0,
            success: false,
            error: 'Error de conexión al servicio de rutas'
        };
    }
};

// Geocoding using Nominatim (OpenStreetMap)
export interface GeocodingResult {
    lat: number;
    lng: number;
    displayName: string;
    success: boolean;
    error?: string;
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult> => {
    try {
        // Add "Spain" to improve results for Spanish locations
        const query = `${address}, Cádiz, Spain`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CodiataxApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return {
                lat: 0,
                lng: 0,
                displayName: '',
                success: false,
                error: 'Dirección no encontrada'
            };
        }

        const result = data[0];

        return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            displayName: result.display_name,
            success: true
        };
    } catch (error) {
        console.error('Error geocoding address:', error);
        return {
            lat: 0,
            lng: 0,
            displayName: '',
            success: false,
            error: 'Error de conexión al servicio de geocodificación'
        };
    }
};

// Reverse Geocoding - convert coordinates to address
export interface ReverseGeocodingResult {
    displayName: string;
    street: string;
    city: string;
    success: boolean;
    error?: string;
}

export const reverseGeocode = async (coords: Coordinates): Promise<ReverseGeocodingResult> => {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CodiataxApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.error) {
            return {
                displayName: '',
                street: '',
                city: '',
                success: false,
                error: 'Dirección no encontrada'
            };
        }

        const address = data.address || {};
        const street = address.road || address.pedestrian || address.footway || '';
        const houseNumber = address.house_number || '';
        const city = address.city || address.town || address.village || address.municipality || '';

        // Build readable address
        let streetFull = street;
        if (houseNumber) streetFull += ` ${houseNumber}`;

        return {
            displayName: data.display_name,
            street: streetFull,
            city: city,
            success: true
        };
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return {
            displayName: '',
            street: '',
            city: '',
            success: false,
            error: 'Error de conexión'
        };
    }
};

// Get location suggestions for autocomplete
export interface LocationSuggestion {
    displayName: string;
    lat: number;
    lng: number;
}

export const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
    if (!query || query.length < 3) return [];

    try {
        // Search in Cadiz, Spain to prioritize local results
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=es&viewbox=-6.4,36.9,-5.8,36.4&bounded=0`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'CodiataxApp/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        return data.map((item: any) => ({
            displayName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }));
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
};

// Calculate taxi fare based on distance and tariff
export interface FareCalculation {
    distance: number;
    duration: number;
    bajadaBandera: number;
    distanceCost: number;
    totalFare: number;
    tariffType: 'tarifa7' | 'tarifa8';
    tariffLabel: string;
}

export const calculateFare = (
    distanceKm: number,
    tariffType: 'tarifa7' | 'tarifa8'
): FareCalculation => {
    // Tariff rates from BOJA 2025 (Interurban rules)
    // Rate is doubled to cover the return trip
    const tariffs = {
        tarifa7: {
            pricePerKm: 0.71 * 2, // 1.42 €/km
            label: 'Tarifa 7 - Interurbana'
        },
        tarifa8: {
            pricePerKm: 0.82 * 2, // 1.64 €/km
            label: 'Tarifa 8 - Interurbana'
        }
    };

    const tariff = tariffs[tariffType];
    const totalFare = distanceKm * tariff.pricePerKm;

    return {
        distance: distanceKm,
        duration: 0,
        bajadaBandera: 0, // Interurban calculated as km x price (includes return)
        distanceCost: totalFare,
        totalFare: totalFare,
        tariffType: tariffType,
        tariffLabel: tariff.label
    };
};
