import { describe, it, expect } from 'vitest';
import { calculateAirportCycle, filterFutureAssignments } from './airportLogic';

describe('airportLogic', () => {
    describe('calculateAirportCycle', () => {
        it('should generate 9 assignments every 11 days', () => {
            const startDate = '2024-12-15';
            const userName = 'TestUser';
            const assignments = calculateAirportCycle(startDate, userName);

            expect(assignments).toHaveLength(9);
            expect(assignments[0].date).toBe('2024-12-15');
            expect(assignments[1].date).toBe('2024-12-26'); // 15 + 11
            expect(assignments[2].date).toBe('2025-01-06'); // 26 + 11
            expect(assignments[0].userId).toBe(userName);
        });

        it('should return empty array for invalid date', () => {
            const assignments = calculateAirportCycle('invalid-date', 'User');
            expect(assignments).toHaveLength(0);
        });
    });

    describe('filterFutureAssignments', () => {
        it('should remove assignments from specific date onwards for a user', () => {
            const assignments = [
                { date: '2024-12-01', userId: 'User1', type: 'standard' },
                { date: '2024-12-15', userId: 'User1', type: 'standard' },
                { date: '2024-12-20', userId: 'User2', type: 'standard' }
            ];

            const filtered = filterFutureAssignments(assignments, 'User1', '2024-12-15');

            expect(filtered).toHaveLength(2);
            expect(filtered.find(a => a.date === '2024-12-01')).toBeDefined();
            expect(filtered.find(a => a.date === '2024-12-15')).toBeUndefined();
            expect(filtered.find(a => a.userId === 'User2')).toBeDefined();
        });
    });
});
