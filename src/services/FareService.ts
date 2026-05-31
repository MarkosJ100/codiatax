import {
    FareDestination,
    TariffInfo,
    getCurrentTariff as getRawTariff,
    getFares,
    searchDestinations as searchRawDestinations,
    INTERURBAN_TARIFFS
} from '../data/taxiFares2026';

/**
 * Fare Calculation result structure.
 */
export interface FareResult {
    distance: number;
    duration: number;
    bajadaBandera: number;
    distanceCost: number;
    totalFare: number;
    tariffType: 'tarifa7' | 'tarifa8';
    tariffLabel: string;
}

/**
 * Service to handle taxi fare business logic.
 * Decouples calculation and geolocation from React components.
 */
export const FareService = {
    /**
     * Calculates the Harversine distance between two points in km.
     */
    calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return parseFloat((R * c).toFixed(2));
    },

    /**
     * Gets the current tariff based on the provided date or now.
     */
    getCurrentTariff: (date: Date = new Date()): TariffInfo => {
        return getRawTariff(date);
    },

    /**
     * Determines the applicable price for a destination based on the current tariff.
     */
    getApplicablePrice: (fare: FareDestination, tariffType: 'tarifa7' | 'tarifa8'): number => {
        return tariffType === 'tarifa7' ? fare.tarifa7 : fare.tarifa8;
    },

    /**
     * Search and filter destinations based on query, origin and category.
     */
    searchDestinations: (
        query: string,
        origin: 'airport' | 'city',
        category: string = 'all'
    ): FareDestination[] => {
        return searchRawDestinations(query, origin, category);
    },

    /**
     * Formats a price into a localized currency string.
     */
    formatPrice: (price: number): string => {
        return price.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * Calculates interurban taxi fare based on distance and tariff.
     * Includes the return trip cost as per regulation.
     */
    calculateInterurbanFare: (
        distanceKm: number,
        tariffType: 'tarifa7' | 'tarifa8'
    ): FareResult => {
        const tariff = INTERURBAN_TARIFFS[tariffType];
        // Interurban rates are doubled to cover the return trip
        const pricePerKm = tariff.pricePerKm * 2;
        const totalFare = distanceKm * pricePerKm;

        return {
            distance: distanceKm,
            duration: 0,
            bajadaBandera: 0,
            distanceCost: totalFare,
            totalFare: totalFare,
            tariffType: tariffType,
            tariffLabel: tariff.label
        };
    },

    /**
     * Gets the price per km for interurban trips (doubled for return).
     */
    getInterurbanPricePerKm: (tariffType: 'tarifa7' | 'tarifa8'): number => {
        return INTERURBAN_TARIFFS[tariffType].pricePerKm * 2;
    }
};
