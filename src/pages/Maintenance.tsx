import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckSquare, FileDown, History as HistoryIcon, Info, MapPin, ReceiptText, ShieldAlert, Trash2, Wrench } from 'lucide-react';

import { useServices } from '../context/ServiceContext';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../hooks/useToast';
import { format, es } from '../utils/dateHelpers';
import { MaintenanceRecord } from '../types';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import { storage } from '../utils/storage';

const MAINTENANCE_STORAGE_KEY = 'codiatx_maintenance';
const MONTHLY_ODOMETER_STORAGE_KEY = 'codiatx_monthly_odometer_closures';
const DEFAULT_ESTIMATED_COST = 140;

type RevisionStatus = 'ok' | 'warning' | 'critical';
type MonthlyOdometerClose = {
    id: number;
    monthKey: string;
    startKm: number;
    endKm: number;
    createdAt: string;
};

const MAINTENANCE_CHECK_OPTIONS = [
    { key: 'spark_plugs', label: 'Bujías', defaultInterval: 60000 },
    { key: 'lubrication', label: 'Engrase', defaultInterval: 15000 },
    { key: 'engine_oil', label: 'Aceite', defaultInterval: 15000 },
    { key: 'gearbox', label: 'Caja de cambio', defaultInterval: 60000 },
    { key: 'cabin_filter', label: 'Filtro habitáculo', defaultInterval: 15000 },
    { key: 'air_filter', label: 'Filtro de aire', defaultInterval: 30000 },
    { key: 'oil_filter', label: 'Filtro de aceite', defaultInterval: 15000 },
    { key: 'fuel_filter', label: 'Filtro gasoil / gasolina', defaultInterval: 30000 },
    { key: 'timing_kit', label: 'Kit de distribución / correas DSG', defaultInterval: 90000 },
    { key: 'brake_axle', label: 'Frenos delanteros o traseros', defaultInterval: 30000 },
    { key: 'brake_parts', label: 'Pastillas o discos', defaultInterval: 30000 }
] as const;

const parseFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const parseRecordDate = (value: unknown): string | null => {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const normalizeMaintenanceRecord = (value: unknown, index: number): MaintenanceRecord | null => {
    if (!value || typeof value !== 'object') return null;

    const record = value as Partial<Record<keyof MaintenanceRecord, unknown>>;
    const currentKm = parseFiniteNumber(record.currentKm);
    const parsedDate = parseRecordDate(record.date);

    if (currentKm === null || parsedDate === null) return null;

    const nextKm = parseFiniteNumber(record.nextKm);
    const parsedId = parseFiniteNumber(record.id);

    return {
        id: parsedId ?? Date.now() + index,
        type: typeof record.type === 'string' && record.type.trim() ? record.type : 'legacy',
        label: typeof record.label === 'string' && record.label.trim() ? record.label : 'Mantenimiento',
        currentKm,
        nextKm: nextKm ?? '',
        date: parsedDate,
        notes: typeof record.notes === 'string' ? record.notes : '',
        invoiceAmount: parseFiniteNumber(record.invoiceAmount) ?? undefined,
        oilType: typeof record.oilType === 'string' ? record.oilType : undefined,
        intervalKm: parseFiniteNumber(record.intervalKm) ?? undefined,
        checklist: Array.isArray(record.checklist) ? record.checklist.filter((item): item is string => typeof item === 'string') : undefined,
        source: record.source === 'manual' || record.source === 'ocr' || record.source === 'monthly_close' ? record.source : undefined,
        monthKey: typeof record.monthKey === 'string' ? record.monthKey : undefined,
        endKm: parseFiniteNumber(record.endKm) ?? undefined
    };
};

const loadMaintenanceRecords = (): MaintenanceRecord[] => {
    const saved = storage.getItem<unknown>(MAINTENANCE_STORAGE_KEY, []);
    if (!Array.isArray(saved)) return [];

    return saved
        .map((entry, index) => normalizeMaintenanceRecord(entry, index))
        .filter((entry): entry is MaintenanceRecord => entry !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const getRecordNextKm = (value: MaintenanceRecord['nextKm']): number | null => parseFiniteNumber(value);

const formatRecordDate = (value: string, pattern: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : format(parsed, pattern, { locale: es });
};

const getStatusFromRemainingKm = (remainingKm: number): RevisionStatus => {
    if (remainingKm <= 0) return 'critical';
    if (remainingKm <= 1500) return 'warning';
    return 'ok';
};

const getStatusColor = (status: RevisionStatus): string => {
    if (status === 'critical') return 'var(--danger)';
    if (status === 'warning') return 'var(--warning)';
    return 'var(--success)';
};

const normalizeMonthlyClose = (value: unknown, index: number): MonthlyOdometerClose | null => {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const startKm = parseFiniteNumber(record.startKm);
    const endKm = parseFiniteNumber(record.endKm);
    if (startKm === null || endKm === null) return null;

    return {
        id: parseFiniteNumber(record.id) ?? Date.now() + index,
        monthKey: typeof record.monthKey === 'string' ? record.monthKey : format(new Date(), 'yyyy-MM'),
        startKm,
        endKm,
        createdAt: parseRecordDate(record.createdAt) ?? new Date().toISOString()
    };
};

const loadMonthlyCloses = (): MonthlyOdometerClose[] => {
    const saved = storage.getItem<unknown>(MONTHLY_ODOMETER_STORAGE_KEY, []);
    if (!Array.isArray(saved)) return [];

    return saved
        .map((entry, index) => normalizeMonthlyClose(entry, index))
        .filter((entry): entry is MonthlyOdometerClose => entry !== null)
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
};

const toIsoDate = (value: string) => new Date(`${value}T12:00:00`).toISOString();

const getDailyEstimatedKmMap = (records: { timestamp: string; amount: number; source?: string }[]) => {
    const totals = new Map<string, { totalSource: number; detailedSource: number }>();

    records.forEach((service) => {
        const dayKey = format(new Date(service.timestamp), 'yyyy-MM-dd');
        const current = totals.get(dayKey) || { totalSource: 0, detailedSource: 0 };
        if (service.source === 'total') current.totalSource += service.amount;
        else current.detailedSource += service.amount;
        totals.set(dayKey, current);
    });

    return new Map(
        Array.from(totals.entries()).map(([dayKey, value]) => [
            dayKey,
            value.totalSource > 0 ? value.totalSource : value.detailedSource
        ])
    );
};

const addProjectedWorkDays = (baseDate: Date, workDays: number) => {
    const result = new Date(baseDate);
    let remaining = Math.max(0, workDays);

    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() === 0) continue;
        remaining -= 1;
    }

    return result;
};

const Maintenance: React.FC = () => {
    const { vehicle, currentOdometer, setVehicle } = useVehicle();
    const { services } = useServices();
    const toast = useToast();
    const isNativePlatform = false;

    const [records, setRecords] = useState<MaintenanceRecord[]>(loadMaintenanceRecords);
    const [monthlyCloses, setMonthlyCloses] = useState<MonthlyOdometerClose[]>(loadMonthlyCloses);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label: string }>({
        isOpen: false,
        id: null,
        label: ''
    });
    const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [manualOilType, setManualOilType] = useState('5W30');
    const [manualInvoiceAmount, setManualInvoiceAmount] = useState('');
    const [manualIntervalKm, setManualIntervalKm] = useState('15000');
    const [manualCurrentKm, setManualCurrentKm] = useState(String(currentOdometer));
    const [manualNotes, setManualNotes] = useState('');
    const [manualChecks, setManualChecks] = useState<string[]>(['engine_oil', 'oil_filter']);
    const [monthKey, setMonthKey] = useState(format(new Date(), 'yyyy-MM'));
    const [monthStartKm, setMonthStartKm] = useState('');
    const [monthEndKm, setMonthEndKm] = useState('');

    useEffect(() => {
        storage.setItem(MAINTENANCE_STORAGE_KEY, records);
    }, [records]);

    useEffect(() => {
        storage.setItem(MONTHLY_ODOMETER_STORAGE_KEY, monthlyCloses);
    }, [monthlyCloses]);

    useEffect(() => {
        setManualCurrentKm(String(currentOdometer));
    }, [currentOdometer]);

    const dailyEstimatedKmMap = useMemo(() => getDailyEstimatedKmMap(services), [services]);

    const averageEstimatedKmPerDay = useMemo(() => {
        const values = Array.from(dailyEstimatedKmMap.values()).filter((value) => value > 0);
        if (values.length === 0) return 0;
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }, [dailyEstimatedKmMap]);

    const estimatedKmSince = (startDate: string) => {
        const startKey = format(new Date(startDate), 'yyyy-MM-dd');
        return Array.from(dailyEstimatedKmMap.entries()).reduce((sum, [dayKey, amount]) => {
            if (dayKey < startKey) return sum;
            return sum + amount;
        }, 0);
    };

    const upcomingRevisions = useMemo(() => {
        const maintenanceEntries = Object.entries(vehicle.maintenance || {});
        return maintenanceEntries
            .map(([key, item]) => {
                const nextKm = item.lastKm + item.interval;
                const remainingKm = nextKm - currentOdometer;
                const estimatedRemainingKm = item.lastDate ? item.interval - estimatedKmSince(item.lastDate) : remainingKm;
                const estimatedDays = averageEstimatedKmPerDay > 0
                    ? Math.max(0, Math.ceil(estimatedRemainingKm / averageEstimatedKmPerDay))
                    : null;
                const dueDate = estimatedDays !== null
                    ? addProjectedWorkDays(new Date(), estimatedDays)
                    : new Date();

                return {
                    key,
                    label: item.name,
                    interval: item.interval,
                    nextKm,
                    remainingKm,
                    estimatedRemainingKm,
                    estimatedDays,
                    oilType: item.oilType,
                    dueDate,
                    status: getStatusFromRemainingKm(Math.min(remainingKm, estimatedRemainingKm))
                };
            })
            .sort((a, b) => Math.min(a.remainingKm, a.estimatedRemainingKm) - Math.min(b.remainingKm, b.estimatedRemainingKm));
    }, [vehicle.maintenance, currentOdometer, averageEstimatedKmPerDay, dailyEstimatedKmMap]);

    const nearestRevision = upcomingRevisions[0];
    const latestMonthlyClose = monthlyCloses[0];

    const estimatedCost = useMemo(() => {
        if (records.length === 0) return DEFAULT_ESTIMATED_COST;
        const withNumericCost = records
            .map((record) => {
                if (typeof record.invoiceAmount === 'number' && Number.isFinite(record.invoiceAmount)) {
                    return record.invoiceAmount;
                }
                const match = record.notes.match(/(?:^|\s)(\d+[.,]?\d{0,2})\s*(?:EUR|euros?|€)/i);
                if (!match) return null;
                return Number(match[1].replace(',', '.'));
            })
            .filter((value): value is number => value !== null && Number.isFinite(value));

        if (withNumericCost.length === 0) return DEFAULT_ESTIMATED_COST;
        return Math.round(withNumericCost.reduce((acc, value) => acc + value, 0) / withNumericCost.length);
    }, [records]);

    const exportPDF = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text('Registro de mantenimiento - Codiatax', 14, 22);
        doc.setFontSize(11);
        doc.text(`Vehiculo: ${vehicle?.model} (${vehicle?.licensePlate})`, 14, 30);
        doc.text(`Fecha de reporte: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 36);
        const tableColumn = ['Fecha', 'Concepto', 'Km realizados', 'Proximo cambio', 'Notas'];
        const tableRows = records.map((record) => {
            const nextKm = getRecordNextKm(record.nextKm);
            return [
                formatRecordDate(record.date, 'dd/MM/yyyy'),
                record.label,
                `${record.currentKm.toLocaleString()} km`,
                nextKm !== null ? `${nextKm.toLocaleString()} km` : '-',
                record.notes || '-'
            ];
        });
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }
        });
        doc.save(`mantenimiento_${vehicle?.licensePlate || 'taxi'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const handleDelete = (id: number) => {
        const record = records.find((entry) => entry.id === id);
        if (!record) return;
        setDeleteModal({ isOpen: true, id, label: record.label });
    };

    const confirmDelete = () => {
        if (deleteModal.id === null) return;
        setRecords((prev) => prev.filter((entry) => entry.id !== deleteModal.id));
        setDeleteModal({ isOpen: false, id: null, label: '' });
        toast.success('Registro eliminado');
    };

    const toggleManualCheck = (key: string) => {
        setManualChecks((prev) => (
            prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
        ));
    };

    const handleManualMaintenanceSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const currentKm = parseFiniteNumber(manualCurrentKm);
        const intervalKm = parseFiniteNumber(manualIntervalKm) ?? 15000;
        const invoiceAmount = parseFiniteNumber(manualInvoiceAmount);
        if (currentKm === null || manualChecks.length === 0) {
            toast.error('Completa los kilómetros y marca al menos una tarea.');
            return;
        }

        const selectedOptions = MAINTENANCE_CHECK_OPTIONS.filter((option) => manualChecks.includes(option.key));
        const dateIso = toIsoDate(manualDate);
        const nextKm = currentKm + intervalKm;
        const newRecord: MaintenanceRecord = {
            id: Date.now(),
            type: 'manual',
            label: selectedOptions.map((item) => item.label).join(', ') || 'Mantenimiento manual',
            currentKm,
            nextKm,
            date: dateIso,
            invoiceAmount: invoiceAmount ?? undefined,
            notes: [manualOilType ? `Aceite: ${manualOilType}` : '', manualNotes.trim()].filter(Boolean).join(' · '),
            oilType: manualOilType.trim() || undefined,
            intervalKm,
            checklist: selectedOptions.map((item) => item.label),
            source: 'manual'
        };

        setRecords((prev) => [newRecord, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setVehicle((prev) => {
            const nextMaintenance = { ...prev.maintenance };
            selectedOptions.forEach((option) => {
                nextMaintenance[option.key] = {
                    name: option.label,
                    lastKm: currentKm,
                    interval: intervalKm || option.defaultInterval,
                    lastDate: dateIso,
                    oilType: option.key === 'engine_oil' ? manualOilType.trim() || undefined : undefined,
                    notes: manualNotes.trim() || undefined,
                    checklist: selectedOptions.map((item) => item.label)
                };
            });

            return { ...prev, maintenance: nextMaintenance };
        });

        toast.success('Mantenimiento manual guardado');
        setManualNotes('');
        setManualInvoiceAmount('');
    };

    const handleMonthlyCloseSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const startKm = parseFiniteNumber(monthStartKm);
        const endKm = parseFiniteNumber(monthEndKm);
        if (startKm === null || endKm === null || endKm < startKm) {
            toast.error('Revisa el odómetro inicial y final del mes.');
            return;
        }

        const newClose: MonthlyOdometerClose = {
            id: Date.now(),
            monthKey,
            startKm,
            endKm,
            createdAt: new Date().toISOString()
        };

        setMonthlyCloses((prev) => [newClose, ...prev.filter((item) => item.monthKey !== monthKey)].sort((a, b) => b.monthKey.localeCompare(a.monthKey)));
        toast.success('Cierre mensual guardado');
    };

    const cardBaseStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '1.25rem',
        boxShadow: isNativePlatform ? 'none' : 'var(--shadow-sm)'
    };

    return (
        <div className="page-container" style={{ paddingBottom: '2rem' }}>
            <div className="flex flex-col gap-5" style={{ animation: isNativePlatform ? 'none' : 'fadeInUp 0.25s ease-out' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mantenimiento</h1>
                        <p className="text-muted text-sm mt-1">Estimación por ingresos, revisión real mensual e historial de taller</p>
                    </div>
                    <button onClick={exportPDF} className="btn btn-secondary" style={{ padding: '0.7rem 1rem', borderRadius: '14px', gap: '8px' }}>
                        <FileDown size={18} className="text-accent-primary" />
                        <span className="hide-mobile">Reporte PDF</span>
                    </button>
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-start justify-between gap-3" style={{ marginBottom: '0.8rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>1) Subir factura del taller</h2>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Extrae fecha, km, tareas y próxima revisión para actualizar el plan automáticamente.
                            </p>
                        </div>
                        <ReceiptText size={20} className="text-accent-primary" />
                    </div>

                    <div style={{
                        borderRadius: '16px',
                        border: '1px dashed rgba(var(--accent-primary-rgb), 0.35)',
                        background: 'rgba(var(--accent-primary-rgb), 0.06)',
                        padding: '1rem'
                    }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>OCR de factura (próximo paso)</div>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Botón preparado para conectar lectura de PDF/foto y autocompletar mantenimiento.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginTop: '0.8rem' }}
                            onClick={() => toast.success('Perfecto: aquí conectaremos la lectura automática de PDF y fotos.')}
                        >
                            Subir factura
                        </button>
                    </div>
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.9rem' }}>
                        <CheckSquare size={18} className="text-accent-primary" />
                        <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>2) Alta manual de mantenimiento</h2>
                    </div>

                    <form onSubmit={handleManualMaintenanceSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Fecha</label>
                                <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Tipo de aceite</label>
                                <input type="text" value={manualOilType} onChange={(e) => setManualOilType(e.target.value)} placeholder="5W30" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Importe de factura</label>
                                <input type="number" step="0.01" value={manualInvoiceAmount} onChange={(e) => setManualInvoiceAmount(e.target.value)} placeholder="277.51" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Kilómetros al cambio</label>
                                <input type="number" value={manualCurrentKm} onChange={(e) => setManualCurrentKm(e.target.value)} placeholder="100335" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Próximo cambio cada X km</label>
                                <input type="number" value={manualIntervalKm} onChange={(e) => setManualIntervalKm(e.target.value)} placeholder="15000" />
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Trabajo realizado</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.55rem' }}>
                                {MAINTENANCE_CHECK_OPTIONS.map((option) => {
                                    const isChecked = manualChecks.includes(option.key);
                                    return (
                                        <label
                                            key={option.key}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.6rem',
                                                border: `1px solid ${isChecked ? 'rgba(var(--accent-primary-rgb), 0.35)' : 'var(--border-color)'}`,
                                                borderRadius: '14px',
                                                padding: '0.75rem 0.85rem',
                                                background: isChecked ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'var(--bg-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <input type="checkbox" checked={isChecked} onChange={() => toggleManualCheck(option.key)} style={{ width: '16px', height: '16px' }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{option.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Notas</label>
                            <textarea
                                value={manualNotes}
                                onChange={(e) => setManualNotes(e.target.value)}
                                placeholder="Marca, factura, observaciones o piezas cambiadas..."
                                rows={3}
                                style={{ width: '100%', borderRadius: '14px', padding: '0.85rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Este registro reinicia la cuenta atrás estimada de los elementos marcados.
                            </div>
                            <button type="submit" className="btn btn-primary">Guardar mantenimiento</button>
                        </div>
                    </form>
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.9rem' }}>
                        <Wrench size={18} className="text-accent-primary" />
                        <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>3) Próximas revisiones</h2>
                    </div>

                    {!nearestRevision ? (
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>No hay revisiones cargadas todavía.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Próxima por tiempo</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>
                                    {nearestRevision.estimatedDays === null ? 'Sin datos aún' : format(nearestRevision.dueDate, 'd MMM yyyy', { locale: es })}
                                </div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{nearestRevision.label}</div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Cuenta atrás estimada</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{Math.max(0, Math.round(nearestRevision.estimatedRemainingKm)).toLocaleString()} km</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: getStatusColor(nearestRevision.status), fontWeight: 700 }}>
                                    {nearestRevision.estimatedRemainingKm <= 0 ? 'Vencida estimada' : `≈ ${Math.max(0, Math.round(nearestRevision.estimatedRemainingKm)).toLocaleString()} € restantes`}
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Referencia real</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{Math.max(0, nearestRevision.remainingKm).toLocaleString()} km</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Odómetro actual: {currentOdometer.toLocaleString()} km</div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Coste estimado</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{estimatedCost.toLocaleString()} EUR</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Media aproximada del historial</div>
                            </div>
                        </div>
                    )}

                    {upcomingRevisions.length > 0 && (
                        <div style={{ marginTop: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {upcomingRevisions.slice(0, 3).map((item) => (
                                <div key={item.key} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    padding: '0.6rem 0.75rem',
                                    gap: '0.75rem'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.label}</span>
                                        {item.oilType && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.oilType}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: getStatusColor(item.status), fontWeight: 700 }}>
                                            {Math.max(0, Math.round(item.estimatedRemainingKm)).toLocaleString()} km
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            real: {Math.max(0, item.remainingKm).toLocaleString()} km
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.9rem' }}>
                        <CalendarClock size={18} className="text-accent-primary" />
                        <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>4) Cierre real mensual</h2>
                    </div>

                    <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Guarda el odómetro inicial y final del mes para comparar tu estimación con los kilómetros reales.
                    </p>

                    <form onSubmit={handleMonthlyCloseSubmit} style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Mes</label>
                                <input type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Odómetro inicial</label>
                                <input type="number" value={monthStartKm} onChange={(e) => setMonthStartKm(e.target.value)} placeholder="97887" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Odómetro final</label>
                                <input type="number" value={monthEndKm} onChange={(e) => setMonthEndKm(e.target.value)} placeholder="100335" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Este cierre corrige la orientación mensual, pero mantiene el seguimiento diario por estimación.
                            </div>
                            <button type="submit" className="btn btn-primary">Guardar cierre mensual</button>
                        </div>
                    </form>

                    {latestMonthlyClose && (
                        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Último cierre</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{latestMonthlyClose.monthKey}</div>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Km reales del mes</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{(latestMonthlyClose.endKm - latestMonthlyClose.startKm).toLocaleString()} km</div>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Odómetro final</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{latestMonthlyClose.endKm.toLocaleString()} km</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 mt-1">
                    <div className="flex items-center justify-between px-1">
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HistoryIcon size={17} className="text-muted" />
                            5) Historial de taller
                        </h3>
                        <span className="badge" style={{ fontSize: '0.75rem' }}>{records.length} registros</span>
                    </div>

                    {records.length === 0 ? (
                        <div className="card text-center py-10" style={{ ...cardBaseStyle, borderStyle: 'dashed', opacity: 0.65 }}>
                            <ShieldAlert size={34} style={{ margin: '0 auto 0.8rem', opacity: 0.35 }} />
                            <p className="text-muted font-bold">Sin registros de mantenimiento</p>
                        </div>
                    ) : (
                        records.map((rec) => (
                            <div key={rec.id} className="card" style={{ ...cardBaseStyle, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        background: 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--accent-primary)',
                                        fontWeight: 900
                                    }}>
                                        MT
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h4 style={{ fontWeight: 800, fontSize: '0.96rem', margin: 0 }} className="truncate">{rec.label}</h4>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {formatRecordDate(rec.date, 'd MMM yyyy')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary border border-color">
                                                <MapPin size={10} className="text-muted" />
                                                <span style={{ fontSize: '0.79rem', fontWeight: 800 }}>{rec.currentKm.toLocaleString()} km</span>
                                            </div>
                                            {getRecordNextKm(rec.nextKm) !== null && (
                                                <div className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)' }}>
                                                    <span style={{ fontSize: '0.79rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                                        Prox: {getRecordNextKm(rec.nextKm)?.toLocaleString()} km
                                                    </span>
                                                </div>
                                            )}
                                            {rec.oilType && (
                                                <div className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(var(--success-rgb), 0.12)' }}>
                                                    <span style={{ fontSize: '0.79rem', fontWeight: 800, color: 'var(--success)' }}>{rec.oilType}</span>
                                                </div>
                                            )}
                                            {typeof rec.invoiceAmount === 'number' && (
                                                <div className="px-2 py-0.5 rounded-lg" style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)' }}>
                                                    <span style={{ fontSize: '0.79rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{rec.invoiceAmount.toFixed(2)} EUR</span>
                                                </div>
                                            )}
                                        </div>

                                        {rec.checklist && rec.checklist.length > 0 && (
                                            <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {rec.checklist.join(' · ')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-3">
                                    {rec.notes && (
                                        <div title={rec.notes} style={{
                                            width: '31px',
                                            height: '31px',
                                            borderRadius: '9px',
                                            background: 'var(--bg-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <Info size={15} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleDelete(rec.id)}
                                        className="icon-btn-sm text-danger"
                                        style={{ width: '34px', height: '34px', background: 'rgba(var(--danger-rgb), 0.1)', border: 'none' }}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Eliminar mantenimiento"
                message="Este registro se borrara del historial permanentemente."
                itemLabel={deleteModal.label}
            />
        </div>
    );
};

export default Maintenance;



