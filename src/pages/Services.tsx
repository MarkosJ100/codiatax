import React, { useState } from 'react';
import ServiceForm from '../components/Services/ServiceForm';
import ServiceList from '../components/Services/ServiceList';
import DailyMileageInput from '../components/Services/DailyMileageInput';
import DailyTotalForm from '../components/Services/DailyTotalForm';
import { PenTool, Calculator, ChevronRight } from 'lucide-react';

export const Services: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'manual' | 'total'>('total');
    const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'taxi' | 'company'>('all');

    return (
        <div style={{ paddingBottom: '4rem' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '2rem', padding: '0 0.25rem' }}>
                <div 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        background: 'var(--accent-soft)', 
                        padding: '4px 12px', 
                        borderRadius: '20px',
                        marginBottom: '0.75rem',
                        border: '1px solid rgba(var(--accent-primary-rgb), 0.1)'
                    }}
                >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '850', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Operación Diaria
                    </span>
                </div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Registro de <span style={{ color: 'var(--accent-primary)' }}>servicios</span>
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: '600', maxWidth: '90%' }}>
                    Controla tu jornada con precisión: registros manuales o resúmenes rápidos.
                </p>
            </div>

            {/* Main Navigation Tabs */}
            <div style={{ position: 'sticky', top: '0', zIndex: 10, background: 'rgba(var(--bg-primary-rgb), 0.8)', backdropFilter: 'blur(10px)', padding: '0.5rem 0', marginBottom: '1.5rem' }}>
                <div className="segmented-control" style={{ padding: '6px', borderRadius: '18px', background: 'var(--bg-body)', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--border-light)' }}>
                    <button
                        onClick={() => setActiveTab('total')}
                        className={activeTab === 'total' ? 'active' : ''}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px',
                            height: '44px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Calculator size={18} /> 
                        <span>Resumen diario</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={activeTab === 'manual' ? 'active' : ''}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px',
                            height: '44px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <PenTool size={18} /> 
                        <span>Entrada manual</span>
                    </button>
                </div>
            </div>

            {/* Active Content Area */}
            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'manual' ? (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <DailyMileageInput />
                        <ServiceForm />
                    </div>
                ) : (
                    <DailyTotalForm />
                )}
            </div>

            {/* History Header Section */}
            <div
                style={{
                    marginTop: '4rem',
                    marginBottom: '1.5rem',
                    padding: '0 0.25rem'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                            FLUJO RECIENTE
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '850', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                            Últimos registros
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                        Ver histórico <ChevronRight size={16} />
                    </div>
                </div>

                {/* Filter Control */}
                <div 
                    className="segmented-control" 
                    style={{ 
                        width: '100%', 
                        padding: '4px', 
                        background: 'var(--bg-card)', 
                        borderRadius: '14px',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    <button
                        onClick={() => setHistoryTypeFilter('all')}
                        className={historyTypeFilter === 'all' ? 'active' : ''}
                        style={{ fontSize: '0.8rem', fontWeight: '750', padding: '8px 4px' }}
                    >
                        Todo
                    </button>
                    <button
                        onClick={() => setHistoryTypeFilter('taxi')}
                        className={historyTypeFilter === 'taxi' ? 'active' : ''}
                        style={{ fontSize: '0.8rem', fontWeight: '750', padding: '8px 4px' }}
                    >
                        Carreras
                    </button>
                    <button
                        onClick={() => setHistoryTypeFilter('company')}
                        className={historyTypeFilter === 'company' ? 'active' : ''}
                        style={{ fontSize: '0.8rem', fontWeight: '750', padding: '8px 4px' }}
                    >
                        Abonados
                    </button>
                </div>
            </div>

            {/* Service List with Filters applied */}
            <div style={{ marginTop: '1rem' }}>
                <ServiceList filterSource={activeTab} typeFilter={historyTypeFilter} />
            </div>
        </div>
    );
};

export default Services;
