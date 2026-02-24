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
        userConfigs: []
    };

    it('should filter assignments for the correct user', () => {
        const { result } = renderHook(() => useShiftLogic(mockStorage, 'marti'));
        expect(result.current.userAssignments).toHaveLength(2);
        expect(result.current.userAssignments.every(a => a.userId === 'marti')).toBe(true);
    });

    it('should handle undefined user gracefully', () => {
        const { result } = renderHook(() => useShiftLogic(mockStorage, undefined));
        expect(result.current.userAssignments).toHaveLength(0);
    });

    it('should return empty list if no assignments exist', () => {
        const { result } = renderHook(() => useShiftLogic({ assignments: [] } as any, 'marti'));
        expect(result.current.userAssignments).toHaveLength(0);
    });
});
