import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, getMonth, setMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomCalendarProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    onClose?: () => void;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({ selectedDate, onSelect, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '1rem' : '1.5rem', padding: '0 0.5rem' }}>
                <h2 style={{ fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        style={{ padding: '0.4rem', borderRadius: '9999px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={isMobile ? 18 : 20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        style={{ padding: '0.4rem', borderRadius: '9999px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
                    >
                        <ChevronRight size={isMobile ? 18 : 20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>
                {days.map((day) => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        const cellSize = isMobile ? '2.2rem' : '2.5rem';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const cloneDay = day;
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day.toString()}
                        style={{
                            height: cellSize,
                            width: cellSize,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.8rem' : '0.875rem',
                            position: 'relative',
                            borderRadius: '9999px',
                            color: !isCurrentMonth ? 'var(--text-muted)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            zIndex: 1
                        }}
                        onClick={() => onSelect(cloneDay)}
                    >
                        {isSelected && (
                            <div style={{
                                position: 'absolute',
                                inset: isMobile ? '1px' : '2px',
                                backgroundColor: '#FFC400',
                                borderRadius: '50%',
                                zIndex: -1
                            }} />
                        )}
                        <span style={{ color: isSelected ? '#000' : 'inherit' }}>{format(day, "d")}</span>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? '2px' : '4px' }} key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div>{rows}</div>;
    };

    const currentMonthIdx = getMonth(currentMonth);

    return (
        <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            padding: isMobile ? '1rem' : '1.5rem',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            maxWidth: isMobile ? '100%' : '32rem',
            width: isMobile ? 'calc(100vw - 32px)' : '100%',
            border: '1px solid var(--border-light)',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                paddingRight: isMobile ? 0 : '1.5rem',
                paddingBottom: isMobile ? '1rem' : 0,
                borderRight: isMobile ? 'none' : '1px solid var(--border-light)',
                borderBottom: isMobile ? '1px solid var(--border-light)' : 'none'
            }}>
                {renderHeader()}
                {renderDays()}
                {renderCells()}
            </div>

            {/* Sidebar de Meses - Adaptable */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                gap: isMobile ? '0.5rem' : '0.75rem',
                paddingLeft: isMobile ? 0 : '1.5rem',
                paddingTop: isMobile ? '1rem' : 0,
                justifyContent: 'center',
                minWidth: isMobile ? '100%' : '76px',
                overflowX: isMobile ? 'auto' : 'visible',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
            }}>
                {months.map((m, idx) => {
                    const isActive = idx === currentMonthIdx;
                    return (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setCurrentMonth(setMonth(currentMonth, idx))}
                            style={{
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                textAlign: isMobile ? 'center' : 'left',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                                fontWeight: isActive ? 'bold' : 'normal',
                                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                padding: isMobile ? '4px 8px' : '0',
                                flexShrink: 0
                            }}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CustomCalendar;
