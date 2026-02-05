import React from 'react';
import { format, es } from '../../utils/dateHelpers';
import { User } from '../../types';

interface ShiftSummaryCardProps {
    user: User;
    currentShift: any;
    shiftDays: string[];
    viewDate: Date;
}

const ShiftSummaryCard: React.FC<ShiftSummaryCardProps> = ({ user, currentShift, shiftDays, viewDate }) => {
    // Calculate total shifts in current view month
    const currentMonthShifts = shiftDays.filter(d => {
        const date = new Date(d);
        return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
    }).length;

    return (
        <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Rotación Actual</h4>
                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {user.isShared && currentShift ? `${currentShift.weekLabel} (${currentShift.type})` : 'Sin rotación fija'}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Turnos {format(viewDate, 'MMM', { locale: es })}</h4>
                    <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--accent-primary)' }}>{currentMonthShifts}</p>
                </div>
            </div>
        </div>
    );
};

export default ShiftSummaryCard;
