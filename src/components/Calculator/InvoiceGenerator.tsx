import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, User, Settings, Save, Plus, Search,
    Download, Printer, Mail, ArrowLeft,
    CheckCircle2, AlertCircle, Calendar, MapPin,
    Trash2, AlertTriangle, ChevronDown, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { Invoice, DriverProfile } from '../../types';
import { invoiceService } from '../../services/invoiceService';
import { downloadInvoicePDF, printInvoicePDF, generateQRCodeDataUrl } from '../../utils/pdfGenerator';

// Animation Variants matching Home.tsx
const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

interface InvoiceGeneratorProps {
    initialData?: Partial<Invoice>;
    onClose?: () => void;
}

// Helpers
const toUpper = (str: string) => str.toUpperCase();
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const validateNIF = (nif: string): boolean => {
    // Basic Spanish NIF/NIE validation regex
    // Matches 8 digits + letter, or X/Y/Z + 7 digits + letter
    return /^[XYZ\d]\d{7}[A-Z]$/.test(nif);
};
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ initialData, onClose }) => {
    const { user } = useAuth();
    const { showToast } = useUI();
    const [view, setView] = useState<'history' | 'form' | 'profile'>('history');
    const [profile, setProfile] = useState<DriverProfile | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Form and Preview State
    const [formData, setFormData] = useState<Partial<Invoice>>(initialData || {
        series: '',
        dateEmission: new Date().toISOString().split('T')[0],
        dateService: new Date().toISOString().split('T')[0],
        ivaRate: 10,
        paymentMethod: 'Efectivo',
        baseAmount: 0,
        ivaAmount: 0,
        totalAmount: 0
    });

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            if (!user?.name) return;
            setIsLoading(true);
            try {
                const [prof, invs] = await Promise.all([
                    invoiceService.getProfile(user.name),
                    invoiceService.getInvoices(user.name)
                ]);

                // Ensure profile is never null to prevent rendering issues
                const finalProfile = prof || {
                    fullName: '',
                    dni: '',
                    nif: '',
                    address: '',
                    licenseNo: '',
                    municipality: '',
                    phone: '',
                    email: '',
                    regime: 'Autónomo - Estimación Directa Simplificada'
                } as DriverProfile;

                setProfile(finalProfile);
                setInvoices(invs);

                // If profile is completely empty (new user), force profile view
                if (!prof) {
                    setView('profile');
                } else if (initialData && view === 'history') {
                    // Only jump to form if we are in history (initial entry)
                    setView('form');
                }
            } catch (error) {
                console.error('Error loading invoicing data:', error);
                showToast('Error al cargar datos de facturación', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user?.name]); // Removed initialData from dependencies to prevent view resets on re-renders

    // VAT and Total Calculation
    // VAT and Total Calculation (Backwards from Total)
    useEffect(() => {
        const total = Number(formData.totalAmount) || 0;
        const rate = Number(formData.ivaRate) || 10;

        // Calculate Base and IVA from Total
        // Base = Total / (1 + Rate/100)
        const base = total / (1 + rate / 100);
        const iva = total - base;

        setFormData((prev: Partial<Invoice>) => {
            // Only update if values are different to avoid potential cycles (though dependency array handles it)
            if (prev.baseAmount === Number(base.toFixed(2)) && prev.ivaAmount === Number(iva.toFixed(2))) {
                return prev;
            }
            return {
                ...prev,
                baseAmount: Number(base.toFixed(2)),
                ivaAmount: Number(iva.toFixed(2))
            };
        });
    }, [formData.totalAmount, formData.ivaRate]);

    // Generate QR when opening preview
    useEffect(() => {
        const generateQR = async () => {
            if (isPreviewOpen && profile && formData.totalAmount) {
                const summary = `Factura: ${formData.series || ''}${formData.number || 'BORRADOR'}\nEmisor: ${profile.nif}\nTotal: ${formData.totalAmount.toFixed(2)} €\nFecha: ${new Date(formData.dateEmission!).toLocaleDateString('es-ES')}`;
                const url = await generateQRCodeDataUrl(summary);
                setQrCodeUrl(url);
            }
        };
        generateQR();
    }, [isPreviewOpen, formData, profile]);


    // Filtered Invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [invoices, searchTerm]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.name || !profile) return;

        // Profile Validation
        const errors = [];
        if (!profile.fullName?.trim()) errors.push('Nombre y Apellidos es obligatorio');
        if (!validateNIF(profile.nif)) errors.push('El NIF introducido no es válido');
        if (!profile.address?.trim()) errors.push('Domicilio Fiscal es obligatorio');
        if (!profile.municipality?.trim()) errors.push('Municipio es obligatorio');
        if (!profile.licenseNo?.trim()) errors.push('Nº Licencia es obligatorio');

        if (errors.length > 0) {
            showToast(errors[0], 'error');
            return;
        }

        setIsSaving(true);
        try {
            const success = await invoiceService.saveProfile(user.name, profile);
            if (success) {
                // Reload profile to ensure we have the persisted data
                const updatedProfile = await invoiceService.getProfile(user.name);
                if (updatedProfile) setProfile(updatedProfile);

                showToast('Perfil guardado correctamente', 'success');
                setView('history');
            } else {
                showToast('Error al guardar el perfil', 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const validateInvoice = () => {
        const errors: string[] = [];

        // CHECK PROFILE FIRST - Ensure driver data exists
        if (!profile?.fullName?.trim() || !profile?.nif?.trim() || !profile?.address?.trim()) {
            errors.push('Debes completar "Mis Datos Fiscales" antes de generar facturas');
        }

        if (!formData.number) errors.push('Número de factura faltante');
        if (!formData.clientName) errors.push('Nombre del cliente faltante');
        if (!formData.clientNif || !validateNIF(formData.clientNif)) errors.push('NIF del cliente inválido o faltante');
        if (!validateEmail(formData.clientEmail || '') && formData.clientEmail) errors.push('Email de cliente inválido');
        if (!formData.origin) errors.push('Origen faltante');
        if (!formData.destination) errors.push('Destino faltante');
        if (!formData.totalAmount || formData.totalAmount <= 0) errors.push('El importe debe ser mayor que 0');

        if (formData.dateService && formData.dateEmission) {
            if (new Date(formData.dateService) > new Date(formData.dateEmission)) {
                errors.push('La fecha de servicio no puede ser posterior a la de emisión');
            }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.name) return;

        if (!validateInvoice()) {
            showToast('Por favor, corrige los errores antes de continuar', 'warning');
            return;
        }

        if (window.confirm('¿Confirmas la creación de esta factura?')) {
            setIsSaving(true);
            try {
                const newInvoice = await invoiceService.createInvoice(user.name, formData as Omit<Invoice, 'id' | 'userId' | 'createdAt'>);
                if (newInvoice) {
                    setInvoices([newInvoice, ...invoices]);
                    showToast(`✓ Factura ${newInvoice.number} generada correctamente`, 'success');
                    setIsPreviewOpen(false);
                    setView('history');
                } else {
                    showToast('Error al generar la factura', 'error');
                }
            } finally {
                setIsSaving(false);
            }
        }
    };

    const prepareNewInvoice = async () => {
        if (!user?.name) return;
        const nextNum = await invoiceService.getNextInvoiceNumber(user.name, formData.series || '');
        setFormData({
            ...formData,
            number: nextNum,
            dateEmission: new Date().toISOString().split('T')[0],
            dateService: new Date().toISOString().split('T')[0],
            ivaRate: 10,
            baseAmount: 0,
            ivaAmount: 0,
            totalAmount: 0,
            origin: '',
            destination: '',
            clientName: '',
            clientNif: '',
            clientAddress: '',
            clientEmail: ''
        });
        setValidationErrors([]);
        setView('form');
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta factura? Esta acción no se puede deshacer.')) return;

        const success = await invoiceService.deleteInvoice(invoiceId);
        if (success) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            showToast('Factura eliminada', 'success');
        } else {
            showToast('Error al eliminar la factura', 'error');
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar TODAS las facturas? Esta acción no se puede deshacer y reiniciará el contador.')) return;

        if (user?.name) {
            const success = await invoiceService.deleteAllInvoices(user.name);
            if (success) {
                setInvoices([]);
                showToast('Todas las facturas eliminadas', 'success');
            } else {
                showToast('Error al eliminar las facturas', 'error');
            }
        }
    };

    // Standard Styles
    const headerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '1.5rem',
        fontWeight: '800',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        marginBottom: '0.25rem'
    };

    const subTitleStyle: React.CSSProperties = {
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: '500'
    };

    const actionButtonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-light)',
        fontWeight: '600',
        fontSize: '0.9rem',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <motion.div
            className="page-content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header Navigation */}
            <motion.div variants={itemVariants} style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        padding: '12px',
                        background: 'rgba(var(--accent-primary-rgb), 0.1)',
                        borderRadius: '16px',
                        color: 'var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FileText size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 style={titleStyle}>Facturación</h2>
                        <p style={subTitleStyle}>Gestiona tus facturas y clientes</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setView('profile')}
                        style={{
                            ...actionButtonStyle,
                            background: view === 'profile' ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--bg-card)',
                            color: view === 'profile' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            borderColor: view === 'profile' ? 'var(--accent-primary)' : 'var(--border-light)'
                        }}
                        title="Mis Datos Fiscales"
                    >
                        <User size={20} />
                    </button>
                    {view !== 'history' && (
                        <button
                            onClick={() => setView('history')}
                            style={actionButtonStyle}
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* VIEW: HISTORY */}
                {view === 'history' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        variants={containerVariants}
                    >
                        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar por número o cliente..."
                                    style={{ paddingLeft: '3rem' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                {invoices.length > 0 && (
                                    <button
                                        onClick={handleDeleteAll}
                                        style={{ ...actionButtonStyle, color: 'var(--danger)', borderColor: 'var(--danger)', background: 'transparent' }}
                                        title="Borrar todas las facturas y reiniciar contador"
                                    >
                                        <Trash2 size={18} />
                                        <span>Limpiar</span>
                                    </button>
                                )}
                                <button
                                    onClick={prepareNewInvoice}
                                    className="btn btn-primary"
                                    style={{ width: 'auto' }}
                                >
                                    <Plus size={20} /> Nueva Factura
                                </button>
                            </div>
                        </motion.div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredInvoices.length === 0 ? (
                                <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-light)' }}>
                                    <div style={{ margin: '0 auto 1rem', width: '64px', height: '64px', background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText style={{ color: 'var(--text-muted)' }} size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>No hay facturas</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Crea una nueva factura para empezar.</p>
                                </motion.div>
                            ) : (
                                filteredInvoices.map((inv, i) => (
                                    <motion.div
                                        key={inv.id}
                                        variants={itemVariants}
                                        layoutId={inv.id}
                                        className="card"
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{
                                                    background: 'rgba(var(--accent-primary-rgb), 0.1)',
                                                    color: 'var(--accent-primary)',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    border: '1px solid rgba(var(--accent-primary-rgb), 0.2)'
                                                }}>
                                                    {inv.series}{inv.number}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} />
                                                    {new Date(inv.dateEmission).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {inv.clientName || 'Cliente sin nombre'}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                {inv.totalAmount.toFixed(2)}€
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (profile) {
                                                            const success = await downloadInvoicePDF(inv, profile);
                                                            if (success) showToast('Factura descargada', 'success');
                                                        }
                                                    }}
                                                    style={{ padding: '8px', color: 'var(--accent-primary)', borderRadius: '8px', background: 'var(--bg-secondary)' }}
                                                    title="Descargar PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        profile && printInvoicePDF(inv, profile);
                                                    }}
                                                    style={{ padding: '8px', color: 'var(--text-secondary)', borderRadius: '8px', background: 'var(--bg-secondary)' }}
                                                    title="Imprimir"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteInvoice(inv.id);
                                                    }}
                                                    style={{ padding: '8px', color: 'var(--danger)', borderRadius: '8px', background: 'var(--bg-secondary)' }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {/* VIEW: PROFILE (MIS DATOS) */}
                {view === 'profile' && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        variants={containerVariants}
                    >
                        <form onSubmit={handleSaveProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', color: 'var(--text-primary)' }}>
                                <div style={{ padding: '8px', background: 'rgba(var(--accent-primary-rgb), 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                                    <Settings size={20} />
                                </div>
                                Mis Datos Fiscales
                            </h3>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nombre y Apellidos *</label>
                                    <input
                                        type="text" required
                                        value={profile?.fullName || ''}
                                        onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, fullName: capitalize(e.target.value) }))}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>NIF de Autónomo * (Letra Mayúscula)</label>
                                    <input
                                        type="text" required
                                        value={profile?.nif || ''}
                                        onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, nif: toUpper(e.target.value) }))}
                                        placeholder="12345678X"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Régimen Fiscal *</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            style={{ appearance: 'none' }}
                                            value={profile?.regime || 'Autónomo - Estimación Directa Simplificada'}
                                            onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, regime: e.target.value }))}
                                        >
                                            <option value="Autónomo - Estimación Directa Simplificada">Autónomo - Estimación Directa Simplificada</option>
                                            <option value="Autónomo - Estimación Directa Normal">Autónomo - Estimación Directa Normal</option>
                                            <option value="Autónomo - Módulos">Autónomo - Módulos</option>
                                        </select>
                                        <ChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} size={16} />
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Domicilio Fiscal Completo *</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={profile?.address || ''}
                                        onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, address: e.target.value }))}
                                        placeholder="Calle, Número, CP, Ciudad"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nº Licencia Taxi *</label>
                                    <input
                                        type="text" required
                                        value={profile?.licenseNo || ''}
                                        onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, licenseNo: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Municipio *</label>
                                    <input
                                        type="text" required
                                        value={profile?.municipality || ''}
                                        onChange={e => setProfile((prev: DriverProfile | null) => ({ ...prev!, municipality: toUpper(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary"
                                >
                                    <Save size={20} /> {isSaving ? 'Guardando...' : 'Guardar mis datos'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* VIEW: FORM (NEW INVOICE) */}
                {view === 'form' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* Error Summary */}
                            {validationErrors.length > 0 && (
                                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
                                    <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={16} /> Por favor corrige los siguientes errores:
                                    </div>
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
                                        {validationErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Numeración y Fechas */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Nº Factura</label>
                                    <input type="text" readOnly style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }} value={`${formData.series || ''}${formData.number || ''}`} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>F. Emisión</label>
                                        <input
                                            type="date"
                                            value={formData.dateEmission}
                                            onChange={e => setFormData({ ...formData, dateEmission: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>F. Operación</label>
                                        <input
                                            type="date"
                                            value={formData.dateService}
                                            onChange={e => setFormData({ ...formData, dateService: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detalles Trayecto */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>Detalles del Servicio</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                                        <input
                                            type="text" required placeholder="Origen"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.origin || ''}
                                            onChange={e => setFormData({ ...formData, origin: capitalize(e.target.value) })}
                                        />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} size={16} />
                                        <input
                                            type="text" required placeholder="Destino"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.destination || ''}
                                            onChange={e => setFormData({ ...formData, destination: capitalize(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ flex: '1 1 120px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>H. Inicio</label>
                                        <input type="time" value={formData.timeStart || ''} onChange={e => setFormData({ ...formData, timeStart: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: '1 1 120px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>H. Fin</label>
                                        <input type="time" value={formData.timeEnd || ''} onChange={e => setFormData({ ...formData, timeEnd: e.target.value })} style={{ width: '100%' }} />
                                    </div>
                                    <div style={{ flex: '1 1 100px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Km</label>
                                        <input type="number" step="0.1" value={formData.km || ''} onChange={e => setFormData({ ...formData, km: Number(e.target.value) })} style={{ width: '100%' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Importes */}
                            <div className="card" style={{ background: 'rgba(var(--accent-primary-rgb), 0.05)', border: '1px solid rgba(var(--accent-primary-rgb), 0.2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid rgba(var(--accent-primary-rgb), 0.2)', paddingBottom: '0.5rem', color: 'var(--accent-primary)' }}>Importes y Pago</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-muted)' }}>Importe Total (€) *</label>
                                        <input
                                            type="number" step="0.01" required
                                            style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center', width: '100%' }}
                                            value={formData.totalAmount || ''}
                                            onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div style={{ flex: '1 1 150px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-muted)' }}>IVA ({formData.ivaRate}%)</label>
                                        <div style={{ padding: '0.875rem 1rem', fontSize: '1.25rem', fontWeight: '600', color: 'var(--accent-secondary)' }}>{formData.ivaAmount?.toFixed(2)}€</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(var(--accent-primary-rgb), 0.2)', paddingTop: '0.75rem' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>BASE IMPONIBLE</span>
                                    <span style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-secondary)', letterSpacing: '-0.03em' }}>{formData.baseAmount?.toFixed(2)}€</span>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Forma de Pago *</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            style={{ appearance: 'none' }}
                                            value={formData.paymentMethod}
                                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                        >
                                            <option value="Efectivo">Efectivo</option>
                                            <option value="Tarjeta">Tarjeta</option>
                                            <option value="Bizum">Bizum</option>
                                            <option value="Transferencia">Transferencia</option>
                                        </select>
                                        <ChevronDown style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Datos Cliente */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '700', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>Datos del Cliente *</h4>
                                <input
                                    type="text" required placeholder="Nombre o Razón Social"
                                    value={formData.clientName || ''}
                                    onChange={e => setFormData({ ...formData, clientName: capitalize(e.target.value) })}
                                    style={{ background: 'var(--bg-secondary)' }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <input
                                        type="text" required placeholder="NIF/CIF"
                                        value={formData.clientNif || ''}
                                        onChange={e => setFormData({ ...formData, clientNif: toUpper(e.target.value) })}
                                        style={{ background: 'var(--bg-secondary)', flex: '1 1 150px' }}
                                    />
                                    <input
                                        type="email" placeholder="Email (opcional)"
                                        value={formData.clientEmail || ''}
                                        onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                                        style={{ background: 'var(--bg-secondary)', flex: '1 1 150px' }}
                                    />
                                </div>
                                <input
                                    type="text" required placeholder="Dirección Completa (Calle, Nº, CP...)"
                                    value={formData.clientAddress || ''}
                                    onChange={e => setFormData({ ...formData, clientAddress: e.target.value })}
                                    style={{ background: 'var(--bg-secondary)' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateInvoice()) setIsPreviewOpen(true);
                                        else showToast('Completa los campos obligatorios para ver la vista previa', 'warning');
                                    }}
                                    className="btn btn-ghost"
                                    style={{ border: '1px solid var(--border-light)', flex: 1 }}
                                >
                                    <Eye size={20} /> Vista Previa
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    <Save size={20} /> {isSaving ? 'Guardando...' : 'Generar Factura'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* PREVIEW MODAL */}
                {isPreviewOpen && profile && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                        >
                            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', zIndex: 10, padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Vista Previa</h2>
                                <button
                                    onClick={() => setIsPreviewOpen(false)}
                                    style={{ padding: '0.5rem', color: '#6b7280', borderRadius: '9999px', transition: 'background-color 0.2s' }}
                                >
                                    <AlertCircle size={24} className="rotate-45" />
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', background: '#f9fafb' }}>
                                {/* Invoice Mockup Page */}
                                <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '2rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', fontSize: '10px', lineHeight: '1.625', position: 'relative', fontFamily: 'sans-serif', margin: '0 auto', maxWidth: '380px', aspectRatio: '1/1.414' }}>
                                    {/* QR Code in Preview */}
                                    {qrCodeUrl && (
                                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                                            <img src={qrCodeUrl} alt="QR Factura" style={{ width: '4rem', height: '4rem', mixBlendMode: 'multiply', opacity: 0.9 }} />
                                        </div>
                                    )}

                                    <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #facc15', paddingBottom: '1rem' }}>
                                        <h1 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FACTURA</h1>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '700', color: '#4b5563' }}>Nº {formData.series}{formData.number}</div>
                                        <div style={{ color: '#6b7280' }}>Fecha: {new Date(formData.dateEmission!).toLocaleDateString('es-ES')}</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>De</strong>
                                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.75rem' }}>{profile.fullName}</div>
                                            <div style={{ color: '#4b5563' }}>{profile.nif}</div>
                                            <div style={{ whiteSpace: 'pre-wrap', color: '#4b5563' }}>{profile.address}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Para</strong>
                                            <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.75rem' }}>{formData.clientName}</div>
                                            <div style={{ color: '#4b5563' }}>{formData.clientNif}</div>
                                            <div style={{ whiteSpace: 'pre-wrap', color: '#4b5563' }}>{formData.clientAddress}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', borderBottom: '2px solid #f3f4f6', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            <span style={{ flex: 1 }}>Concepto</span>
                                            <span style={{ width: '5rem', textAlign: 'right' }}>Importe</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f9fafb' }}>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1f2937' }}>Servicio de Taxi</div>
                                                <div style={{ color: '#6b7280', marginTop: '0.125rem' }}>{formData.origin} → {formData.destination}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '9px', marginTop: '0.25rem' }}>
                                                    {new Date(formData.dateService!).toLocaleDateString('es-ES')}
                                                    {formData.timeStart && ` • ${formData.timeStart} - ${formData.timeEnd || ''}`}
                                                    {formData.km && ` • ${formData.km} km`}
                                                </div>
                                            </div>
                                            <div style={{ fontWeight: '700', color: '#111827' }}>
                                                {formData.baseAmount?.toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '10rem', color: '#6b7280' }}>
                                            <span>Base Imponible</span>
                                            <span>{formData.baseAmount?.toFixed(2)} €</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '10rem', color: '#6b7280' }}>
                                            <span>IVA (10%)</span>
                                            <span>{formData.ivaAmount?.toFixed(2)} €</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '12rem', fontWeight: '900', fontSize: '1.25rem', color: '#111827', borderTop: '2px solid #facc15', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                            <span>TOTAL</span>
                                            <span>{formData.totalAmount?.toFixed(2)} €</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        Gracias por su confianza
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', position: 'sticky', bottom: 0, borderRadius: '0 0 16px 16px' }}>
                                <button
                                    onClick={async () => {
                                        if (profile) {
                                            const success = await downloadInvoicePDF(formData as Invoice, profile);
                                            if (success) showToast('Descarga iniciada', 'success');
                                        }
                                    }}
                                    className="btn btn-primary"
                                    style={{ background: 'var(--accent-primary)', color: '#000', flexDirection: 'row' }}
                                >
                                    <Download size={18} /> PDF
                                </button>
                                <button
                                    onClick={() => printInvoicePDF(formData as Invoice, profile)}
                                    className="btn btn-ghost"
                                    style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db' }}
                                >
                                    <Printer size={18} /> Imprimir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default InvoiceGenerator;
