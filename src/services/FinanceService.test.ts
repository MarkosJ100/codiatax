import { describe, it, expect } from 'vitest';
import { FinanceService } from './FinanceService';
import { Service, Expense, MileageLog } from '../types';

describe('FinanceService', () => {
    describe('calculatePeriodTotals', () => {
        it('should calculate totals correctly for a given period', () => {
            // Use local dates to avoid timezone shifts with date-fns
            const now = new Date(2024, 0, 1, 12, 0, 0); // Jan 1st, 2024

            const mockServices: Service[] = [
                { id: 1, amount: 20, timestamp: '2024-01-01T10:00:00', type: 'normal' } as any,
                { id: 2, amount: 30, timestamp: '2024-01-01T11:00:00', type: 'company' } as any,
                { id: 3, amount: 40, timestamp: '2024-01-02T10:00:00', type: 'normal' } as any, // Different day
            ];
            const mockExpenses: Expense[] = [
                { id: 101, amount: 10, timestamp: '2024-01-01T10:00:00', category: 'gasoil' } as any,
            ];
            const mockMileage: MileageLog[] = [
                { id: 1001, amount: 100, timestamp: '2024-01-01T10:00:00', notes: '' },
            ];

            const totals = FinanceService.calculatePeriodTotals(mockServices, mockExpenses, mockMileage, 'day', now);

            expect(totals.grossIncome).toBe(50);
            expect(totals.taxiIncome).toBe(20);
            expect(totals.subscriberIncome).toBe(30);
            expect(totals.netIncome).toBe(40); // 50 - 10
            expect(totals.totalKms).toBe(100);
        });
    });

    describe('applySubscriberCap', () => {
        it('should return capped amount if service amount exceeds cap', () => {
            const result = FinanceService.applySubscriberCap(15, { isCapped: true, capAmount: 12 });
            expect(result).toBe(12);
        });

        it('should return original amount if service amount is below cap', () => {
            const result = FinanceService.applySubscriberCap(10, { isCapped: true, capAmount: 12 });
            expect(result).toBe(10);
        });

        it('should return original amount if subscriber is not capped', () => {
            const result = FinanceService.applySubscriberCap(15, { isCapped: false, capAmount: 12 });
            expect(result).toBe(15);
        });

        it('should return original amount if no subscriber info is provided', () => {
            const result = FinanceService.applySubscriberCap(15, undefined);
            expect(result).toBe(15);
        });
    });

    describe('calculateProfitability', () => {
        it('should calculate income per km correctly', () => {
            const result = FinanceService.calculateProfitability(100, 50);
            expect(result).toBe(2);
        });

        it('should return 0 if total kms are 0', () => {
            const result = FinanceService.calculateProfitability(0, 50);
            expect(result).toBe(0);
        });
    });

    describe('formatCurrency', () => {
        it('should format numbers as EUR currency', () => {
            const formatted = FinanceService.formatCurrency(1234.56);
            // Flexible regex: allows variation in thousands separator and space type
            expect(formatted).toMatch(/1?\.?234,56\s*€/);
        });
    });
});
