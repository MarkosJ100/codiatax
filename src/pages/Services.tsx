import React, { useState } from 'react';
import ServiceForm from '../components/Services/ServiceForm';
import ServiceList from '../components/Services/ServiceList';
import DailyMileageInput from '../components/Services/DailyMileageInput';
import DailyTotalForm from '../components/Services/DailyTotalForm';
import { PenTool, Calculator } from 'lucide-react';

export const Services: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'manual' | 'total'>('manual');

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>Registro de Servicios</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', marginBottom: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                <button
                    onClick={() => setActiveTab('manual')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: activeTab === 'manual' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
                >
                    <PenTool size={16} style={{ marginRight: '8px' }} /> Servicios Manuales
                </button>
                <button
                    onClick={() => setActiveTab('total')}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: activeTab === 'total' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'total' ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
                >
                    <Calculator size={16} style={{ marginRight: '8px' }} /> Servicios Totales
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

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                Historial ({activeTab === 'manual' ? 'Manual' : 'Totales'})
            </h3>
            <ServiceList filterSource={activeTab} />
        </div>
    );
};
