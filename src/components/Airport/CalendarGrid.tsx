import React from 'react';
import { format, getDate, es } from '../../utils/dateHelpers';
import { ChevronLeft, ChevronRight, Bell, Calendar as CalendarIcon, Info } from 'lucide-react';
import { User, ShiftStorage } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarGridProps {
    viewDate: Date;
    daysInMonth: Date[];
    shiftDays: string[];
    predictedDays: string[];
    selectedDate: string;
    shiftStorage: ShiftStorage;
    user: User;
    getShiftForDate: (date: Date) => any;
    handleDayClick: (date: Date) => void;
    prevMonth: () => void;
    nextMonth: () => void;
    isShiftDay: (date: Date) => boolean;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
    viewDate,
    daysInMonth,
    selectedDate,
    shiftStorage,
    getShiftForDate,
    handleDayClick,
    prevMonth,
    nextMonth,
    isShiftDay
}) => {

    const isRest = (dateStr: string) => shiftStorage?.restDays?.includes(dateStr);

    const weekdays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ 
                background: 'var(--bg-card)', 
                borderRadius: '32px', 
                padding: '1.25rem',
                boxShadow: 'var(--shadow-premium)',
                border: '1px solid var(--border-light)',
                marginBottom: '1.5rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button 
                    onClick={prevMonth} 
                    style={{ 
                        background: 'var(--bg-secondary)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        padding: '8px', 
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={20} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarIcon size={18} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontWeight: '950', textTransform: 'capitalize', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                        {format(viewDate, 'MMMM yyyy', { locale: es })}
                    </span>
                </div>
                <button 
                    onClick={nextMonth} 
                    style={{ 
                        background: 'var(--bg-secondary)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        padding: '8px', 
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
                {weekdays.map(d => (
                    <div key={d} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', paddingBottom: '8px' }}>{d}</div>
                ))}

                {daysInMonth.length > 0 && Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = isShiftDay(day);
                    const isTakenByOther = !isSelected && shiftStorage?.assignments?.some(a => a.date === dateStr);
                    const isFocus = selectedDate === dateStr;
                    const isDayRest = isRest(dateStr);

                    const shiftInfo = getShiftForDate(day);
                    const isMorning = shiftInfo?.type === 'mañana';
                    const isAfternoon = shiftInfo?.type === 'tarde';
                    const isFree = shiftInfo?.type === 'libre' || (!isMorning && !isAfternoon);

                    return (
                        <motion.button
                            key={day.toString()}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDayClick(day)}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '14px',
                                border: isFocus ? '2px solid var(--accent-primary)' : '1px solid transparent',
                                backgroundColor: (() => {
                                    if (isDayRest) return 'var(--text-muted)';
                                    if (isTakenByOther) return 'rgba(239, 68, 68, 0.15)';
                                    if (isSelected) return 'var(--accent-primary)';
                                    if (isMorning) return 'rgba(16, 185, 129, 0.1)';
                                    if (isAfternoon) return 'rgba(59, 130, 246, 0.1)';
                                    return 'var(--bg-secondary)';
                                })(),
                                color: isSelected ? '#000' : isDayRest ? '#fff' : 'var(--text-primary)',
                                fontWeight: '900',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.2s',
                                padding: 0
                            }}
                        >
                            <span style={{ fontSize: '0.95rem' }}>{getDate(day)}</span>

                            {!isDayRest && !isFree && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    fontSize: '0.55rem',
                                    opacity: isSelected ? 0.8 : 0.5,
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }}>
                                    {isMorning ? 'MAÑ' : 'TAR'}
                                </span>
                            )}

                            {isSelected && (
                                <div style={{ 
                                    position: 'absolute', 
                                    top: 4, 
                                    right: 4, 
                                    width: '6px', 
                                    height: '6px', 
                                    borderRadius: '50%', 
                                    background: '#000' 
                                }} />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Leyenda refinada */}
            <div style={{ 
                marginTop: '1.25rem', 
                padding: '1rem', 
                background: 'var(--bg-secondary)', 
                borderRadius: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: 'var(--accent-primary)', borderRadius: '4px' }}></div>
                    <span>Confirmado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    <div style={{ width: 12, height: 12, border: '2px solid var(--accent-primary)', borderRadius: '4px' }}></div>
                    <span>Seleccionado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '4px' }}></div>
                    <span>Ocupado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: 'var(--text-muted)', borderRadius: '4px' }}></div>
                    <span>Descanso</span>
                </div>
            </div>

            <div style={{ 
                marginTop: '1.25rem', 
                padding: '0.75rem', 
                borderRadius: '16px', 
                border: '1px solid var(--border-light)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
            }}>
                <Info size={16} style={{ color: 'var(--accent-primary)', marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Las alertas se programan automáticamente para el día anterior (20:00) y el mismo día (08:00).
                </p>
            </div>
        </motion.div>
    );
};

export default CalendarGrid;
