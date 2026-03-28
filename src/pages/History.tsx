import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServiceContext';
import { useUI } from '../context/UIContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isSameWeek, getMonth, getYear, getDate, es } from '../utils/dateHelpers';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, TrendingUp, Filter, Calendar as CalendarIcon, DollarSign, Clock, FileDown, Trash2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import ExportMenu from '../components/Common/ExportMenu';
import { Service } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const History: React.FC = () => {
    const { user } = useAuth();
    const { services, addService, updateService, deleteService, subscribers } = useServices();
    const { showToast } = useUI();
    const toast = useToast();
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Filters
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [filterDay, setFilterDay] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<number>(getMonth(new Date()));
    const [filterYear, setFilterYear] = useState<number>(getYear(new Date()));
    const [filterConcept, setFilterConcept] = useState<string>('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | 'taxi' | 'company'>('all');

    // Section collapse state
    const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

    const toggleDate = (dateStr: string) => {
        setCollapsedDates((prev) => ({
            ...prev,
            [dateStr]: prev[dateStr] === undefined ? false : !prev[dateStr]
        }));
    };

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
        let results = services.filter(service => {
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
            // By default, show only the current week (starting on Monday)
            return isSameWeek(date, new Date(), { weekStartsOn: 1 });
        });

        // Apply type filter
        if (serviceTypeFilter === 'taxi') {
            results = results.filter(s => s.type === 'normal' || s.type === 'facturado');
        } else if (serviceTypeFilter === 'company') {
            results = results.filter(s => s.type === 'company');
        }

        return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [services, showFilters, filterDay, filterMonth, filterYear, filterConcept, selectedDate, viewDate, serviceTypeFilter]);

    // Group filtered services by day
    const groupedServices = useMemo(() => {
        const groups: { [key: string]: Service[] } = {};
        filteredServices.forEach(service => {
            const dateStr = format(new Date(service.timestamp), 'yyyy-MM-dd');
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(service);
        });

        return Object.keys(groups)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .map(dateStr => ({
                dateStr,
                date: new Date(groups[dateStr][0].timestamp),
                services: groups[dateStr],
                totalAmount: groups[dateStr].reduce((sum, s) => sum + s.amount, 0)
            }));
    }, [filteredServices]);

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Delete
    const handleDelete = (id: number) => {
        if (confirm(' €Estás seguro de borrar este servicio?')) {
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
        showToast('Servicio a €adido');
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
            amount: service.amount,
            originalAmount: service.originalAmount,
            companyName: service.companyName,
            subscriberId: service.subscriberId,
            observation: service.observation,
            type: service.type,
            timestamp: service.timestamp,
            source: service.source,
            isPaid: !service.isPaid
        };
        updateService(service.id, updatedService);
        showToast(updatedService.isPaid ? 'Marcado como cobrado' : 'Marcado como pendiente');
    };

    // PDF Export Logic
    const exportPDF = async () => {
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);
            const doc = new jsPDF() as any;
            const dateStr = showFilters ? `Filtrado Personalizado` : (selectedDate ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es }) : format(viewDate, "MMMM 'de' yyyy", { locale: es }));
            const fileName = `codiatx_historial_${new Date().getTime()}.pdf`;

            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.text('CODIATAX - Histórico de Servicios', 14, 20);

            doc.setFontSize(11);
            doc.setTextColor(100, 100, 100);
            doc.text(`Periodo: ${dateStr}`, 14, 28);

            doc.setFillColor(245, 245, 245);
            doc.rect(14, 35, 182, 20, 'F');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Total Servicios: ${filteredServices.length}`, 20, 48);
            doc.text(`Importe Total: ${totalAmount.toFixed(2)}  €`, 150, 48, { align: 'right' });

            const tableData = filteredServices.map(s => [
                format(new Date(s.timestamp), 'dd/MM/yy HH:mm'),
                s.type === 'company' ? (s.companyName || '') : (s.type === 'facturado' ? 'Facturado' : 'Normal'),
                s.observation || '-',
                s.amount.toFixed(2) + '  €'
            ]);

            autoTable(doc, {
                startY: 60,
                head: [['Fecha/Hora', 'Cliente', 'Observaciones', 'Importe']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246], textColor: 255 },
                styles: { fontSize: 9 },
            });            doc.save(fileName);

        } catch (error) {
            console.error("Export Error:", error);
            toast.error("Error al exportar PDF");
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.85rem 1rem',
        borderRadius: '14px',
        backgroundColor: 'var(--bg-input)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-light)',
        transition: 'all 0.2s',
        fontSize: '0.95rem',
        fontWeight: '500'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: '850',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
        display: 'block'
    };

    return (
        <div style={{ paddingBottom: '100px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Histórico</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Toda tu actividad registrada</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleFilters}
                        style={{ 
                            width: '44px',
                            height: '44px',
                            background: showFilters ? 'var(--accent-primary)' : 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '14px',
                            color: showFilters ? 'white' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'var(--shadow-premium)',
                            cursor: 'pointer'
                        }}
                    >
                        <Search size={22} />
                    </motion.button>
                    <ExportMenu />
                </div>
            </div>

            {/* Editing / Adding Area */}
            <AnimatePresence>
                {(editingService || isAddingService) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginBottom: '1.5rem' }}
                    >
                        <div style={{ 
                            background: 'var(--bg-card)', 
                            borderRadius: '24px', 
                            padding: '1.25rem', 
                            border: `2px solid var(--accent-primary)`,
                            boxShadow: 'var(--shadow-premium)'
                        }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {editingService ? <Edit2 size={18} /> : <Plus size={18} />}
                                {editingService ? 'Editar Servicio' : 'Nuevo Registro Histórico'}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={labelStyle}>Tipo</label>
                                        <select
                                            value={editType}
                                            onChange={e => setEditType(e.target.value as any)}
                                            style={inputStyle}
                                        >
                                            <option value="normal">Carrera Normal</option>
                                            <option value="company">Abonado</option>
                                            <option value="facturado">Facturado</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Importe ( €)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editAmount}
                                            onChange={e => setEditAmount(e.target.value)}
                                            placeholder="0.00"
                                            style={{ ...inputStyle, fontWeight: '900', fontSize: '1.1rem' }}
                                        />
                                    </div>
                                </div>

                                {editType === 'company' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <label style={labelStyle}>Seleccionar Abonado</label>
                                            <select
                                                value={editSubscriberId}
                                                onChange={e => setEditSubscriberId(e.target.value)}
                                                style={inputStyle}
                                            >
                                                <option value="">-- Elige un abonado --</option>
                                                {subscribers.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div 
                                            onClick={() => setEditIsPaid(!editIsPaid)}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                padding: '12px 14px',
                                                background: editIsPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                borderRadius: '14px',
                                                cursor: 'pointer',
                                                border: `1px solid ${editIsPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                            }}
                                        >
                                            {editIsPaid ? <CheckCircle2 size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
                                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: editIsPaid ? 'var(--success)' : 'var(--danger)' }}>
                                                {editIsPaid ? 'COBRADO' : 'PENDIENTE'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={labelStyle}>Observaciones</label>
                                    <input
                                        type="text"
                                        value={editObservation}
                                        onChange={e => setEditObservation(e.target.value)}
                                        placeholder="Ej: Recogida en hotel, peaje incluido..."
                                        style={inputStyle}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <motion.button 
                                        whileTap={{ scale: 0.98 }}
                                        onClick={editingService ? handleSaveEdit : handleSaveAdd}
                                        style={{ 
                                            flex: 2,
                                            padding: '0.85rem', 
                                            background: 'var(--accent-primary)', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '16px', 
                                            fontSize: '0.95rem', 
                                            fontWeight: '900', 
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingService ? 'Actualizar Registro' : 'Crear Registro'}
                                    </motion.button>
                                    <motion.button 
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCancelEdit || (() => setIsAddingService(false))}
                                        style={{ 
                                            flex: 1,
                                            padding: '0.85rem', 
                                            background: 'var(--bg-secondary)', 
                                            color: 'var(--text-primary)', 
                                            border: '1px solid var(--border-light)', 
                                            borderRadius: '16px', 
                                            fontSize: '0.95rem', 
                                            fontWeight: '800', 
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filters Section */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ 
                            background: 'var(--bg-card)', 
                            borderRadius: '24px', 
                            padding: '1.25rem', 
                            border: '1px solid var(--border-light)', 
                            boxShadow: 'var(--shadow-premium)',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                            <Filter size={18} color="var(--accent-primary)" />
                            <h3 style={{ fontSize: '1rem', fontWeight: '900', margin: 0 }}>Filtros de búsqueda</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px' }}>
                                <select value={filterDay} onChange={e => setFilterDay(e.target.value)} style={inputStyle}>
                                    <option value="">Día</option>
                                    {Array.from({ length: 31 }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                                </select>
                                <select value={filterMonth.toString()} onChange={e => setFilterMonth(parseInt(e.target.value))} style={inputStyle}>
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM', { locale: es })}</option>
                                    ))}
                                </select>
                                <select value={filterYear.toString()} onChange={e => setFilterYear(parseInt(e.target.value))} style={inputStyle}>
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por concepto o notas..."
                                value={filterConcept}
                                onChange={e => setFilterConcept(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Calendar View */}
            {!showFilters && (
                <div style={{ 
                    background: 'var(--bg-card)', 
                    borderRadius: '28px', 
                    padding: '1.5rem', 
                    border: '1px solid var(--border-light)', 
                    boxShadow: 'var(--shadow-premium)',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={prevMonth} style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></motion.button>
                        <span style={{ fontWeight: '950', textTransform: 'capitalize', fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{format(viewDate, 'MMMM yyyy', { locale: es })}</span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={nextMonth} style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></motion.button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '850', marginBottom: '8px' }}>{d}</div>
                        ))}

                        {Array.from({ length: (daysInMonth[0].getDay() + 6) % 7 }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}

                        {daysInMonth.map(day => {
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const hasData = hasServices(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <motion.button
                                    key={day.toString()}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                    style={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: '14px',
                                        border: 'none',
                                        backgroundColor: isSelected ? 'var(--accent-primary)' : (isToday ? 'rgba(var(--accent-primary-rgb), 0.12)' : 'transparent'),
                                        color: isSelected ? 'white' : 'var(--text-primary)',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: isSelected || isToday ? '900' : '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {getDate(day)}
                                    {hasData && !isSelected && (
                                        <div style={{ position: 'absolute', bottom: '4px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Results Section */}
            <div>
                {/* Segmented Control */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bg-card)', padding: '6px', borderRadius: '18px', border: '1px solid var(--border-light)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-premium)' }}>
                    {['all', 'taxi', 'company'].map(type => (
                        <button
                            key={type}
                            onClick={() => setServiceTypeFilter(type as any)}
                            style={{
                                padding: '8px',
                                border: 'none',
                                borderRadius: '14px',
                                background: serviceTypeFilter === type ? 'var(--accent-primary)' : 'transparent',
                                color: serviceTypeFilter === type ? 'white' : 'var(--text-muted)',
                                fontWeight: '900',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {type === 'all' ? 'Todo' : type === 'taxi' ? 'Taxi' : 'Abonados'}
                        </button>
                    ))}
                </div>

                {/* Summary Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', padding: '0 8px' }}>
                    <div>
                        <span style={labelStyle}>Periodo Seleccionado</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                            {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : (showFilters ? 'Resultados filtrados' : 'Esta semana')}
                        </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={labelStyle}>Recaudación</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', marginLeft: '2px' }}> €</span>
                        </div>
                    </div>
                </div>

                {/* List of Groups */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {groupedServices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', borderRadius: '28px', border: '1px dashed var(--border-light)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Search size={32} color="var(--text-muted)" />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontWeight: '750', fontSize: '1rem' }}>No se han encontrado servicios</p>
                            <p style={{ color: 'var(--text-muted)', fontWeight: '500', fontSize: '0.85rem' }}>Prueba a cambiar el rango de fechas o los filtros.</p>
                        </div>
                    ) : (
                        groupedServices.map(group => (
                            <div key={group.dateStr}>
                                <div 
                                    onClick={() => toggleDate(group.dateStr)}
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '10px 16px', 
                                        background: 'var(--bg-secondary)', 
                                        borderRadius: '14px', 
                                        cursor: 'pointer',
                                        marginBottom: '10px',
                                        border: '1px solid var(--border-light)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '24px', height: '24px', background: 'var(--bg-card)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                                            {collapsedDates[group.dateStr] === false ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </div>
                                        <span style={{ fontWeight: '850', fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                            {format(group.date, "EEEE, d 'de' MMMM", { locale: es })}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '950', color: 'var(--success)' }}>
                                        {group.totalAmount.toFixed(2)}  €
                                    </span>
                                </div>

                                <AnimatePresence>
                                    {collapsedDates[group.dateStr] === false && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}
                                        >
                                            {group.services.map(service => (
                                                <motion.div
                                                    key={service.id}
                                                    layout
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '20px',
                                                        padding: '1.15rem',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        border: '1px solid var(--border-light)',
                                                        boxShadow: 'var(--shadow-premium)',
                                                        borderLeft: `4px solid ${service.type === 'company' ? '#8b5cf6' : (service.type === 'facturado' ? 'var(--accent-primary)' : 'var(--success)')}`
                                                    }}
                                                >
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)' }}>
                                                                <Clock size={12} /> {format(new Date(service.timestamp), 'HH:mm')}
                                                            </div>
                                                            <span style={{ fontWeight: '900', fontSize: '0.98rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                                {service.companyName || (service.type === 'facturado' ? 'Facturado' : 'Carrera Taxi')}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                            {service.type === 'company' && (
                                                                <span 
                                                                    onClick={() => togglePaid(service)}
                                                                    style={{ 
                                                                        fontSize: '0.68rem', 
                                                                        fontWeight: '900', 
                                                                        padding: '2px 8px', 
                                                                        borderRadius: '5px', 
                                                                        background: service.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                                                        color: service.isPaid ? 'var(--success)' : 'var(--danger)',
                                                                        cursor: 'pointer',
                                                                        border: `1px solid ${service.isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                                                    }}
                                                                >
                                                                    {service.isPaid ? 'COBRADO' : 'PENDIENTE'}
                                                                </span>
                                                            )}
                                                            {service.observation && (
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: '500' }}>
                                                                    "{service.observation}"
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '12px' }}>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '1.25rem', fontWeight: '950', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                                                                {service.amount.toFixed(2)}<span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginLeft: '1px' }}> €</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', borderLeft: '1px solid var(--border-dim)', paddingLeft: '12px' }}>
                                                            <motion.button 
                                                                whileTap={{ scale: 0.9 }} 
                                                                onClick={() => handleEdit(service)} 
                                                                style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
                                                            >
                                                                <Edit2 size={16} />
                                                            </motion.button>
                                                            <motion.button 
                                                                whileTap={{ scale: 0.9 }} 
                                                                onClick={() => handleDelete(service.id)} 
                                                                style={{ padding: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.5 }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </motion.button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default History;


