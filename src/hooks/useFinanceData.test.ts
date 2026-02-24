import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFinanceData } from './useFinanceData';
import { Service, Expense, MileageLog } from '../types';

describe('useFinanceData', () => {
    const now = new Date('2024-12-15T12:00:00Z');
    const mockServices: Service[] = [
        { id: 1, amount: 100, type: 'normal', timestamp: now.toISOString() },
        { id: 2, amount: 50, type: 'company', timestamp: now.toISOString() }
    ];
    const mockExpenses: Expense[] = [
        { id: 1, amount: 30, category: 'fuel', timestamp: now.toISOString(), description: 'Gasolina' }
    ];
    const mockLogs: MileageLog[] = [
        { id: 1, amount: 100, timestamp: now.toISOString() }
    ];

    it('should calculate standard totals correctly', () => {
        const { result } = renderHook(() => useFinanceData(mockServices, mockExpenses, mockLogs, 'day', now));

        expect(result.current.grossIncome).toBe(150);
        expect(result.current.totalExpenses).toBe(30);
        expect(result.current.netIncome).toBe(120);
        expect(result.current.totalKms).toBe(100);
    });

    it('should handle empty data', () => {
        const { result } = renderHook(() => useFinanceData([], [], [], 'day'));

        expect(result.current.grossIncome).toBe(0);
        expect(result.current.totalExpenses).toBe(0);
        expect(result.current.netIncome).toBe(0);
        expect(result.current.totalKms).toBe(0);
    });
});
