import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShiftLogic } from './useShiftLogic';
import { ShiftStorage } from '../types';

describe('useShiftLogic', () => {
    const mockStorage: ShiftStorage = {
        assignments: [
            { date: '2024-12-01', userId: 'marti', type: 'standard' },
            { date: '2024-12-15', userId: 'marti', type: 'standard' },
            { date: '2024-12-20', userId: 'other', type: 'standard' }
        ],
        restDays: ['2024-12-05'],
        userConfigs: [
            { userName: 'marti', shiftWeek: 'A', shiftType: 'mañana', startTime: '06:00', endTime: '15:00' },
            { userName: 'other', shiftWeek: 'B', shiftType: 'tarde', startTime: '15:00', endTime: '23:00' }
        ]
    };

    it('should filter assignments for the correct user', () => {
        const { result } = renderHook(() => useShiftLogic(mockStorage, 'marti'));
        expect(result.current.userAssignments).toHaveLength(2);
        expect(result.current.userAssignments.every(a => a.userId === 'marti')).toBe(true);
    });

    it('should detect collisions correctly', () => {
        const { result } = renderHook(() => useShiftLogic(mockStorage, 'marti'));
        // "other" has week B tarde. If "marti" checks week B tarde, it should return "other".
        expect(result.current.checkCollision('B', 'tarde')).toBe('other');
        // Week A mañana is "marti" itself, so it should return null because c.userName !== userName
        expect(result.current.checkCollision('A', 'mañana')).toBe(null);
    });

    it('should handle undefined user gracefully', () => {
        const { result } = renderHook(() => useShiftLogic(mockStorage, undefined));
        expect(result.current.userAssignments).toHaveLength(0);
        expect(result.current.checkCollision('B', 'tarde')).toBe(null);
    });
});
