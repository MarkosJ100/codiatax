import { useCallback, useMemo } from 'react';
import { ShiftStorage, AirportShift, ShiftType } from '../types';
import { calculateAirportCycle, filterFutureAssignments } from '../utils/airportLogic';

export const useShiftLogic = (shiftStorage: ShiftStorage, userName: string | undefined) => {

    const checkCollision = useCallback((week: string, type: ShiftType): string | null => {
        if (!userName) return null;
        const configs = shiftStorage.userConfigs || [];
        const collision = configs.find(c =>
            c.shiftWeek === week &&
            c.shiftType === type &&
            c.userName !== userName
        );
        return collision ? collision.userName : null;
    }, [shiftStorage.userConfigs, userName]);

    const getPreviewCycle = useCallback((startDateStr: string, type: string = 'standard'): AirportShift[] => {
        if (!userName) return [];
        return calculateAirportCycle(startDateStr, userName, type);
    }, [userName]);

    const userAssignments = useMemo(() => {
        if (!userName || !shiftStorage.assignments) return [];
        return shiftStorage.assignments.filter(a => a.userId === userName);
    }, [shiftStorage.assignments, userName]);

    return {
        checkCollision,
        getPreviewCycle,
        userAssignments
    };
};
