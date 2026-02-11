import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getMonth, getYear, getDate, es } from '../utils/dateHelpers';
import { Search, FileDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../hooks/useToast';
import ExportMenu from '../components/Common/ExportMenu';
import { Service } from '../types';

const History: React.FC = () => {
    const { services, expenses, user, addService, updateService, deleteService, showToast, subscribers } = useApp();
    const toast = useToast();
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filterDay, setFilterDay] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<number>(getMonth(new Date()));
    const [filterYear, setFilterYear] = useState<number>(getYear(new Date()));
    const [filterConcept, setFilterConcept] = useState<string>('');

    // Edit State
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [editAmount, setEditAmount] = useState<string>('');
    const [editSubscriberId, setEditSubscriberId] = useState<string>('');
    const [editObservation, setEditObservation] = useState<string>('');
    const [editType, setEditType] = useState<'normal' | 'company' | 'facturado'>('normal');
    const [editIsPaid, setEditIsPaid] = useState<boolean>(false);

    // Add State
    const [isAddingService, setIsAddingService] = useState<boolean>(false);

    // Calendar Data
    const daysInMonth = useMemo(() => {
        const start = startOfMonth(viewDate);
        const end = endOfMonth(viewDate);
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    // Check if a day has services
    const hasServices = (date: Date) => {
        return services.some(s => isSameDay(new Date(s.timestamp), date));
    };

    // Derived Filtered Data
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const date = new Date(service.timestamp);

            if (showFilters) {
                if (getYear(date) !== filterYear) return false;
                if (filterMonth !== -1 && getMonth(date) !== filterMonth) return false;
                if (filterDay !== '' && getDate(date) !== parseInt(filterDay)) return false;
                if (filterConcept) {
                    const concept = (service.companyName || 'Normal' + (service.observation || '')).toLowerCase();
                    if (!concept.includes(filterConcept.toLowerCase())) return false;
                }
                return true;
            }

            if (selectedDate) {
                return isSameDay(date, selectedDate);
            }
            return isSameMonth(date, viewDate);
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [services, showFilters, filterDay, filterMonth, filterYear, filterConcept, selectedDate, viewDate]);

    const totalAmount = filteredServices.reduce((sum, s) => sum + s.amount, 0);

    // Helpers for Calendar Navigation
    const prevMonth = () => setViewDate(d => new Date(getYear(d), getMonth(d) - 1));
    const nextMonth = () => setViewDate(d => new Date(getYear(d), getMonth(d) + 1));

    // Handle Search Toggle
    const toggleFilters = () => {
        if (!showFilters) {
            setFilterYear(getYear(viewDate));
            setFilterMonth(getMonth(viewDate));
            setFilterDay('');
            setFilterConcept('');
        }
        setShowFilters(!showFilters);
        setSelectedDate(null);
    };

    // Handle Edit
    const handleEdit = (service: Service) => {
        setEditingService(service);
        setEditAmount(service.amount.toString());
        setEditSubscriberId(service.subscriberId || '');
        setEditObservation(service.observation || '');
        setEditType(service.type);
        setEditIsPaid(!!service.isPaid);
    };

    // Handle Delete
    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de borrar este servicio?')) {
            deleteService(id);
            showToast('Servicio eliminado');
        }
    };

    // Handle Save Edit
    const handleSaveEdit = () => {
        if (!editingService || !editAmount) return;

        const meterAmount = parseFloat(editAmount);
        let finalAmount = meterAmount;
        let companyName: string | undefined;

        if (editType === 'company') {
            const sub = subscribers.find(s => s.id === editSubscriberId);
            if (sub) {
                companyName = sub.name;
                if (sub.isCapped && meterAmount > sub.capAmount) {
                    finalAmount = sub.capAmount;
                }
            }
        }

        const updatedService: Omit<Service, 'id'> = {
            amount: finalAmount,
            originalAmount: meterAmount !== finalAmount ? meterAmount : undefined,
            companyName: editType === 'company' ? companyName : undefined,
            subscriberId: editType === 'company' ? editSubscriberId : undefined,
            observation: editObservation || undefined,
            type: editType,
            isPaid: editType === 'company' ? editIsPaid : undefined,
            timestamp: editingService.timestamp
        };

        updateService(editingService.id, updatedService);
        showToast('Servicio actualizado');
        setEditingService(null);
    };

    // Handle Add
    const handleAdd = () => {
        setIsAddingService(true);
        setEditAmount('');
        setEditSubscriberId('');
        setEditObservation('');
        setEditType('normal');
        setEditIsPaid(false);
    };

    // Handle Save Add
    const handleSaveAdd = () => {
        if (!editAmount) {
            toast.error('El importe es obligatorio');
            return;
        }

        const dateToUse = selectedDate || (isSameMonth(new Date(), viewDate) ? new Date() : startOfMonth(viewDate));

        const meterAmount = parseFloat(editAmount);
        let finalAmount = meterAmount;
        let companyName: string | undefined;

        if (editType === 'company') {
            const sub = subscribers.find(s => s.id === editSubscriberId);
            if (sub) {
                companyName = sub.name;
                if (sub.isCapped && meterAmount > sub.capAmount) {
                    finalAmount = sub.capAmount;
                }
            }
        }

        const newService: Omit<Service, 'id'> = {
            amount: finalAmount,
            originalAmount: meterAmount !== finalAmount ? meterAmount : undefined,
            companyName: editType === 'company' ? companyName : undefined,
            subscriberId: editType === 'company' ? editSubscriberId : undefined,
            observation: editObservation || undefined,
            type: editType as 'normal' | 'company',
            isPaid: editType === 'company' ? editIsPaid : undefined,
            timestamp: dateToUse.toISOString(),
            source: 'manual'
        };

        addService(newService);
        showToast('Servicio añadido');
        setIsAddingService(false);
        handleCancelEdit();
    };

    // Handle Cancel Edit
    const handleCancelEdit = () => {
        setEditingService(null);
        setEditAmount('');
        setEditSubscriberId('');
        setEditObservation('');
        setEditType('normal');
        setEditIsPaid(false);
    };

    const togglePaid = (service: Service) => {
        const updatedService: Omit<Service, 'id'> = {
            ...service,
            isPaid: !service.isPaid
        };
        // @ts-ignore - id is handled by updateService
        delete updatedService.id;
        updateService(service.id, updatedService);
        showToast(updatedService.isPaid ? 'Marcado como cobrado' : 'Marcado como pendiente');
    };

    // PDF Export Logic
    const exportPDF = async () => {
        try {
            const doc = new jsPDF() as any;
            const dateStr = showFilters ? `Filtrado Personalizado` : (selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : format(viewDate, "MMMM 'de' yyyy", { locale: es }));
            const fileName = `codiatax_historial_${new Date().getTime()}.pdf`;

            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text("CODIATAX - Histórico de Servicios", 14, 20);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Periodo: ${dateStr}`, 14, 28);

            doc.setFillColor(245, 245, 245);
            doc.rect(14, 35, 182, 20, 'F');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Servicios: ${filteredServices.length}`, 20, 48);
            doc.text(`Importe Total: ${totalAmount.toFixed(2)} €`, 150, 48, { align: 'right' });

            const tableData = filteredServices.map(s => [
                format(new Date(s.timestamp), 'dd/MM/yy HH:mm'),
                s.type === 'company' ? (s.companyName || '') : 'Normal',
                s.observation || '-',
                s.amount.toFixed(2) + ' €'
            ]);

            autoTable(doc, {
                startY: 60,
                head: [['Fecha/Hora', 'Cliente', 'Observaciones', 'Importe']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
                styles: { fontSize: 9 },
            });

            if (Capacitor.isNativePlatform()) {
                const pdfBase64 = (doc as any).output('datauristring').split(',')[1];
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: pdfBase64,
                    directory: Directory.Cache
                });
                await Share.share({
                    title: 'Histórico Codiatax',
                    url: result.uri,
                });
            } else {
                doc.save(fileName);
            }

        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Error al exportar PDF");
        }
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Histórico Diario</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleAdd} className="btn-primary" style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        cursor: 'pointer'
                    }}>
                        <Plus size={24} />
                    </button>
                    <button onClick={toggleFilters} className="btn-ghost" style={{ padding: '8px', color: showFilters ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', border: 'none', background: 'none' }}>
                        <Search size={24} />
                    </button>
                    <ExportMenu />
                </div>
            </div>

            {/* Edit Modal */}
            {editingService && (
                <div className="card" style={{ marginBottom: '1rem', border: '2px solid var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Editar Servicio</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tipo</label>
                            <select
                                value={editType}
                                onChange={e => setEditType(e.target.value as 'normal' | 'company' | 'facturado')}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            >
                                <option value="normal">Normal</option>
                                <option value="company">Empresa</option>
                                <option value="facturado">Facturado</option>
                            </select>
                        </div>

                        {editType === 'company' && (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seleccionar Abonado</label>
                                    <select
                                        value={editSubscriberId}
                                        onChange={e => setEditSubscriberId(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">-- Elige un abonado --</option>
                                        {subscribers.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                                    <input
                                        type="checkbox"
                                        id="editIsPaid"
                                        checked={editIsPaid}
                                        onChange={e => setEditIsPaid(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    <label htmlFor="editIsPaid" style={{ fontSize: '0.85rem' }}>¿Está cobrado?</label>
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Importe (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Observaciones</label>
                            <input
                                type="text"
                                value={editObservation}
                                onChange={e => setEditObservation(e.target.value)}
                                placeholder="Opcional"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onClick={handleSaveEdit} className="btn btn-primary" style={{ flex: 1 }}>
                                Guardar Cambios
                            </button>
                            <button onClick={handleCancelEdit} className="btn-ghost" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddingService && (
                <div className="card" style={{ marginBottom: '1rem', border: '2px solid var(--accent-primary)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--accent-primary)' }}>Nuevo Registro Histórico</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {format(selectedDate || (isSameMonth(new Date(), viewDate) ? new Date() : startOfMonth(viewDate)), 'dd/MM/yyyy')}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tipo</label>
                            <select
                                value={editType}
                                onChange={e => setEditType(e.target.value as 'normal' | 'company' | 'facturado')}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            >
                                <option value="normal">Normal</option>
                                <option value="company">Empresa</option>
                                <option value="facturado">Facturado</option>
                            </select>
                        </div>

                        {editType === 'company' && (
                            <>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seleccionar Abonado</label>
                                    <select
                                        value={editSubscriberId}
                                        onChange={e => setEditSubscriberId(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">-- Elige un abonado --</option>
                                        {subscribers.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                                    <input
                                        type="checkbox"
                                        id="addIsPaid"
                                        checked={editIsPaid}
                                        onChange={e => setEditIsPaid(e.target.checked)}
                                        style={{ width: 'auto' }}
                                    />
                                    <label htmlFor="addIsPaid" style={{ fontSize: '0.85rem' }}>¿Está cobrado?</label>
                                </div>
                            </>
                        )}

                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Importe (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                placeholder="0.00"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', fontWeight: 'bold' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Observaciones</label>
                            <input
                                type="text"
                                value={editObservation}
                                onChange={e => setEditObservation(e.target.value)}
                                placeholder="Opcional"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button onClick={handleSaveAdd} className="btn btn-primary" style={{ flex: 1 }}>
                                Crear Registro
                            </button>
                            <button onClick={() => { setIsAddingService(false); handleCancelEdit(); }} className="btn-ghost" style={{ flex: 1, border: '1px solid var(--border-color)' }}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showFilters && (
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <select className="input" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
                            <option value="">Día</option>
                            {Array.from({ length: 31 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                        </select>
                        <select className="input" value={filterMonth.toString()} onChange={e => setFilterMonth(parseInt(e.target.value))}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMM', { locale: es })}</option>
                            ))}
                        </select>
                        <select className="input" value={filterYear.toString()} onChange={e => setFilterYear(parseInt(e.target.value))}>
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar concepto..."
                        className="input"
                        value={filterConcept}
                        onChange={e => setFilterConcept(e.target.value)}
                        style={{ width: '100%' }}
                    />
                </div>
            )}

            {!showFilters && (
                <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <button onClick={prevMonth} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ChevronLeft /></button>
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{format(viewDate, 'MMMM yyyy', { locale: es })}</span>
                        <button onClick={nextMonth} className="btn-ghost" style={{ border: 'none', background: 'none', cursor: 'pointer' }}><ChevronRight /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{d}</div>
                        ))}

                        {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {daysInMonth.map(day => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const hasData = hasServices(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                    style={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: isSelected ? 'var(--accent-primary)' : (isToday ? 'rgba(59, 130, 246, 0.2)' : 'transparent'),
                                        color: isSelected ? '#fff' : 'var(--text-primary)',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {getDate(day)}
                                    {hasData && !isSelected && (
                                        <div style={{ position: 'absolute', bottom: '2px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1rem', opacity: 0.8 }}>
                        {selectedDate ? `Servicios del día ${getDate(selectedDate)}` : 'Resultados'}
                    </h3>
                    <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>Total: {totalAmount.toFixed(2)} €</span>
                </div>

                {filteredServices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No hay servicios para mostrar
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredServices.map((service, index) => (
                            <div key={index} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {service.companyName || 'Servicio'}
                                        {service.type === 'company' && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: service.isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: service.isPaid ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
                                            }}>
                                                {service.isPaid ? 'COBRADO' : 'PENDIENTE'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {format(new Date(service.timestamp), 'dd MMM - HH:mm', { locale: es })}
                                    </div>
                                    {service.originalAmount && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Taxímetro: {service.originalAmount.toFixed(2)}€ (Tope aplicado)
                                        </div>
                                    )}
                                    {service.observation && (
                                        <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '2px' }}>"{service.observation}"</div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        {service.amount.toFixed(2)} €
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {service.type === 'company' && (
                                            <button
                                                onClick={() => togglePaid(service)}
                                                style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: service.isPaid ? 'var(--success)' : 'var(--warning)' }}
                                                title={service.isPaid ? "Cambiar a Pendiente" : "Marcar como Cobrado"}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    {service.isPaid ? (
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    ) : (
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                    )}
                                                    {service.isPaid && <polyline points="22 4 12 14.01 9 11.01"></polyline>}
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(service)}
                                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
                                            title="Editar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(service.id)}
                                            style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                            title="Borrar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
