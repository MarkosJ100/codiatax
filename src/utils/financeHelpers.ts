import { Service, Expense, MileageLog, Money, Km, Period } from '../types';
import {
    isSameDay,
    isSameWeek,
    isSameMonth,
    isSameYear,
    startOfDay,
    startOfWeek,
    startOfMonth,
    startOfYear,
    endOfDay,
    endOfWeek,
    endOfMonth,
    endOfYear,
    eachDayOfInterval,
    format
} from './dateHelpers';

interface Titled {
    timestamp: string | number | Date;
}

export const filterByPeriod = <T extends Titled>(item: T, period: Period, now: Date = new Date()) => {
    if (!item || !item.timestamp) return false;
    const d = new Date(item.timestamp);
    if (isNaN(d.getTime())) return false;

    switch (period) {
        case 'day': return isSameDay(d, now);
        case 'week': return isSameWeek(d, now, { weekStartsOn: 1 });
        case 'month': return isSameMonth(d, now);
        case 'year': return isSameYear(d, now);
        default: return false;
    }
};

export const calculateTotals = (services: Service[], expenses: Expense[], mileageLogs: MileageLog[], period: Period, now: Date = new Date()) => {
    // 1. Determine the date range for the period
    let start: Date;
    let end: Date;

    switch (period) {
        case 'day': start = startOfDay(now); end = endOfDay(now); break;
        case 'week': start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break;
        case 'month': start = startOfMonth(now); end = endOfMonth(now); break;
        case 'year': start = startOfYear(now); end = endOfYear(now); break;
        default: start = now; end = now;
    }

    const startTime = start.getTime();
    const endTime = end.getTime();

    // 2. Single pass grouping and filtering
    const servicesByDay = new Map<string, Service[]>();
    const expensesByDay = new Map<string, Expense[]>();
    const mileageByDay = new Map<string, MileageLog[]>();

    let totalServices = 0;
    let totalExpensesCount = 0;
    let totalMileageCount = 0;

    services.forEach(s => {
        const d = new Date(s.timestamp);
        const t = d.getTime();
        if (t >= startTime && t <= endTime) {
            const key = format(d, 'yyyy-MM-dd');
            if (!servicesByDay.has(key)) servicesByDay.set(key, []);
            servicesByDay.get(key)!.push(s);
            totalServices++;
        }
    });

    expenses.forEach(e => {
        const d = new Date(e.timestamp);
        const t = d.getTime();
        if (t >= startTime && t <= endTime) {
            const key = format(d, 'yyyy-MM-dd');
            if (!expensesByDay.has(key)) expensesByDay.set(key, []);
            expensesByDay.get(key)!.push(e);
            totalExpensesCount++;
        }
    });

    mileageLogs.forEach(l => {
        if (!l.timestamp) return;
        const d = new Date(l.timestamp);
        const t = d.getTime();
        if (t >= startTime && t <= endTime) {
            const key = format(d, 'yyyy-MM-dd');
            if (!mileageByDay.has(key)) mileageByDay.set(key, []);
            mileageByDay.get(key)!.push(l);
            totalMileageCount++;
        }
    });

    // 3. Aggregate totals by iterating days in interval
    const daysInPeriod = eachDayOfInterval({ start, end });

    let totalGrossIncome = 0;
    let totalTaxiIncome = 0;
    let totalSubscriberIncome = 0;
    let totalExpenses = 0;
    let totalRealExpenses = 0;
    let totalEstimatedExpenses = 0;
    let totalKms = 0;
    let pendingSubscriberBalance = 0;
    let isKmsEstimated = false;
    let isExpensesEstimated = false;
    let daysWorked = 0;

    daysInPeriod.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const dayServices = servicesByDay.get(key) || [];
        const dayExpenses = expensesByDay.get(key) || [];
        const dayMileage = mileageByDay.get(key) || [];

        if (dayServices.length === 0 && dayExpenses.length === 0 && dayMileage.length === 0) return;

        daysWorked++;

        // Daily Income
        let dayTaxi = 0;
        let daySub = 0;
        let dayPendingSub = 0;

        dayServices.forEach(s => {
            const val = Number(s.amount) || 0;
            if (s.type === 'normal' || s.type === 'facturado') dayTaxi += val;
            else if (s.type === 'company') {
                daySub += val;
                if (s.isPaid !== true) dayPendingSub += val;
            }
        });

        const dayGross = dayTaxi + daySub;

        // Daily Kms
        let dayKms = dayMileage.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

        // Estimar Kilómetros
        if (dayKms === 0 && dayGross > 0) {
            dayKms = dayGross;
            isKmsEstimated = true;
        }

        // Daily Expenses
        let dayExp = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const dayRealExp = dayExp;

        // Estimar Gastos
        if (dayExp === 0 && dayKms > 0) {
            dayExp = dayKms * 0.1;
            isExpensesEstimated = true;
        }

        totalGrossIncome += dayGross;
        totalTaxiIncome += dayTaxi;
        totalSubscriberIncome += daySub;
        totalExpenses += dayExp;
        totalRealExpenses += dayRealExp;
        totalEstimatedExpenses += dayExp - dayRealExp;
        totalKms += dayKms;
        pendingSubscriberBalance += dayPendingSub;
    });

    return {
        grossIncome: totalGrossIncome,
        taxiIncome: totalTaxiIncome,
        subscriberIncome: totalSubscriberIncome,
        totalExpenses,
        totalRealExpenses,
        totalEstimatedExpenses,
        netIncome: totalGrossIncome - totalExpenses,
        netIncomeReal: totalGrossIncome - totalRealExpenses,
        totalKms,
        pendingSubscriberBalance,
        servicesCount: totalServices,
        expensesCount: totalExpensesCount,
        mileageCount: totalMileageCount,
        isKmsEstimated,
        isExpensesEstimated,
        daysWorked
    };
};
