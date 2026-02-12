import React, { useState } from 'react';
import ServiceForm from '../components/Services/ServiceForm';
import ServiceList from '../components/Services/ServiceList';
import DailyMileageInput from '../components/Services/DailyMileageInput';
import DailyTotalForm from '../components/Services/DailyTotalForm';
import { PenTool, Calculator } from 'lucide-react';

export const Services: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'manual' | 'total'>('total');
    const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'taxi' | 'company'>('all');

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Registro de Servicios</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                <button
                    onClick={() => setActiveTab('total')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: activeTab === 'total' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'total' ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
                >
                    <Calculator size={16} style={{ marginRight: '8px' }} /> Resumen Diario
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: activeTab === 'manual' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
                >
                    <PenTool size={16} style={{ marginRight: '8px' }} /> Entrada Manual
                </button>
            </div>

            {activeTab === 'manual' ? (
                <>
                    <DailyMileageInput />
                    <ServiceForm />
                </>
            ) : (
                <DailyTotalForm />
            )}

            <div style={{ marginTop: '2.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    Historial ({activeTab === 'manual' ? 'Manual' : 'Totales'})
                </h3>

                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '2px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setHistoryTypeFilter('all')}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: historyTypeFilter === 'all' ? 'var(--bg-card)' : 'transparent', color: 'var(--text-primary)', fontWeight: 'bold' }}
                    >
                        Todo
                    </button>
                    <button
                        onClick={() => setHistoryTypeFilter('taxi')}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: historyTypeFilter === 'taxi' ? 'var(--bg-card)' : 'transparent', color: 'var(--accent-primary)', fontWeight: 'bold' }}
                    >
                        🚖 Taxi
                    </button>
                    <button
                        onClick={() => setHistoryTypeFilter('company')}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: historyTypeFilter === 'company' ? 'var(--bg-card)' : 'transparent', color: '#8b5cf6', fontWeight: 'bold' }}
                    >
                        🏢 Abonados
                    </button>
                </div>
            </div>

            <ServiceList filterSource={activeTab} typeFilter={historyTypeFilter} />
        </div>
    );
};
