import { format, addDays, parseISO, isValid } from './dateHelpers';
import { AirportShift } from '../types';

/**
 * Generates a cycle of airport shifts starting from a specific date.
 * Each shift is separated by 11 days.
 */
export const calculateAirportCycle = (
    startDateStr: string,
    userName: string,
    type: string = 'standard',
    cycleLength: number = 9
): AirportShift[] => {
    const start = parseISO(startDateStr);
    if (!isValid(start)) return [];

    const newAssignments: AirportShift[] = [];
    let current = start;

    for (let i = 0; i < cycleLength; i++) {
        newAssignments.push({
            date: format(current, 'yyyy-MM-dd'),
            userId: userName,
            type: type
        });
        current = addDays(current, 11);
    }

    return newAssignments;
};

/**
 * Filters out future assignments for a specific user.
 */
export const filterFutureAssignments = (
    assignments: AirportShift[],
    userName: string,
    fromDateStr: string
): AirportShift[] => {
    const fromDate = parseISO(fromDateStr);
    if (!isValid(fromDate)) return assignments;

    return assignments.filter(a => {
        const aDate = parseISO(a.date);
        return a.userId !== userName || (isValid(aDate) && aDate < fromDate);
    });
};
