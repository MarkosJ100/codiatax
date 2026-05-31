import React from 'react';
import { format, es } from '../../utils/dateHelpers';
import { User } from '../../types';
import { motion } from 'framer-motion';
import { Calendar, RotateCw } from 'lucide-react';

interface CurrentShift {
    weekLabel: string;
    type: string;
}

interface ShiftSummaryCardProps {
    user: User;
    currentShift: CurrentShift | null;
    shiftDays: string[];
    viewDate: Date;
}

const ShiftSummaryCard: React.FC<ShiftSummaryCardProps> = ({ user, currentShift, shiftDays, viewDate }) => {
    const currentMonthShifts = shiftDays.filter(d => {
        const date = new Date(d);
        return date.getMonth() === viewDate.getMonth() && date.getFullYear() === viewDate.getFullYear();
    }).length;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
                marginBottom: '1rem', 
                background: 'var(--bg-card)', 
                borderRadius: '24px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-premium)',
                border: '1px solid var(--border-light)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <RotateCw size={14} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rotación</span>
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {user.isShared && currentShift ? (
                        <span>{currentShift.weekLabel} <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>({currentShift.type})</span></span>
                    ) : 'No configurada'}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {format(viewDate, 'MMM', { locale: es })}
                    </span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '950', color: 'var(--accent-primary)', lineHeight: 1 }}>
                    {currentMonthShifts} <span style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.6 }}>Turnos</span>
                </div>
            </div>
        </motion.div>
    );
};

export default ShiftSummaryCard;
