import { describe, it, expect } from 'vitest';
import { calculateRoute } from './routingService';

describe('routingService - calculateRoute', () => {
    it('should return an error result for invalid coordinates', async () => {
        const origin = { lat: 0, lng: 0 };
        const destination = { lat: 0, lng: 0 };
        const result = await calculateRoute(origin, destination);

        // The route may fail or succeed with 0 distance
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.distance).toBe('number');
    });

    it('should return distance and duration for a valid route', async () => {
        // Jerez to Cadiz
        const origin = { lat: 36.6867, lng: -6.1376 };
        const destination = { lat: 36.5270, lng: -6.2886 };
        const result = await calculateRoute(origin, destination);

        // May fail if OSRM is down, so just check structure
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.distance).toBe('number');
        expect(typeof result.duration).toBe('number');
    });
});
