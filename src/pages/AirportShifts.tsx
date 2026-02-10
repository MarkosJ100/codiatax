import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    addMonths, subMonths, addDays, subDays, parseISO, isValid
} from '../utils/dateHelpers';
import { Plane } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import CalendarGrid from '../components/Airport/CalendarGrid';
import ShiftSummaryCard from '../components/Airport/ShiftSummaryCard';
import QuickLinksCard from '../components/Airport/QuickLinksCard';
import ShiftActionPanel from '../components/Airport/ShiftActionPanel';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import { normalizeUsername } from '../utils/userHelpers';

const AirportShifts: React.FC = () => {
    const {
        user, showToast, shiftStorage, toggleAirportShift,
        toggleRestDay, getShiftForDate, generateAirportCycle,
        clearFutureAirportShifts, undoLastAction, undoBuffer
    } = useApp();

    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

    const [showTypeSelection, setShowTypeSelection] = useState<boolean>(false);
    const [showModifyConfirmation, setShowModifyConfirmation] = useState<boolean>(false);

    const currentShift = useMemo(() => {
        if (!user) return null;
        return getShiftForDate(new Date());
    }, [getShiftForDate, user]);

    const shiftDaysSet = useMemo(() => {
        if (!user || !shiftStorage?.assignments) return new Set<string>();
        const dates = shiftStorage.assignments
            .filter(a => a.userId === normalizeUsername(user.name))
            .map(a => a.date);
        return new Set(dates);
    }, [shiftStorage, user]);

    const shiftDays = useMemo(() => Array.from(shiftDaysSet), [shiftDaysSet]);

    const isShiftDay = (date: Date) => {
        if (!isValid(date)) return false;
        return shiftDaysSet.has(format(date, 'yyyy-MM-dd'));
    };

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.requestPermissions();
        }
    }, []);

    const daysInMonth = useMemo(() => {
        if (!isValid(viewDate)) return [];
        return eachDayOfInterval({
            start: startOfMonth(viewDate),
            end: endOfMonth(viewDate)
        });
    }, [viewDate]);

    const predictedDays = useMemo(() => {
        if (shiftDays.length === 0) return [];
        const sortedShifts = [...shiftDays].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const lastShiftDateStr = sortedShifts[sortedShifts.length - 1];

        const lastDate = parseISO(lastShiftDateStr);
        if (!isValid(lastDate)) return [];

        let currentDate = lastDate;
        const predictions = [];
        for (let i = 0; i < 9; i++) {
            currentDate = addDays(currentDate, 11);
            predictions.push(format(currentDate, 'yyyy-MM-dd'));
        }
        return predictions;
    }, [shiftDays]);

    const scheduleShiftNotifications = async (dateStr: string) => {
        if (!Capacitor.isNativePlatform()) return true;

        const date = parseISO(dateStr);
        const dateIdBase = parseInt(dateStr.replace(/-/g, '')) * 10;

        const notificationDayBefore = subDays(date, 1);
        notificationDayBefore.setHours(20, 0, 0, 0);

        const notificationSameDay = new Date(date);
        notificationSameDay.setHours(8, 0, 0, 0);

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: "Turno Aeropuerto Mañana",
                        body: `Recuerda: Mañana tienes turno en el aeropuerto.`,
                        id: dateIdBase + 1,
                        schedule: { at: notificationDayBefore },
                    },
                    {
                        title: "Turno Aeropuerto Hoy",
                        body: `Hoy tienes turno en el aeropuerto. ¡Buen servicio!`,
                        id: dateIdBase + 2,
                        schedule: { at: notificationSameDay },
                    }
                ]
            });
            return true;
        } catch (e) {
            console.error("Error scheduling notifications", e);
            showToast("No se pudieron programar las alertas. Verifica los permisos.", "error");
            return false;
        }
    };

    const prevMonth = () => setViewDate(subMonths(viewDate, 1));
    const nextMonth = () => setViewDate(addMonths(viewDate, 1));

    const openFlightInfo = async (url: string) => {
        await Browser.open({ url });
    };

    const links = [
        { name: 'Aena (Info Vuelos)', url: 'https://www.aena.es/es/infovuelos.html', icon: Plane },
        { name: 'Skyscanner (Llegadas/Salidas)', url: 'https://www.skyscanner.es/vuelos/llegadas-salidas/xry/jerez-de-la-frontera-llegadas-salidas', icon: Plane },
        { name: 'FlightAware (En vivo)', url: 'https://es.flightaware.com/live/airport/LEJR', icon: Plane },
    ];

    const handleDayClick = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        if (isShiftDay(day)) {
            setShowModifyConfirmation(true);
            setShowTypeSelection(false);
        } else {
            setShowModifyConfirmation(false);
            setShowTypeSelection(true);
        }
    };

    const confirmShiftWithType = async (type: string) => {
        const result = generateAirportCycle(selectedDate, type);
        if (result.success) {
            await scheduleShiftNotifications(selectedDate);
            showToast(`Ciclo generado: ${result.count} turnos (3 meses).`);
            setShowTypeSelection(false);
        }
    };

    const handleModifyCycle = () => {
        clearFutureAirportShifts(selectedDate);
        showToast("Turnos futuros eliminados. Selecciona el nuevo día correcto.");
        setShowModifyConfirmation(false);
        setShowTypeSelection(false);
    };

    const downloadCalendar = () => {
        if (!user) return;
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CodiaTax//App//ES\n";
        const today = new Date();
        const exportEnd = addMonths(today, 3);
        const daysToExport = eachDayOfInterval({ start: today, end: exportEnd });
        const isRest = (dateStr: string) => shiftStorage.restDays?.includes(dateStr);

        daysToExport.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shift = getShiftForDate(day);
            const airportShift = (shiftStorage.assignments || []).find(a => a.date === dateStr && a.userId === normalizeUsername(user.name));

            if (shift.type !== 'libre' && !isRest(dateStr)) {
                const startTime = shift.type === 'mañana' ? '060000' : '150000';
                const endTime = shift.type === 'mañana' ? '150000' : '235959';
                const dayStr = format(day, 'yyyyMMdd');
                icsContent += "BEGIN:VEVENT\n";
                icsContent += `DTSTART:${dayStr}T${startTime}\n`;
                icsContent += `DTEND:${dayStr}T${endTime}\n`;
                icsContent += `SUMMARY:Taxi - Turno ${shift.type === 'mañana' ? 'Mañana' : 'Tarde'}\n`;
                icsContent += "END:VEVENT\n";
            }
            if (airportShift) {
                const dayStr = format(day, 'yyyyMMdd');
                icsContent += "BEGIN:VEVENT\n";
                icsContent += `DTSTART;VALUE=DATE:${dayStr}\n`;
                icsContent += `DTEND;VALUE=DATE:${format(addDays(day, 1), 'yyyyMMdd')}\n`;
                icsContent += `SUMMARY:✈️ Turno Aeropuerto (${airportShift.type === 'full' ? 'Día' : 'Normal'})\n`;
                icsContent += "END:VEVENT\n";
            }
        });
        icsContent += "END:VCALENDAR";
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'turnos_taxi.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!user) return null;

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'var(--accent-primary)', color: 'white' }}>
                    <Plane size={24} />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--accent-primary)' }}>Turnos del Aeropuerto</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Gestión compartida y vuelos</p>
                </div>
            </div>

            <ShiftSummaryCard user={user} currentShift={currentShift} shiftDays={shiftDays} viewDate={viewDate} />
            <QuickLinksCard links={links} openFlightInfo={openFlightInfo} downloadCalendar={downloadCalendar} />

            <CalendarGrid
                viewDate={viewDate} daysInMonth={daysInMonth} shiftDays={shiftDays}
                predictedDays={predictedDays} selectedDate={selectedDate} shiftStorage={shiftStorage}
                user={user} getShiftForDate={getShiftForDate} handleDayClick={handleDayClick}
                prevMonth={prevMonth} nextMonth={nextMonth} isShiftDay={isShiftDay}
            />

            <ShiftActionPanel
                selectedDate={selectedDate} showModifyConfirmation={showModifyConfirmation}
                setShowModifyConfirmation={setShowModifyConfirmation} showTypeSelection={showTypeSelection}
                setShowTypeSelection={setShowTypeSelection} confirmShiftWithType={confirmShiftWithType}
                handleModifyCycle={handleModifyCycle} isShiftDay={isShiftDay}
            />

            {undoBuffer && (
                <div style={{ marginTop: '1.5rem' }}>
                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            padding: '14px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: '2px solid var(--accent-primary)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                        onClick={() => {
                            const res = undoLastAction();
                            if (res.success) showToast("Cambios deshechos exitosamente.");
                        }}
                    >
                        <span>↩</span>
                        <span>Deshacer último cambio</span>
                    </button>
                </div>
            )}

        </div >
    );
};

const AirportShiftsWithBoundary: React.FC = (props) => (
    <ErrorBoundary>
        <AirportShifts {...props} />
    </ErrorBoundary>
);

export default AirportShiftsWithBoundary;
