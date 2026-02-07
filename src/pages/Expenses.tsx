import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, History, Receipt } from 'lucide-react';
import { format } from '../utils/dateHelpers';
import { Expense } from '../types';

const Expenses: React.FC = () => {
    const { addExpense, updateExpense, deleteExpense, expenses, showToast, annualConfig, updateAnnualConfig, user } = useApp();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [expenseType, setExpenseType] = useState<string>('vehicle_maintenance');
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [agencyFrequency, setAgencyFrequency] = useState<string>('Mensual');
    const [isManual, setIsManual] = useState<boolean>(false);

    const categories = [
        {
            group: 'Vehículo (Taxi)',
            style: { fontWeight: 'bold' as const, color: 'var(--accent-primary)', backgroundColor: 'var(--bg-secondary)' },
            options: [
                { value: 'gasoil', label: 'Gasoil / Gasolina' },
                { value: 'vehicle_maintenance', label: 'Mantenimiento / Taller' },
                { value: 'vehicle_insurance', label: 'Seguro del Coche' },
                { value: 'vehicle_cleaning', label: 'Lavado / Limpieza' },
                { value: 'vehicle_misc', label: 'Otros Gastos Vehículo' }
            ]
        },
        {
            group: 'Negocio',
            style: { fontWeight: 'bold' as const, color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' },
            options: [
                { value: 'autonomous_quota', label: 'Cuota de Autónomo' },
                { value: 'agency_fees', label: 'Gestoría' },
                { value: 'taxes', label: 'Impuestos / Tasas' },
                { value: 'association', label: 'Asociación / Emisora' },
                { value: 'business_misc', label: 'Otros Gastos Negocio' }
            ]
        },
        {
            group: 'Manual / Personalizado',
            style: { fontWeight: 'bold' as const, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' },
            options: [
                { value: 'manual', label: 'Añadir Manualmente...' }
            ]
        }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount) return;

        let finalAmount = parseFloat(amount);
        let finalDesc = description;
        let finalCategory = expenseType;

        if (expenseType === 'agency_fees') {
            const multipliers: Record<string, number> = { 'Mensual': 1, 'Trimestral': 3, 'Semestral': 6, 'Anual': 12 };
            finalAmount = finalAmount * (multipliers[agencyFrequency] || 1);
            finalDesc = `Gestoría (${agencyFrequency})`;
        } else if (expenseType === 'autonomous_quota') {
            finalDesc = description || 'Cuota de Autónomo';
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

        const expenseData: Omit<Expense, 'id'> = {
            category: finalCategory,
            description: finalDesc,
            amount: finalAmount,
            timestamp: editingId ? expenses.find(e => e.id === editingId)?.timestamp || new Date().toISOString() : new Date().toISOString(),
            type: user?.role === 'employee' ? 'labor' : 'expense'
        };

        if (editingId) {
            updateExpense(editingId, expenseData);
            showToast('Gasto actualizado');
            setEditingId(null);
        } else {
            addExpense(expenseData);
            showToast('Gasto guardado');
        }

        setAmount('');
        setDescription('');
        if (expenseType === 'manual') setExpenseType('vehicle_maintenance');
        setIsManual(false);
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
        if (confirm('¿Estas seguro de borrar este gasto?')) {
            deleteExpense(id);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setAmount('');
        setDescription('');
        setExpenseType('vehicle_maintenance');
    };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setExpenseType(val);
        setIsManual(val === 'manual');
        setDescription('');
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-primary)', margin: 0 }}>Registro Gastos del Taxi</h2>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                    Kilómetros Anuales
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Inicio de Año</label>
                        <input
                            type="number"
                            value={annualConfig.yearStartKm}
                            onChange={e => updateAnnualConfig({ yearStartKm: parseInt(e.target.value) || 0 })}
                            placeholder="Km iniciales"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem' }}>Fin de Año</label>
                        <input
                            type="number"
                            value={annualConfig.yearEndKm}
                            readOnly
                            placeholder="Al cerrar año"
                            style={{ opacity: 0.7 }}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label>Tipo de Gasto</label>
                        <select
                            value={expenseType}
                            onChange={handleTypeChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-input)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem'
                            }}
                        >
                            {categories.map((group, idx) => (
                                <optgroup key={idx} label={group.group} style={group.style}>
                                    {group.options.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 'normal' }}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {expenseType === 'agency_fees' && (
                        <div>
                            <label>Frecuencia de Pago</label>
                            <select
                                value={agencyFrequency}
                                onChange={e => setAgencyFrequency(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="Mensual">Mensual</option>
                                <option value="Trimestral">Trimestral</option>
                                <option value="Semestral">Semestral</option>
                                <option value="Anual">Anual</option>
                            </select>
                        </div>
                    )}

                    {(isManual || expenseType.includes('misc') || expenseType === 'vehicle_maintenance' || expenseType === 'vehicle_cleaning') && (
                        <div>
                            <label>Concepto / Detalle {isManual && '(Requerido)'}</label>
                            <input
                                type="text"
                                placeholder={isManual ? "Escribe el nombre del gasto..." : "Opcional: Detalle adicional"}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required={isManual}
                            />
                        </div>
                    )}

                    <div>
                        <label>Importe (€)</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', flex: 1 }}>
                            <Save size={20} style={{ marginRight: '8px' }} /> {editingId ? 'Actualizar Gasto' : 'Guardar Gasto'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} className="btn-ghost" style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <History size={20} style={{ marginRight: '8px' }} /> Últimos Gastos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {expenses.slice(0, 15).map(expense => (
                    <div key={expense.id} className="card" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)' }}>
                                <Receipt size={18} color="var(--text-secondary)" />
                            </div>
                            <div>
                                <p style={{ fontWeight: '500', margin: 0 }}>{expense.description}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{format(new Date(expense.timestamp), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--danger)', fontSize: '1rem' }}>
                                -{expense.amount.toFixed(2)} €
                            </span>

                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    onClick={() => handleEdit(expense)}
                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)' }}
                                    title="Editar"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(expense.id)}
                                    style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                    title="Borrar"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Expenses;
