import React, { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    CheckCircle2,
    ChevronDown,
    FileDown,
    History as HistoryIcon,
    Info,
    MapPin,
    ShieldCheck,
    Trash2,
    TriangleAlert,
    Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVehicle } from '../context/VehicleContext';
import { useToast } from '../hooks/useToast';
import { format, es } from '../utils/dateHelpers';
import { MaintenanceRecord } from '../types';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';
import { getModelsByBrand, maintenanceBrands } from '../data/maintenanceTemplates';

const Maintenance: React.FC = () => {
    const { vehicle, currentOdometer, addMaintenanceItem, setVehicle } = useVehicle();
    const toast = useToast();

    const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
        const saved = localStorage.getItem('codiatax_maintenance');
        return saved ? JSON.parse(saved) : [];
    });
    const [templateReferenceKm, setTemplateReferenceKm] = useState(currentOdometer.toString());
    const [selectedBrand, setSelectedBrand] = useState('Hyundai');
    const [selectedTemplateId, setSelectedTemplateId] = useState('hyundai-ioniq-hybrid-2020');
    const [selectedTemplateItems, setSelectedTemplateItems] = useState<string[]>([]);
    const [isModelDetailOpen, setIsModelDetailOpen] = useState(false);
    const [isTemplateVisibleOpen, setIsTemplateVisibleOpen] = useState(true);
    const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
    const [isTemplateSummaryOpen, setIsTemplateSummaryOpen] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label: string }>({
        isOpen: false,
        id: null,
        label: ''
    });

    useEffect(() => {
        localStorage.setItem('codiatax_maintenance', JSON.stringify(records));
    }, [records]);

    const availableTemplates = useMemo(() => getModelsByBrand(selectedBrand), [selectedBrand]);
    const selectedTemplate = useMemo(
        () => availableTemplates.find((template) => template.id === selectedTemplateId) || availableTemplates[0],
        [availableTemplates, selectedTemplateId]
    );

    useEffect(() => {
        setTemplateReferenceKm(currentOdometer.toString());
    }, [currentOdometer]);

    useEffect(() => {
        if (selectedTemplate) {
            setSelectedTemplateItems(Object.keys(selectedTemplate.items));
        } else {
            setSelectedTemplateItems([]);
        }
        setIsModelDetailOpen(false);
        setIsTemplateVisibleOpen(true);
        setIsTemplateSelectionOpen(false);
        setIsTemplateSummaryOpen(true);
    }, [selectedTemplate]);

    const cardBaseStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '1rem',
        borderRadius: '16px',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        fontSize: '1rem',
        fontWeight: '600',
        transition: 'all 0.2s'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: '750',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '8px',
        display: 'block'
    };

    const getReliabilityBadge = (reliability: 'oficial' | 'manual_aportado' | 'orientativo') => {
        switch (reliability) {
            case 'oficial':
                return { label: 'Fuente oficial', icon: ShieldCheck, bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.22)', color: '#047857' };
            case 'manual_aportado':
                return { label: 'Manual aportado', icon: BookOpen, bg: 'rgba(59, 130, 246, 0.14)', border: 'rgba(59, 130, 246, 0.22)', color: '#1d4ed8' };
            default:
                return { label: 'Base orientativa', icon: TriangleAlert, bg: 'rgba(245, 158, 11, 0.16)', border: 'rgba(245, 158, 11, 0.24)', color: '#b45309' };
        }
    };

    const formatInterval = (interval: number) => `${interval.toLocaleString()} km`;
    const formatNextKm = (lastKm: number, interval: number) => (lastKm + interval).toLocaleString();
    const formatRemainingKm = (referenceKm: number, interval: number) => {
        const nextKm = referenceKm + interval;
        const remaining = nextKm - currentOdometer;
        return remaining >= 0 ? remaining.toLocaleString() : `-${Math.abs(remaining).toLocaleString()}`;
    };

    const applyMaintenanceTemplate = () => {
        if (!selectedTemplate) return;
        setVehicle((prev) => ({
            ...prev,
            model: selectedTemplate.displayName,
            maintenance: {
                ...prev.maintenance,
                ...Object.fromEntries(
                    Object.entries(selectedTemplate.items).map(([key, item]) => [key, { ...item, lastKm: prev.maintenance[key]?.lastKm ?? currentOdometer }])
                )
            }
        }));
        toast.success(`Plantilla aplicada: ${selectedTemplate.displayName}`);
    };

    const toggleTemplateItem = (key: string) => {
        setSelectedTemplateItems((prev) => (prev.includes(key) ? prev.filter((itemKey) => itemKey !== key) : [...prev, key]));
    };

    const confirmSelectedTemplateItems = () => {
        if (!selectedTemplate || selectedTemplateItems.length === 0) {
            toast.error('Selecciona al menos un mantenimiento');
            return;
        }
        const currentServiceKm = parseInt(templateReferenceKm, 10);
        if (Number.isNaN(currentServiceKm) || currentServiceKm < 0) {
            toast.error('Introduce un kilometraje valido');
            return;
        }
        selectedTemplateItems.forEach((key) => {
            const templateItem = selectedTemplate.items[key];
            if (!templateItem) return;
            addMaintenanceItem(key, { name: templateItem.name, interval: templateItem.interval, lastKm: currentServiceKm });
        });
        toast.success(`Mantenimientos guardados a ${currentServiceKm.toLocaleString()} km`);
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

    const exportPDF = async () => {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const doc = new jsPDF() as any;
        doc.setFontSize(18);
        doc.text('Registro de mantenimiento - Codiatax', 14, 22);
        doc.setFontSize(11);
        doc.text(`Vehiculo: ${vehicle?.model} (${vehicle?.licensePlate})`, 14, 30);
        doc.text(`Fecha de reporte: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 36);
        const tableColumn = ['Fecha', 'Concepto', 'Km realizados', 'Proximo cambio', 'Notas'];
        const tableRows = records.map((record) => [
            format(new Date(record.date), 'dd/MM/yyyy'),
            record.label,
            `${record.currentKm.toLocaleString()} km`,
            record.nextKm ? `${record.nextKm.toLocaleString()} km` : '-',
            record.notes || '-'
        ]);
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }
        });
        doc.save(`mantenimiento_${vehicle?.licensePlate || 'taxi'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const reliabilityBadge = selectedTemplate ? getReliabilityBadge(selectedTemplate.reliability) : null;

    return (
        <div className="page-container" style={{ paddingBottom: '2rem' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mantenimiento</h1>
                        <p className="text-muted text-sm mt-1">Historial tecnico y preventivo</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportPDF} className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem', borderRadius: '16px', gap: '8px' }}>
                        <FileDown size={18} className="text-accent-primary" />
                        <span className="hide-mobile">Reporte PDF</span>
                    </motion.button>
                </div>

                <div className="card" style={cardBaseStyle}>
                    <div className="flex items-center gap-2 mb-5">
                        <Wrench size={20} className="text-accent-primary" />
                        <div>
                            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Plantilla por marca y modelo</h2>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                                Marca lo que acabas de hacer y guarda el proximo mantenimiento automaticamente.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginBottom: '1rem' }}>
                        {[
                            getReliabilityBadge('oficial'),
                            getReliabilityBadge('manual_aportado'),
                            getReliabilityBadge('orientativo')
                        ].map((badge) => (
                            <span
                                key={badge.label}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.42rem',
                                    padding: '0.45rem 0.7rem',
                                    borderRadius: '999px',
                                    background: badge.bg,
                                    border: `1px solid ${badge.border}`,
                                    color: badge.color,
                                    fontSize: '0.74rem',
                                    fontWeight: '800'
                                }}
                            >
                                <badge.icon size={14} />
                                {badge.label}
                            </span>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '12px' }}>
                        <select
                            value={selectedBrand}
                            onChange={(e) => {
                                const brand = e.target.value;
                                const templates = getModelsByBrand(brand);
                                setSelectedBrand(brand);
                                setSelectedTemplateId(templates[0]?.id || '');
                            }}
                            style={inputStyle}
                        >
                            {maintenanceBrands.map((brand) => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>

                        <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} style={inputStyle}>
                            {availableTemplates.map((template) => (
                                <option key={template.id} value={template.id}>
                                    {template.displayName} · {template.fuelType}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTemplate && (
                        <div
                            style={{
                                marginTop: '1rem',
                                padding: '1rem 1.1rem',
                                borderRadius: '18px',
                                background: 'rgba(var(--accent-primary-rgb), 0.08)',
                                border: '1px solid rgba(var(--accent-primary-rgb), 0.14)'
                            }}
                        >
                            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {selectedTemplate.displayName}
                            </div>
                            {reliabilityBadge && (
                                <div style={{ marginTop: '0.55rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.42rem',
                                            padding: '0.45rem 0.7rem',
                                            borderRadius: '999px',
                                            background: reliabilityBadge.bg,
                                            border: `1px solid ${reliabilityBadge.border}`,
                                            color: reliabilityBadge.color,
                                            fontSize: '0.75rem',
                                            fontWeight: '800'
                                        }}
                                    >
                                        <reliabilityBadge.icon size={14} />
                                        {reliabilityBadge.label}
                                    </span>
                                </div>
                            )}

                            <div style={{ marginTop: '0.9rem' }}>
                                <label style={{ ...labelStyle, marginBottom: '6px' }}>Km actuales de referencia</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={templateReferenceKm}
                                    onChange={(e) => setTemplateReferenceKm(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Introduce los km actuales"
                                />
                            </div>

                            <div style={{ marginTop: '1rem', borderRadius: '16px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(var(--accent-primary-rgb), 0.08)' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModelDetailOpen((open) => !open)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            Detalle del modelo
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                            Tips, revisiones frecuentes, mantenimiento largo y uso taxi
                                        </div>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        style={{
                                            color: 'var(--text-muted)',
                                            transform: isModelDetailOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    />
                                </button>

                                <AnimatePresence>
                                    {isModelDetailOpen && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ padding: '0 1rem 1rem' }}>
                                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                                                    {selectedTemplate.sourceNote}
                                                </div>

                                                <div style={{ marginTop: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                    <span style={{ padding: '0.45rem 0.7rem', borderRadius: '999px', background: 'rgba(var(--accent-primary-rgb), 0.14)', color: 'var(--accent-primary)', fontSize: '0.76rem', fontWeight: '800' }}>
                                                        {selectedTemplate.baseIntervalLabel}
                                                    </span>
                                                    <span style={{ padding: '0.45rem 0.7rem', borderRadius: '999px', background: 'rgba(15, 23, 42, 0.06)', color: 'var(--text-secondary)', fontSize: '0.76rem', fontWeight: '700' }}>
                                                        {selectedTemplate.fuelType}
                                                    </span>
                                                </div>

                                                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                    {selectedTemplate.maintenanceTips.map((tip, index) => (
                                                        <div
                                                            key={`${selectedTemplate.id}-tip-${index}`}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'flex-start',
                                                                gap: '0.55rem',
                                                                fontSize: '0.78rem',
                                                                color: 'var(--text-secondary)',
                                                                lineHeight: 1.45
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: '22px',
                                                                    height: '22px',
                                                                    borderRadius: '999px',
                                                                    flexShrink: 0,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    background: 'rgba(var(--accent-primary-rgb), 0.14)',
                                                                    color: 'var(--accent-primary)',
                                                                    fontWeight: '800',
                                                                    fontSize: '0.72rem'
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </span>
                                                            <span>{tip}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                                    <div style={{ padding: '0.9rem', borderRadius: '16px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(var(--accent-primary-rgb), 0.08)' }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
                                                            Revision frecuente
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                            {selectedTemplate.frequentChecks.map((entry, index) => (
                                                                <div key={`freq-${index}`} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                                    • {entry}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '0.9rem', borderRadius: '16px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(var(--accent-primary-rgb), 0.08)' }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
                                                            Mantenimiento largo
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                            {selectedTemplate.longTermChecks.map((entry, index) => (
                                                                <div key={`long-${index}`} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                                    • {entry}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '0.85rem', padding: '0.95rem 1rem', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#b91c1c', textTransform: 'uppercase', marginBottom: '0.55rem' }}>
                                                        Atencion en uso taxi
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                                        {selectedTemplate.taxiFocus.map((entry, index) => (
                                                            <div key={`taxi-${index}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                                                • {entry}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div style={{ borderRadius: '16px', background: 'rgba(var(--accent-primary-rgb), 0.08)', border: '1px solid rgba(var(--accent-primary-rgb), 0.14)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsTemplateVisibleOpen((open) => !open)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Seleccion actual visible
                                            </div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                                                {selectedTemplateItems.length} mantenimientos marcados
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={18}
                                            style={{
                                                color: 'var(--text-muted)',
                                                transform: isTemplateVisibleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isTemplateVisibleOpen && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ padding: '0 1rem 1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                                                        <button type="button" onClick={() => setIsTemplateSelectionOpen(true)} className="btn btn-secondary">
                                                            Editar
                                                        </button>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                                        {selectedTemplateItems.length > 0 ? (
                                                            selectedTemplateItems.map((key) => {
                                                                const templateItem = selectedTemplate.items[key];
                                                                if (!templateItem) return null;
                                                                const referenceKm = parseInt(templateReferenceKm, 10);
                                                                const nextKm = Number.isNaN(referenceKm) ? null : referenceKm + templateItem.interval;
                                                                const remainingKm = Number.isNaN(referenceKm) ? null : formatRemainingKm(referenceKm, templateItem.interval);

                                                                return (
                                                                    <div
                                                                        key={`visible-${key}`}
                                                                        style={{
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'space-between',
                                                                            gap: '0.9rem',
                                                                            padding: '0.85rem 0.95rem',
                                                                            borderRadius: '14px',
                                                                            background: 'rgba(255,255,255,0.72)',
                                                                            border: '1px solid rgba(var(--accent-primary-rgb), 0.08)'
                                                                        }}
                                                                    >
                                                                        <div style={{ minWidth: 0 }}>
                                                                            <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                                                {templateItem.name}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.22rem' }}>
                                                                                Hecho a {Number.isNaN(referenceKm) ? '-' : referenceKm.toLocaleString()} km · Proximo a {nextKm === null ? '-' : nextKm.toLocaleString()} km
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-primary)' }}>
                                                                                {remainingKm === null ? '-' : `${remainingKm} km`}
                                                                            </div>
                                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>restantes</div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                Todavia no has marcado ningun mantenimiento.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(var(--accent-primary-rgb), 0.08)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsTemplateSelectionOpen((open) => !open)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Seleccion de mantenimientos realizados
                                            </div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                                                {selectedTemplateItems.length} seleccionados
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={18}
                                            style={{
                                                color: 'var(--text-muted)',
                                                transform: isTemplateSelectionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isTemplateSelectionOpen && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                    {Object.entries(selectedTemplate.items).map(([key, templateItem]) => {
                                                        const isSelected = selectedTemplateItems.includes(key);
                                                        const referenceKm = parseInt(templateReferenceKm, 10);
                                                        const nextKm = (Number.isNaN(referenceKm) ? 0 : referenceKm) + templateItem.interval;

                                                        return (
                                                            <div
                                                                key={key}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.8rem',
                                                                    padding: '0.85rem 0.95rem',
                                                                    borderRadius: '16px',
                                                                    background: isSelected ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'rgba(255,255,255,0.65)',
                                                                    border: isSelected ? '1px solid rgba(var(--accent-primary-rgb), 0.2)' : '1px solid rgba(var(--accent-primary-rgb), 0.08)'
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleTemplateItem(key)}
                                                                    style={{
                                                                        width: '22px',
                                                                        height: '22px',
                                                                        borderRadius: '7px',
                                                                        border: isSelected ? '1px solid rgba(var(--accent-primary-rgb), 0.3)' : '1px solid var(--border-color)',
                                                                        background: isSelected ? 'rgba(var(--accent-primary-rgb), 0.16)' : 'var(--bg-card)',
                                                                        color: isSelected ? 'var(--accent-primary)' : 'transparent',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        flexShrink: 0,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                </button>

                                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                                    <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                                        {templateItem.name}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                                        Intervalo base: {formatInterval(templateItem.interval)}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                                        Se marca hecho a: {Number.isNaN(referenceKm) ? '-' : referenceKm.toLocaleString()} km · Volvera a tocar: {Number.isNaN(referenceKm) ? '-' : nextKm.toLocaleString()} km
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                                        <button type="button" onClick={() => setSelectedTemplateItems(Object.keys(selectedTemplate.items))} className="btn btn-secondary">
                                                            Seleccionar todo
                                                        </button>
                                                        <button type="button" onClick={() => setSelectedTemplateItems([])} className="btn btn-secondary">
                                                            Deseleccionar todo
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div style={{ borderRadius: '16px', background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(var(--accent-primary-rgb), 0.08)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsTemplateSummaryOpen((open) => !open)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                Resumen de seleccion
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                                Referencia actual: {templateReferenceKm || '-'} km
                                            </div>
                                        </div>
                                        <ChevronDown
                                            size={18}
                                            style={{
                                                color: 'var(--text-muted)',
                                                transform: isTemplateSummaryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isTemplateSummaryOpen && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ padding: '0 1rem 1rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {selectedTemplateItems.length > 0 ? (
                                                            selectedTemplateItems.map((key) => {
                                                                const templateItem = selectedTemplate.items[key];
                                                                if (!templateItem) return null;
                                                                const referenceKm = parseInt(templateReferenceKm, 10);
                                                                return (
                                                                    <div key={`summary-${key}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                                                                        <strong style={{ color: 'var(--text-primary)' }}>{templateItem.name}</strong>
                                                                        {' · '}cada {formatInterval(templateItem.interval)}
                                                                        {' · '}hecho a {Number.isNaN(referenceKm) ? '-' : referenceKm.toLocaleString()} km
                                                                        {' · '}proximo {Number.isNaN(referenceKm) ? '-' : formatNextKm(referenceKm, templateItem.interval)} km
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                No hay mantenimientos seleccionados.
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ marginTop: '0.9rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                        <button type="button" onClick={confirmSelectedTemplateItems} className="btn btn-primary">
                                                            Confirmar y guardar
                                                        </button>
                                                        <button type="button" onClick={() => setIsTemplateSelectionOpen(true)} className="btn btn-secondary">
                                                            Editar seleccion
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
                                <button type="button" onClick={applyMaintenanceTemplate} className="btn btn-primary">
                                    Aplicar plantilla
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center justify-between px-1">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HistoryIcon size={18} className="text-muted" />
                            Historial de taller
                        </h3>
                        <span className="badge" style={{ fontSize: '0.75rem' }}>{records.length} registros</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {records.length === 0 ? (
                            <div className="card text-center py-12" style={{ ...cardBaseStyle, borderStyle: 'dashed', opacity: 0.6 }}>
                                <Wrench size={40} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.3 }} />
                                <p className="text-muted font-bold">Sin registros registrados</p>
                            </div>
                        ) : (
                            records.map((rec, index) => (
                                <motion.div
                                    key={rec.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="card"
                                    style={{
                                        ...cardBaseStyle,
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div
                                            style={{
                                                width: '46px',
                                                height: '46px',
                                                borderRadius: '14px',
                                                background: 'var(--bg-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                fontWeight: '900',
                                                border: '1px solid var(--border-color)',
                                                color: 'var(--accent-primary)'
                                            }}
                                        >
                                            MT
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 style={{ fontWeight: '800', fontSize: '1rem', margin: 0 }} className="truncate">
                                                    {rec.label}
                                                </h4>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                                                    {format(new Date(rec.date), 'd MMM yyyy', { locale: es })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-secondary border border-color">
                                                    <MapPin size={10} className="text-muted" />
                                                    <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>{rec.currentKm.toLocaleString()} km</span>
                                                </div>
                                                {rec.nextKm && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg" style={{ background: 'rgba(var(--accent-primary-rgb), 0.1)' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-primary)' }}>
                                                            Prox: {rec.nextKm.toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        {rec.notes && (
                                            <div
                                                title={rec.notes}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    background: 'var(--bg-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--text-muted)'
                                                }}
                                            >
                                                <Info size={16} />
                                            </div>
                                        )}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(rec.id)}
                                            className="icon-btn-sm text-danger"
                                            style={{ width: '36px', height: '36px', background: 'rgba(var(--danger-rgb), 0.1)', border: 'none' }}
                                        >
                                            <Trash2 size={16} />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Eliminar mantenimiento"
                message="Este registro se borrara de tu historial permanentemente."
                itemLabel={deleteModal.label}
            />
        </div>
    );
};

export default Maintenance;
