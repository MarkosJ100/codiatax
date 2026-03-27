import React, { useEffect, useMemo, useState } from 'react';
import { FileDown, History as HistoryIcon, Info, MapPin, ReceiptText, ShieldAlert, Trash2, Wrench } from 'lucide-react';

import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../hooks/useToast';
import { format, es } from '../utils/dateHelpers';
import { MaintenanceRecord } from '../types';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import { storage } from '../utils/storage';

const MAINTENANCE_STORAGE_KEY = 'codiatx_maintenance';
const ESTIMATED_DAILY_KM = 60;
const DEFAULT_ESTIMATED_COST = 140;

type RevisionStatus = 'ok' | 'warning' | 'critical';

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
        notes: typeof record.notes === 'string' ? record.notes : ''
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

const Maintenance: React.FC = () => {
    const { vehicle, currentOdometer } = useVehicle();
    const toast = useToast();
    const isNativePlatform = false;

    const [records, setRecords] = useState<MaintenanceRecord[]>(loadMaintenanceRecords);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label: string }>({
        isOpen: false,
        id: null,
        label: ''
    });

    useEffect(() => {
        storage.setItem(MAINTENANCE_STORAGE_KEY, records);
    }, [records]);

    const upcomingRevisions = useMemo(() => {
        const maintenanceEntries = Object.entries(vehicle.maintenance || {});
        return maintenanceEntries
            .map(([key, item]) => {
                const nextKm = item.lastKm + item.interval;
                const remainingKm = nextKm - currentOdometer;
                const estimatedDays = Math.max(0, Math.ceil(remainingKm / ESTIMATED_DAILY_KM));
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + estimatedDays);

                return {
                    key,
                    label: item.name,
                    interval: item.interval,
                    nextKm,
                    remainingKm,
                    dueDate,
                    status: getStatusFromRemainingKm(remainingKm)
                };
            })
            .sort((a, b) => a.remainingKm - b.remainingKm);
    }, [vehicle.maintenance, currentOdometer]);

    const nearestRevision = upcomingRevisions[0];

    const estimatedCost = useMemo(() => {
        if (records.length === 0) return DEFAULT_ESTIMATED_COST;
        const withNumericCost = records
            .map((record) => {
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
                        <p className="text-muted text-sm mt-1">Vista simple: factura, proximas revisiones e historial</p>
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
                                Extrae fecha, km, tareas y proxima revision para actualizar el plan automaticamente.
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
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>OCR de factura (proximo paso)</div>
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Boton preparado para conectar lectura de PDF/foto y autocompletar mantenimiento.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginTop: '0.8rem' }}
                            onClick={() => toast.success('Perfecto: aqui conectaremos la lectura automatica de factura.')}
                        >
                            Subir factura
                        </button>
                    </div>
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-center gap-2" style={{ marginBottom: '0.9rem' }}>
                        <Wrench size={18} className="text-accent-primary" />
                        <h2 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800 }}>2) Proximas revisiones</h2>
                    </div>

                    {!nearestRevision ? (
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>No hay revisiones cargadas todavia.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Proxima por fecha</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{format(nearestRevision.dueDate, 'd MMM yyyy', { locale: es })}</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{nearestRevision.label}</div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Proxima por km</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{nearestRevision.nextKm.toLocaleString()} km</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: getStatusColor(nearestRevision.status), fontWeight: 700 }}>
                                    {nearestRevision.remainingKm <= 0 ? 'Vencida' : `Faltan ${nearestRevision.remainingKm.toLocaleString()} km`}
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '16px', padding: '0.9rem' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Coste estimado</div>
                                <div style={{ marginTop: '0.3rem', fontWeight: 800 }}>{estimatedCost.toLocaleString()} EUR</div>
                                <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Media aproximada de historial</div>
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
                                    padding: '0.6rem 0.75rem'
                                }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.label}</span>
                                    <span style={{ fontSize: '0.8rem', color: getStatusColor(item.status), fontWeight: 700 }}>
                                        {item.nextKm.toLocaleString()} km
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 mt-1">
                    <div className="flex items-center justify-between px-1">
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HistoryIcon size={17} className="text-muted" />
                            3) Historial de taller
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

                                        <div className="flex items-center gap-2">
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
                                        </div>
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



