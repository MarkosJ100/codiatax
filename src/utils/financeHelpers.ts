import { Service, Expense, MileageLog, Money, Km, Period } from '../types';
import { isSameDay, isSameWeek, isSameMonth, isSameYear } from './dateHelpers';

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
    const periodServices = services.filter(s => filterByPeriod(s, period, now));
    const periodExpenses = expenses.filter(e => filterByPeriod(e, period, now));
    const periodMileage = mileageLogs.filter(l => filterByPeriod(l, period, now));

    const taxiIncome: Money = periodServices
        .filter(s => s.type === 'normal' || s.type === 'facturado')
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const subscriberIncome: Money = periodServices
        .filter(s => s.type === 'company')
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const grossIncome: Money = taxiIncome + subscriberIncome;
    const totalExpenses: Money = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalKms: Km = periodMileage.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    const pendingSubscriberBalance: Money = periodServices
        .filter(s => s.type === 'company' && s.isPaid !== true)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    return {
        grossIncome,
        taxiIncome,
        subscriberIncome,
        totalExpenses,
        netIncome: grossIncome - totalExpenses,
        totalKms,
        pendingSubscriberBalance,
        servicesCount: periodServices.length,
        expensesCount: periodExpenses.length,
        mileageCount: periodMileage.length
    };
};
