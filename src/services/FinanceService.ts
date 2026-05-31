import { Service, Expense, MileageLog, Money, Km, Period } from '../types';
import { calculateTotals, filterByPeriod } from '../utils/financeHelpers';

/**
 * Service to handle financial business logic.
 * Encapsulates complex calculations for income, expenses and balances.
 */
export const FinanceService = {
    /**
     * Calculates totals for a specific period.
     */
    calculatePeriodTotals: (
        services: Service[],
        expenses: Expense[],
        mileageLogs: MileageLog[],
        period: Period,
        now: Date = new Date()
    ) => {
        return calculateTotals(services, expenses, mileageLogs, period, now);
    },

    /**
     * Filters a collection of items by a specific period.
     */
    filterItemsByPeriod: <T extends { timestamp: string | number | Date }>(
        items: T[],
        period: Period,
        now: Date = new Date()
    ): T[] => {
        return items.filter(item => filterByPeriod(item, period, now));
    },

    /**
     * Calculates the profitability ratio (Income per Km).
     */
    calculateProfitability: (grossIncome: Money, totalKms: Km): Money => {
        if (totalKms === 0) return 0;
        return parseFloat((grossIncome / totalKms).toFixed(2));
    },

    /**
     * Applies subscriber cap to a service amount.
     */
    applySubscriberCap: (amount: number, subscriber?: { isCapped: boolean; capAmount: number }): number => {
        if (subscriber?.isCapped && amount > subscriber.capAmount) {
            return subscriber.capAmount;
        }
        return amount;
    },

    /**
     * Formats financial values into currency strings.
     */
    formatCurrency: (value: Money): string => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    }
};
