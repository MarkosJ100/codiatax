import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFinanceData } from './useFinanceData';
import { Service, Expense, MileageLog } from '../types';

describe('useFinanceData', () => {
    // We use Fixed Dates to avoid test failures due to current time
    const now = new Date(2024, 0, 15, 12, 0, 0); // Jan 15, 2024 (a Monday)

    const mockServices: Service[] = [
        { id: 1, amount: 100, type: 'normal', timestamp: '2024-01-15T10:00:00' } as any,
        { id: 2, amount: 50, type: 'company', timestamp: '2024-01-15T11:00:00' } as any,
        { id: 3, amount: 200, type: 'normal', timestamp: '2023-12-15T10:00:00' } as any, // Different month
    ];
    const mockExpenses: Expense[] = [
        { id: 101, amount: 30, category: 'fuel', timestamp: '2024-01-15T10:00:00', description: 'Gasolina' } as any
    ];
    const mockLogs: MileageLog[] = [
        { id: 1001, amount: 100, timestamp: '2024-01-15T10:00:00' }
    ];

    it('should calculate totals for "day" period', () => {
        const { result } = renderHook(() => useFinanceData(mockServices, mockExpenses, mockLogs, 'day', now));
        expect(result.current.grossIncome).toBe(150);
        expect(result.current.netIncome).toBe(120);
    });

    it('should calculate totals for "month" period including items from different days same month', () => {
        const { result } = renderHook(() => useFinanceData(mockServices, mockExpenses, mockLogs, 'month', now));
        // Only Jan 2024 items
        expect(result.current.grossIncome).toBe(150);
    });

    it('should calculate totals for "year" period', () => {
        const { result } = renderHook(() => useFinanceData(mockServices, mockExpenses, mockLogs, 'year', now));
        // Only 2024 items
        expect(result.current.grossIncome).toBe(150);
    });

    it('should react to change in data', () => {
        const { result, rerender } = renderHook(({ services }) => useFinanceData(services, [], [], 'day', now), {
            initialProps: { services: mockServices }
        });

        expect(result.current.grossIncome).toBe(150);

        rerender({ services: [{ id: 4, amount: 500, type: 'normal', timestamp: '2024-01-15T10:00:00' } as any] });
        expect(result.current.grossIncome).toBe(500);
    });
});
