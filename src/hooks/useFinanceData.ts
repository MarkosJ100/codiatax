import { useMemo } from 'react';
import { Service, Expense, MileageLog, Period } from '../types';
import { calculateTotals } from '../utils/financeHelpers';

export const useFinanceData = (
    services: Service[],
    expenses: Expense[],
    mileageLogs: MileageLog[],
    period: Period,
    referenceDate: Date = new Date()
) => {
    const summary = useMemo(() => {
        return calculateTotals(services, expenses, mileageLogs, period, referenceDate);
    }, [services, expenses, mileageLogs, period, referenceDate]);

    return summary;
};
