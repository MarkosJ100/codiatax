import { describe, it, expect } from 'vitest';
import { FareService } from './FareService';

describe('FareService', () => {
    describe('calculateDistance', () => {
        it('should calculate correct distance between two known points', () => {
            // Jerez to El Puerto de Santa María approx
            const dist = FareService.calculateDistance(36.685, -6.126, 36.593, -6.232);
            expect(dist).toBeGreaterThan(10);
            expect(dist).toBeLessThan(20);
        });
    });

    describe('getCurrentTariff', () => {
        it('should return tarifa7 during weekday working hours', () => {
            // 2026-03-02 is a Monday
            const mondayNoon = new Date('2026-03-02T12:00:00');
            const tariff = FareService.getCurrentTariff(mondayNoon);
            expect(tariff.type).toBe('tarifa7');
        });

        it('should return tarifa8 during night hours', () => {
            const mondayNight = new Date('2026-03-02T23:00:00');
            const tariff = FareService.getCurrentTariff(mondayNight);
            expect(tariff.type).toBe('tarifa8');
        });

        it('should return tarifa8 during weekends', () => {
            // 2026-03-01 is a Sunday
            const sundayNoon = new Date('2026-03-01T12:00:00');
            const tariff = FareService.getCurrentTariff(sundayNoon);
            expect(tariff.type).toBe('tarifa8');
        });
    });

    describe('calculateInterurbanFare', () => {
        it('should calculate double price per km for return trip', () => {
            const distance = 100;
            // Tarifa 7 interurban is 0.71 -> 0.71 * 2 * 100 = 142
            const result = FareService.calculateInterurbanFare(distance, 'tarifa7');
            expect(result.totalFare).toBe(142);
        });
    });

    describe('formatPrice', () => {
        it('should format price with 2 decimals and comma', () => {
            const formatted = FareService.formatPrice(1234.5);
            // Flexible regex for separators
            expect(formatted).toMatch(/1?\.?234,50/);
        });
    });
});
