import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { Wrench, Plus, Trash2, FileDown, Save, FileText } from 'lucide-react';
import { format } from '../utils/dateHelpers';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { MaintenanceRecord } from '../types';

const Maintenance: React.FC = () => {
    const { vehicle, currentOdometer, updateMaintenance, addMaintenanceItem } = useApp();
    const toast = useToast();
    const [records, setRecords] = useState<MaintenanceRecord[]>(() => {
        const saved = localStorage.getItem('codiatax_maintenance');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('codiatax_maintenance', JSON.stringify(records));
    }, [records]);

    const [item, setItem] = useState<string>('engine_oil');
    const [customItem, setCustomItem] = useState<string>('');
    const [currentKm, setCurrentKm] = useState<string>('');
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState<string>('');

    const maintenanceItems: Record<string, { label: string; interval: number }> = {
        'engine_oil': { label: 'Aceite Motor', interval: 15000 },
        'gearbox_oil': { label: 'Aceite Caja de Cambios', interval: 60000 },
        'oil_filter': { label: 'Filtro de Aceite', interval: 15000 },
        'air_filter': { label: 'Filtro de Aire', interval: 30000 },
        'cabin_filter': { label: 'Filtro de Habitáculo', interval: 30000 },
        'fuel_filter': { label: 'Filtro de Combustible', interval: 60000 },
        'tires_front': { label: 'Neumáticos Delanteros', interval: 40000 },
        'tires_rear': { label: 'Neumáticos Traseros', interval: 40000 },
        'brakes_pads': { label: 'Pastillas de Freno', interval: 50000 },
        'timing_belt': { label: 'Correa de Distribución', interval: 120000 },
        'custom': { label: 'Otro / Manual', interval: 0 }
    };

    const getRecommendedKm = (kmStr: string, type: string): number | string => {
        const km = parseInt(kmStr);
        if (isNaN(km)) return '';
        const interval = maintenanceItems[type]?.interval || 0;
        if (interval === 0) return '';
        return km + interval;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentKm) return;

        const record: MaintenanceRecord = {
            id: Date.now(),
            type: item,
            label: item === 'custom' ? (customItem || 'Mantenimiento General') : maintenanceItems[item].label,
            currentKm: parseInt(currentKm),
            nextKm: getRecommendedKm(currentKm, item),
            date: date,
            notes: notes
        };

        setRecords([record, ...records]);
        setCurrentKm('');
        setNotes('');
        if (item === 'custom') setCustomItem('');
        toast.success('Mantenimiento registrado');
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Eliminar este registro?')) {
            setRecords(records.filter(r => r.id !== id));
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF() as any;

        doc.setFontSize(18);
        doc.text('Registro de Mantenimiento - Codiatax', 14, 22);

        doc.setFontSize(11);
        doc.text(`Fecha de reporte: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 30);

        const tableColumn = ["Fecha", "Concepto", "Km Realizados", "Próximo Cambio (Rec.)", "Notas"];
        const tableRows = records.map(record => [
            format(new Date(record.date), 'dd/MM/yyyy'),
            record.label,
            record.currentKm.toLocaleString() + ' km',
            record.nextKm ? record.nextKm.toLocaleString() + ' km' : '-',
            record.notes || '-'
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 163, 74] }
        });

        doc.save(`mantenimiento_taxi_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', margin: 0 }}>Mantenimiento Taller Taxi</h2>
                <button onClick={exportPDF} className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '4px 8px', cursor: 'pointer' }}>
                    <FileText size={16} style={{ marginRight: '4px' }} /> PDF
                </button>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label>Elemento a Mantener</label>
                        <select
                            value={item}
                            onChange={e => setItem(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                        >
                            {Object.entries(maintenanceItems).map(([key, value]) => (
                                <option key={key} value={key} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}>{value.label}</option>
                            ))}
                        </select>
                    </div>

                    {item === 'custom' && (
                        <div>
                            <label>Nombre del Elemento</label>
                            <input type="text" value={customItem} onChange={e => setCustomItem(e.target.value)} placeholder="Ej: Batería, Limpiaparabrisas..." required />
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Fecha</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <div>
                            <label>Km Actuales</label>
                            <input type="number" value={currentKm} onChange={e => setCurrentKm(e.target.value)} placeholder="Ej: 150000" required style={{ fontWeight: 'bold' }} />
                        </div>
                    </div>

                    {currentKm && item !== 'custom' && (
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>Recomendación:</span> Próximo cambio a los {getRecommendedKm(currentKm, item).toLocaleString()} km.
                        </div>
                    )}

                    <div>
                        <label>Notas (Opcional)</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Marca, modelo, precio..." />
                    </div>

                    <button type="submit" className="btn btn-primary">
                        <Save size={20} style={{ marginRight: '8px' }} /> Registrar Mantenimiento
                    </button>
                </form>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Wrench size={20} style={{ marginRight: '8px' }} /> Historial Realizado
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {records.map(rec => (
                    <div key={rec.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: 0, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{rec.label}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{format(new Date(rec.date), 'dd/MM/yyyy')}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                            <span>Km: <strong>{rec.currentKm.toLocaleString()}</strong></span>
                            {rec.nextKm && <span style={{ color: 'var(--accent-primary)' }}>Próximo: <strong>{rec.nextKm.toLocaleString()}</strong></span>}
                        </div>

                        {rec.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>Nota: {rec.notes}</p>}

                        <button
                            onClick={() => handleDelete(rec.id)}
                            style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Maintenance;
