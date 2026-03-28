import React, { useState, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useServices } from '../context/ServiceContext';
import { useUI } from '../context/UIContext';
import { 
    Save, History, Receipt, FileText, ChevronDown, Upload, 
    Trash2, Edit2, X, Plus, PiggyBank, Car, Briefcase, 
    Settings, AlertCircle, TrendingDown, RefreshCw, CheckCircle2
} from 'lucide-react';
import { format } from '../utils/dateHelpers';
import { Expense } from '../types';
import { parseFuelPDF } from '../utils/fuelParser';
import { motion, AnimatePresence } from 'framer-motion';
import DeleteConfirmModal from '../components/Common/DeleteConfirmModal';

const Expenses: React.FC = () => {
    const { user } = useAuth();
    const { addExpense, updateExpense, deleteExpense, expenses, annualConfig, updateAnnualConfig } = useServices();
    const { showToast } = useUI();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [expenseType, setExpenseType] = useState<string>('vehicle_maintenance');
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [agencyFrequency, setAgencyFrequency] = useState<string>('Mensual');
    const [isManual, setIsManual] = useState<boolean>(false);
    const [expandedExpenseId, setExpandedExpenseId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
    const typeMenuRef = useRef<HTMLDivElement>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null; label: string }>({
        isOpen: false,
        id: null,
        label: ''
    });

    const categories = [
        {
            group: 'Veh?culo (Taxi)',
            icon: Car,
            options: [
                { value: 'gasoil', label: 'Gasoil / Gasolina', icon: '⛽' },
                { value: 'vehicle_maintenance', label: 'Mantenimiento / Taller', icon: '🔧' },
                { value: 'vehicle_insurance', label: 'Seguro del Coche', icon: '🛡️' },
                { value: 'vehicle_cleaning', label: 'Lavado / Limpieza', icon: '✨' },
                { value: 'vehicle_misc', label: 'Otros gastos veh?culo', icon: '🚗' }
            ]
        },
        {
            group: 'Negocio',
            icon: Briefcase,
            options: [
                { value: 'autonomous_quota', label: 'Cuota de aut?nomo', icon: '👤' },
                { value: 'agency_fees', label: 'Gestor?a', icon: '🏢' },
                { value: 'taxes', label: 'Impuestos / Tasas', icon: '⚖️' },
                { value: 'association', label: 'Asociaci?n / Emisora', icon: '📻' },
                { value: 'business_misc', label: 'Otros gastos negocio', icon: '💼' }
            ]
        },
        {
            group: 'Personalizado',
            icon: Settings,
            options: [
                { value: 'manual', label: 'Añadir manualmente...', icon: '➕' }
            ]
        }
    ];

    const parseYearMonth = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return { year: date.getFullYear(), month: date.getMonth() + 1 };
    };

    const getNextMonth = (year: number, month: number) => {
        if (month === 12) return { year: year + 1, month: 1 };
        return { year, month: month + 1 };
    };
    
    const selectedCategory = useMemo(() => {
        for (const group of categories) {
            const opt = group.options.find(o => o.value === expenseType);
            if (opt) return opt;
        }
        return null;
    }, [expenseType]);

    const getExpenseAccent = (value?: string) => {
        switch (value) {
            case 'gasoil':
                return {
                    bg: 'rgba(59, 130, 246, 0.14)',
                    border: 'rgba(59, 130, 246, 0.2)',
                    color: '#1d4ed8'
                };
            case 'vehicle_maintenance':
            case 'vehicle_misc':
                return {
                    bg: 'rgba(245, 158, 11, 0.16)',
                    border: 'rgba(245, 158, 11, 0.22)',
                    color: '#b45309'
                };
            case 'vehicle_insurance':
                return {
                    bg: 'rgba(16, 185, 129, 0.14)',
                    border: 'rgba(16, 185, 129, 0.2)',
                    color: '#047857'
                };
            case 'vehicle_cleaning':
                return {
                    bg: 'rgba(6, 182, 212, 0.14)',
                    border: 'rgba(6, 182, 212, 0.2)',
                    color: '#0f766e'
                };
            case 'autonomous_quota':
            case 'agency_fees':
            case 'association':
                return {
                    bg: 'rgba(139, 92, 246, 0.14)',
                    border: 'rgba(139, 92, 246, 0.2)',
                    color: '#6d28d9'
                };
            case 'taxes':
                return {
                    bg: 'rgba(239, 68, 68, 0.14)',
                    border: 'rgba(239, 68, 68, 0.2)',
                    color: '#b91c1c'
                };
            case 'business_misc':
            case 'manual':
                return {
                    bg: 'rgba(107, 114, 128, 0.16)',
                    border: 'rgba(107, 114, 128, 0.22)',
                    color: '#374151'
                };
            default:
                return {
                    bg: 'rgba(var(--accent-primary-rgb), 0.12)',
                    border: 'rgba(var(--accent-primary-rgb), 0.16)',
                    color: 'var(--accent-primary)'
                };
        }
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
                setIsTypeMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIconForCategory = (cat: string) => {
        for (const group of categories) {
            const opt = group.options.find(o => o.value === cat);
            if (opt) return opt.icon;
        }
        return '💰';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        let finalAmount = parseFloat(amount.replace(',', '.'));
        let finalDesc = description;
        let finalCategory = expenseType;

        if (expenseType === 'agency_fees') {
            const multipliers: Record<string, number> = { 'Mensual': 1, 'Trimestral': 3, 'Semestral': 6, 'Anual': 12 };
            finalAmount = finalAmount * (multipliers[agencyFrequency] || 1);
            finalDesc = `Gestor?a (${agencyFrequency})`;
        } else if (expenseType === 'autonomous_quota') {
            finalDesc = description || 'Cuota de aut?nomo';
        } else if (expenseType === 'manual') {
            finalCategory = 'custom';
            if (!finalDesc) finalDesc = 'Gasto Manual';
        } else {
            if (!finalDesc) {
                const group = categories.find(c => c.options.find(o => o.value === expenseType));
                const option = group?.options.find(o => o.value === expenseType);
                finalDesc = option ? option.label : 'Gasto General';
            }
        }

        const existingExpense = editingId ? expenses.find(e => e.id === editingId) : undefined;
        const { id, ...restExisting } = existingExpense || {};

        const expenseData: Omit<Expense, 'id'> = {
            ...restExisting,
            category: finalCategory,
            description: finalDesc,
            amount: finalAmount,
            timestamp: existingExpense ? existingExpense.timestamp : new Date().toISOString(),
            type: user?.role === 'asalariado' ? 'labor' : 'expense'
        };

        if (editingId) {
            updateExpense(editingId, expenseData);
            showToast('Gasto actualizado correctamente');
            setEditingId(null);
        } else {
            addExpense(expenseData);
            showToast('Gasto registrado correctamente');
        }

        setAmount('');
        setDescription('');
        if (expenseType === 'manual') setExpenseType('vehicle_maintenance');
        setIsManual(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await parseFuelPDF(file);

            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const parsedMonth = parseInt(result.month, 10);
            const parsedYear = parseInt(result.year, 10);

            if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12 || !Number.isInteger(parsedYear)) {
                showToast('No se pudo identificar correctamente el mes del PDF', 'error');
                return;
            }

            const monthLabel = monthNames[parsedMonth - 1];

            const existingMonthlyFuel = expenses
                .filter((expense) => expense.category === 'gasoil' && expense.is_monthly_summary)
                .map((expense) => parseYearMonth(expense.timestamp))
                .filter((value): value is { year: number; month: number } => value !== null)
                .sort((a, b) => (a.year - b.year) || (a.month - b.month));

            const duplicateMonth = existingMonthlyFuel.some((value) => value.year === parsedYear && value.month === parsedMonth);
            if (duplicateMonth) {
                showToast(`Ya existe el resumen de ${monthLabel} ${parsedYear}`, 'error');
                return;
            }

            if (existingMonthlyFuel.length > 0) {
                const latest = existingMonthlyFuel[existingMonthlyFuel.length - 1];
                const expectedNext = getNextMonth(latest.year, latest.month);
                if (expectedNext.year !== parsedYear || expectedNext.month !== parsedMonth) {
                    const expectedLabel = `${monthNames[expectedNext.month - 1]} ${expectedNext.year}`;
                    showToast(`Debes cargar primero ${expectedLabel} para mantener el orden mensual`, 'error');
                    return;
                }
            }

            const safeMonthTimestamp = new Date(parsedYear, parsedMonth, 0, 12, 0, 0).toISOString();

            const expenseData: Omit<Expense, 'id'> = {
                category: 'gasoil',
                description: `Combustible - ${monthLabel} ${parsedYear}`,
                amount: result.totalAmount,
                timestamp: safeMonthTimestamp,
                type: user?.role === 'asalariado' ? 'labor' : 'expense',
                is_monthly_summary: true,
                metadata: {
                    tickets: result.tickets
                }
            };

            await addExpense(expenseData);
            showToast(`Factura de ${monthLabel} procesada correctamente`);
        } catch (error) {
            console.error('Error processing PDF:', error);
            showToast('Error al procesar el PDF', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setAmount(expense.amount.toString());
        setDescription(expense.description);

        const isStandard = categories.some(g => g.options.some(o => o.value === expense.category));

        if (isStandard) {
            setExpenseType(expense.category);
            setIsManual(false);
        } else {
            setExpenseType('manual');
            setIsManual(true);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: number) => {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            setDeleteModal({
                isOpen: true,
                id: id,
                label: expense.description
            });
        }
    };

    const confirmDelete = () => {
        if (deleteModal.id !== null) {
            deleteExpense(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null, label: '' });
            showToast('Gasto eliminado correctamente');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount('');
        setDescription('');
        setExpenseType('vehicle_maintenance');
    };

    const handleTypeChange = (val: string) => {
        setExpenseType(val);
        setIsManual(val === 'manual');
        setDescription('');
        setIsTypeMenuOpen(false);
    };

    const toggleExpand = (id: number) => {
        setExpandedExpenseId(expandedExpenseId === id ? null : id);
    };

    // Shared styles for the premium UI
    const cardBaseStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '8px',
        display: 'block'
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

    return (
        <div className="page-container" style={{ paddingBottom: '2rem' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
            >
                {/* Header & Quick Action */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Gestion de Gastos</h1>
                        <p className="text-muted text-sm mt-1">Control de costes operativos</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept=".pdf"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="icon-btn"
                            style={{ 
                                width: '48px', 
                                height: '48px', 
                                background: 'rgba(var(--accent-primary-rgb), 0.1)', 
                                color: 'var(--accent-primary)',
                                border: '1px solid rgba(var(--accent-primary-rgb), 0.2)'
                            }}
                        >
                            {isUploading ? <RefreshCw size={20} className="spin" /> : <Upload size={20} />}
                        </motion.button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid gap-6">
                    {/* KM Config Card */}
                    <div className="card" style={{ ...cardBaseStyle, padding: '1.25rem' }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '10px', 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                color: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrendingDown size={18} />
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Kilometraje anual 2026</span>
                        </div>
                        <div className="grid grid-2 gap-3">
                            <div>
                                <label style={labelStyle}>Inicio de ano</label>
                                <input
                                    type="number"
                                    value={annualConfig.yearStartKm}
                                    onChange={e => updateAnnualConfig({ yearStartKm: parseInt(e.target.value) || 0 })}
                                    style={{ ...inputStyle, padding: '0.75rem' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Fin de ano</label>
                                <div style={{ ...inputStyle, padding: '0.75rem', opacity: 0.6, background: 'var(--bg-tertiary)' }}>
                                    {annualConfig.yearEndKm || '---'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Form */}
                    <div className="card" style={cardBaseStyle}>
                        <div className="flex items-center gap-2 mb-6">
                            <Plus size={20} className="text-accent-primary" />
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{editingId ? 'Editar Registro' : 'Nuevo Gasto'}</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div>
                                <label style={labelStyle}>Tipo de Gasto</label>
                                <div ref={typeMenuRef} style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsTypeMenuOpen(open => !open)}
                                        style={{
                                            ...inputStyle,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            textAlign: 'left',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                            <span style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '14px',
                                                background: `linear-gradient(135deg, ${getExpenseAccent(selectedCategory?.value).bg}, rgba(255,255,255,0.65))`,
                                                border: `1px solid ${getExpenseAccent(selectedCategory?.value).border}`,
                                                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem',
                                                fontWeight: '900',
                                                color: getExpenseAccent(selectedCategory?.value).color,
                                                flexShrink: 0
                                            }}>
                                                {selectedCategory?.icon || '💰'}
                                            </span>
                                            <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                <span style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                    Categoria
                                                </span>
                                                <span className="truncate" style={{ fontSize: '0.95rem', fontWeight: '800' }}>
                                                    {selectedCategory?.label || 'Selecciona una categoria'}
                                                </span>
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            style={{
                                                opacity: 0.7,
                                                transform: isTypeMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}
                                        />
                                    </button>

                                    <AnimatePresence>
                                        {isTypeMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 'calc(100% + 10px)',
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 100,
                                                    background: 'var(--bg-elevated)',
                                                    backdropFilter: 'blur(16px)',
                                                    WebkitBackdropFilter: 'blur(16px)',
                                                    border: '1px solid var(--border-color)',
                                                    borderRadius: '24px',
                                                    boxShadow: 'var(--shadow-floating)',
                                                    padding: '0.85rem',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '1rem',
                                                    maxHeight: '420px',
                                                    overflowY: 'auto',
                                                    marginTop: '10px'
                                                }}
                                            >
                                                {categories.map(group => (
                                                    <div key={group.group}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 0.5rem' }}>
                                                            <group.icon size={12} /> {group.group.toUpperCase()}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {group.options.map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleTypeChange(opt.value);
                                                                        setIsTypeMenuOpen(false);
                                                                    }}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'space-between',
                                                                        gap: '12px',
                                                                        width: '100%',
                                                                        border: 'none',
                                                                        borderRadius: '14px',
                                                                        padding: '0.85rem 0.9rem',
                                                                        background: expenseType === opt.value ? 'rgba(var(--accent-primary-rgb), 0.12)' : 'transparent',
                                                                        color: 'var(--text-primary)',
                                                                        cursor: 'pointer',
                                                                        textAlign: 'left'
                                                                    }}
                                                                >
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                                                        <span style={{
                                                                            width: '30px',
                                                                            height: '30px',
                                                                            borderRadius: '10px',
                                                                            background: expenseType === opt.value ? getExpenseAccent(opt.value).bg : 'var(--bg-secondary)',
                                                                            border: `1px solid ${expenseType === opt.value ? getExpenseAccent(opt.value).border : 'rgba(var(--accent-primary-rgb), 0.08)'}`,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: '900',
                                                                            color: expenseType === opt.value ? getExpenseAccent(opt.value).color : 'var(--text-muted)',
                                                                            textTransform: 'uppercase',
                                                                            flexShrink: 0
                                                                        }}>{opt.icon}</span>
                                                                        <span className="truncate" style={{ fontSize: '0.9rem', fontWeight: '700' }}>{opt.label}</span>
                                                                    </span>
                                                                    {expenseType === opt.value && <CheckCircle2 size={16} className="text-accent-primary" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <AnimatePresence>
                                {(isManual || expenseType.includes('misc') || expenseType === 'vehicle_maintenance' || expenseType === 'vehicle_cleaning') && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label style={labelStyle}>Descripcion {isManual && '*'}</label>
                                        <input
                                            type="text"
                                            placeholder={isManual ? "Nombre del gasto..." : "Nota adicional"}
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            required={isManual}
                                            style={inputStyle}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {expenseType === 'agency_fees' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <label style={labelStyle}>Frecuencia de facturacion</label>
                                    <div className="grid grid-2 gap-2">
                                        {['Mensual', 'Trimestral', 'Semestral', 'Anual'].map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                onClick={() => setAgencyFrequency(f)}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-color)',
                                                    background: agencyFrequency === f ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                                    color: agencyFrequency === f ? 'white' : 'var(--text-primary)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            <div>
                                <label style={labelStyle}>Importe Total (con IVA)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        style={{ 
                                            ...inputStyle, 
                                            paddingLeft: '2.5rem', 
                                            fontSize: '1.75rem', 
                                            fontWeight: '900', 
                                            color: 'var(--danger)',
                                            letterSpacing: '-0.02em' 
                                        }}
                                        required
                                    />
                                    <div style={{ 
                                        position: 'absolute', 
                                        left: '1rem', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        fontSize: '1.25rem', 
                                        fontWeight: '800', 
                                        color: 'var(--text-muted)' 
                                    }}>
                                        €
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '1rem', borderRadius: '18px', gap: '8px' }}
                                >
                                    <Save size={20} />
                                    {editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}
                                </motion.button>
                                {editingId && (
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="btn btn-secondary"
                                        style={{ padding: '1rem', borderRadius: '18px' }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Expenses List */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <History size={18} className="text-muted" />
                                Historial Reciente
                            </h3>
                            <span className="badge" style={{ fontSize: '0.7rem' }}>{expenses.length} registros</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <AnimatePresence>
                                {expenses.length === 0 ? (
                                    <div className="card text-center py-12" style={{ ...cardBaseStyle, borderStyle: 'dashed' }}>
                                        <div style={{ opacity: 0.3, marginBottom: '1rem' }}><Receipt size={48} style={{ margin: '0 auto' }} /></div>
                                        <p className="text-muted">No hay gastos registrados todavia</p>
                                    </div>
                                ) : (
                                    expenses.slice(0, 20).map((expense, index) => (
                                        <motion.div
                                            key={expense.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="card"
                                            style={{ 
                                                ...cardBaseStyle, 
                                                padding: '1rem',
                                                borderBottom: expense.is_monthly_summary && expandedExpenseId === expense.id ? 'none' : '1px solid var(--border-color)',
                                                borderRadius: expense.is_monthly_summary && expandedExpenseId === expense.id ? '24px 24px 0 0' : '24px'
                                            }}
                                        >
                                            <div 
                                                className="flex items-center justify-between pointer"
                                                onClick={() => expense.is_monthly_summary && toggleExpand(expense.id)}
                                            >
                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                    <div style={{ 
                                                        width: '42px', 
                                                        height: '42px', 
                                                        borderRadius: '12px', 
                                                        background: 'var(--bg-secondary)', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        fontSize: '1.25rem',
                                                        border: '1px solid var(--border-color)'
                                                    }}>
                                                        {getIconForCategory(expense.category)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 style={{ fontWeight: '750', fontSize: '0.95rem', margin: 0 }} className="truncate">
                                                                {expense.description}
                                                            </h4>
                                                            {expense.is_monthly_summary && (
                                                                <motion.div animate={{ rotate: expandedExpenseId === expense.id ? 180 : 0 }}>
                                                                    <ChevronDown size={14} className="text-accent-primary" />
                                                                </motion.div>
                                                            )}
                                                        </div>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: '600' }}>
                                                            {format(new Date(expense.timestamp), 'd MMMM yyyy', { locale: es })}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: '850', color: 'var(--danger)', fontSize: '1.1rem' }}>
                                                            -{expense.amount.toFixed(2)}€
                                                        </div>
                                                    </div>
                                                    
                                                    {!expense.is_monthly_summary && (
                                                        <div className="flex gap-1">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(expense); }}
                                                                className="icon-btn-sm"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(expense.id); }}
                                                                className="icon-btn-sm text-danger"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expandable Content for PDF Uploads */}
                                            {expandedExpenseId === expense.id && expense.metadata?.tickets && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-4 pt-4 border-t"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                >
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Receipt size={14} className="text-accent-primary" />
                                                        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>Desglose de Factura</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        {expense.metadata.tickets.map((ticket, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="flex justify-between items-center py-2 px-3 bg-secondary rounded-xl"
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{format(new Date(ticket.date), 'dd/MM/yyyy')}</span>
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{ticket.liters.toFixed(2)} Litros</span>
                                                                </div>
                                                                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{ticket.amount.toFixed(2)}€</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>

            <DeleteConfirmModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Eliminar este gasto"
                message="Este registro se borrara permanentemente de tu contabilidad."
                itemLabel={deleteModal.label}
            />
        </div>
    );
};

// Simplified local translation helper
const es: any = {
    code: 'es',
    formatDistance: () => '',
    formatLong: { date: () => '', time: () => '', dateTime: () => '' },
    localize: { 
        month: (n: number) => ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][n],
        day: (n: number) => ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][n]
    },
    match: {},
    options: { weekStartsOn: 1, firstWeekContainsDate: 4 }
};

export default Expenses;
