import { describe, it, expect } from 'vitest';
import { calculateFare } from './routingService';

describe('routingService - calculateFare', () => {
    it('should calculate Tarifa 7 correctly with doubled rate and no flag drop', () => {
        // Tarifa 7: 0.71 * 2 = 1.42 €/km
        const distance = 10;
        const result = calculateFare(distance, 'tarifa7');

        expect(result.distance).toBe(distance);
        expect(result.bajadaBandera).toBe(0);
        expect(result.totalFare).toBeCloseTo(14.2, 2);
        expect(result.tariffLabel).toBe('Tarifa 7 - Interurbana');
    });

    it('should calculate Tarifa 8 correctly with doubled rate and no flag drop', () => {
        // Tarifa 8: 0.82 * 2 = 1.64 €/km
        const distance = 10;
        const result = calculateFare(distance, 'tarifa8');

        expect(result.distance).toBe(distance);
        expect(result.bajadaBandera).toBe(0);
        expect(result.totalFare).toBeCloseTo(16.4, 2);
        expect(result.tariffLabel).toBe('Tarifa 8 - Interurbana');
    });

    it('should calculate long distance correctly', () => {
        // Albacete (Airport): 540 km * 1.42 = 766.8
        const distance = 540;
        const result = calculateFare(distance, 'tarifa7');

        expect(result.totalFare).toBeCloseTo(766.8, 2);
    });
});
