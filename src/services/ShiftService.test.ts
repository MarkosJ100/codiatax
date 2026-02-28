import { describe, it, expect } from 'vitest';
import { ShiftService } from './ShiftService';
import { UserShiftConfig } from '../types';

describe('ShiftService', () => {
    describe('toggleAssignment', () => {
        it('should add assignment if it does not exist', () => {
            const initial: any[] = [];
            const result = ShiftService.toggleAssignment(initial, '2024-12-25', 'user1');
            expect(result).toHaveLength(1);
            expect(result[0].date).toBe('2024-12-25');
        });

        it('should remove assignment if it exists', () => {
            const initial = [{ date: '2024-12-25', userId: 'user1', type: 'standard' }];
            const result = ShiftService.toggleAssignment(initial, '2024-12-25', 'user1');
            expect(result).toHaveLength(0);
        });
    });

    describe('getCollision', () => {
        it('should return the name of the user causing the collision', () => {
            const configs: UserShiftConfig[] = [
                { userName: 'Juan', shiftWeek: 'A', shiftType: 'mañana', startTime: '06:00', endTime: '15:00' }
            ];
            const collision = ShiftService.getCollision(configs, 'A', 'mañana', 'Pedro');
            expect(collision).toBe('Juan');
        });

        it('should return null if no collision exists', () => {
            const configs: UserShiftConfig[] = [
                { userName: 'Juan', shiftWeek: 'A', shiftType: 'mañana', startTime: '06:00', endTime: '15:00' }
            ];
            const collision = ShiftService.getCollision(configs, 'A', 'tarde', 'Pedro');
            expect(collision).toBeNull();
        });

        it('should return null if the collision is with the same user', () => {
            const configs: UserShiftConfig[] = [
                { userName: 'Juan', shiftWeek: 'A', shiftType: 'mañana', startTime: '06:00', endTime: '15:00' }
            ];
            const collision = ShiftService.getCollision(configs, 'A', 'mañana', 'Juan');
            expect(collision).toBeNull();
        });
    });
});
