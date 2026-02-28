import { AirportShift, ShiftType, UserShiftConfig, ShiftStorage } from '../types';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';

/**
 * Service to handle airport shifts and rotation logic.
 * Encapsulates complex business rules for assignment generation and collisions.
 */
export const ShiftService = {
    /**
     * Generates a new airport cycle assignments.
     */
    generateCycle: (startDateStr: string, userName: string, type: string = 'standard'): AirportShift[] => {
        return calculateAirportCycle(startDateStr, userName, type);
    },

    /**
     * Filters out future assignments for a user starting from a specific date.
     */
    clearFutureAssignments: (assignments: AirportShift[], userName: string, fromDateStr: string): AirportShift[] => {
        return filterFutureAssignments(assignments, userName, fromDateStr);
    },

    /**
     * Logic for toggling an airport shift. Returns the new list of assignments.
     */
    toggleAssignment: (assignments: AirportShift[], dateStr: string, userId: string, type: string = 'standard'): AirportShift[] => {
        const existing = assignments.find(a => a.date === dateStr && a.userId === userId);
        if (existing) {
            return assignments.filter(a => !(a.date === dateStr && a.userId === userId));
        } else {
            return [...assignments, { date: dateStr, userId, type }];
        }
    },

    /**
     * Checks if a shift type for a specific week is already taken by another user.
     */
    getCollision: (configs: UserShiftConfig[], week: string, type: ShiftType, currentUserName: string): string | null => {
        const collision = configs.find(c => c.shiftWeek === week && c.shiftType === type && c.userName !== currentUserName);
        return collision ? collision.userName : null;
    },

    /**
     * Determines the shift details for a given date (Mañana/Tarde/Libre).
     * Currently simplified logic, can be extended with complex rules.
     */
    getShiftDetails: (date: Date, workMode: 'solo' | 'shared' = 'shared') => {
        if (workMode === 'solo') {
            return { type: 'libre', label: 'Conductor Único', isSolo: true };
        }

        // Placeholder for more complex rotation logic if needed in the future
        return {
            type: 'mañana',
            label: 'Turno Mañana',
            startTime: '06:00',
            endTime: '15:00'
        };
    }
};
