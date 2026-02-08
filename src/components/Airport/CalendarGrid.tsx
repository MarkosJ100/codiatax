import React from 'react';
import { format, getDate, es } from '../../utils/dateHelpers';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { User, ShiftStorage } from '../../types';

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
    predictedDays,
    selectedDate,
    shiftStorage,
    getShiftForDate,
    handleDayClick,
    prevMonth,
    nextMonth,
    isShiftDay
}) => {

    const isPredictedDay = (date: Date) => {
        return predictedDays.includes(format(date, 'yyyy-MM-dd'));
    };

    const isRest = (dateStr: string) => shiftStorage?.restDays?.includes(dateStr);

    return (
        <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button onClick={prevMonth} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ChevronLeft /></button>
                <span style={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                    {format(viewDate, 'MMMM yyyy', { locale: es })}
                </span>
                <button onClick={nextMonth} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ChevronRight /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 'bold' }}>{d}</div>
                ))}

                {daysInMonth.length > 0 && Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = isShiftDay(day);
                    const isTakenByOther = !isSelected && shiftStorage?.assignments?.some(a => a.date === dateStr);
                    const isDateSelected = selectedDate === dateStr;
                    const isDayRest = isRest(dateStr);

                    const shiftInfo = getShiftForDate(day);
                    const isMorning = shiftInfo?.type === 'mañana';
                    const isAfternoon = shiftInfo?.type === 'tarde';
                    const isFree = shiftInfo?.type === 'libre' || (!isMorning && !isAfternoon);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '8px',
                                border: isDateSelected ? '3px solid var(--text-primary)' : '1px solid transparent',
                                backgroundColor: (() => {
                                    if (isDayRest) return '#52525b';
                                    if (isTakenByOther) return '#ef4444';
                                    if (isMorning) return isSelected ? '#16a34a' : 'rgba(22, 163, 74, 0.2)';
                                    if (isAfternoon) return isSelected ? '#2563eb' : 'rgba(37, 99, 235, 0.2)';
                                    return 'var(--bg-secondary)';
                                })(),
                                color: (isSelected || isDayRest) ? '#fff' : 'var(--text-primary)',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                position: 'relative',
                                opacity: isDayRest ? 0.8 : 1
                            }}
                        >
                            <span style={{ fontSize: '0.9rem' }}>{getDate(day)}</span>

                            {!isDayRest && !isFree && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    fontSize: '0.6rem',
                                    opacity: isSelected ? 1 : 0.6,
                                    fontWeight: 'normal',
                                    textTransform: 'uppercase'
                                }}>
                                    {isMorning ? 'MAÑ' : 'TAR'}
                                </span>
                            )}

                            {isSelected && !isDayRest && (
                                <div style={{ position: 'absolute', top: 2, right: 2, backgroundColor: 'var(--bg-card)', borderRadius: '50%', padding: '2px' }}>
                                    <Bell size={10} fill={isMorning ? '#16a34a' : '#2563eb'} color="transparent" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 10, height: 10, backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                    <span>Confirmado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 10, height: 10, backgroundColor: '#eab308', borderRadius: '4px' }}></div>
                    <span>Previsto (+11 d)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
                    <span>Ocupado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: 10, height: 10, backgroundColor: '#52525b', borderRadius: '4px' }}></div>
                    <span>Descanso</span>
                </div>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <p>Calendario de Turnos: Toca un día para marcarlo/desmarcarlo.</p>
                <p style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
                    <Bell size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Se programarán alertas automáticamente (Día anterior 20:00 y Mismo día 08:00).
                </p>
            </div>
        </div>
    );
};

export default CalendarGrid;
