import { isSameDay, isSameWeek, isSameMonth, isSameYear } from './dateHelpers';

export type Period = 'day' | 'week' | 'month' | 'year';

export const filterByPeriod = (item: any, dateField: string, period: Period, now: Date = new Date()) => {
    if (!item || !item[dateField]) return false;
    const d = new Date(item[dateField]);
    if (isNaN(d.getTime())) return false;

    switch (period) {
        case 'day': return isSameDay(d, now);
        case 'week': return isSameWeek(d, now, { weekStartsOn: 1 });
        case 'month': return isSameMonth(d, now);
        case 'year': return isSameYear(d, now);
        default: return false;
    }
};

export const calculateTotals = (services: any[], expenses: any[], mileageLogs: any[], period: Period, now: Date = new Date()) => {
    const periodServices = services.filter(s => filterByPeriod(s, 'timestamp', period, now));
    const periodExpenses = expenses.filter(e => filterByPeriod(e, 'timestamp', period, now));
    const periodMileage = mileageLogs.filter(l => filterByPeriod(l, 'timestamp', period, now));

    const taxiIncome = periodServices
        .filter(s => s.type === 'normal' || s.type === 'facturado')
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const subscriberIncome = periodServices
        .filter(s => s.type === 'company')
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const grossIncome = taxiIncome + subscriberIncome;
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalKms = periodMileage.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

    // Added: Pending income from company services not yet paid
    const pendingSubscriberBalance = periodServices
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
