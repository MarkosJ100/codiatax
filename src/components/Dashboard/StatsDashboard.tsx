import React, { useState } from 'react';
import { Period } from '../../types';
import { useFinanceData } from '../../hooks/useFinanceData';
import { useServices } from '../../context/ServiceContext';
import { useVehicle } from '../../context/VehicleContext';
import { FinanceService } from '../../services/FinanceService';
import MetricCard from '../Common/MetricCard';
import TabSelector from '../Common/TabSelector';
import './Dashboard.css';

const StatsDashboard: React.FC = () => {
    const { services, expenses } = useServices();
    const { mileageLogs } = useVehicle();
    const [period, setPeriod] = useState<Period>('day');
    const [viewMode, setViewMode] = useState<'total' | 'taxi' | 'company'>('total');

    const totals = useFinanceData(services, expenses, mileageLogs, period);

    // Dynamic metrics based on viewMode
    const displayGross = viewMode === 'total' ? totals.grossIncome :
        viewMode === 'taxi' ? totals.taxiIncome : totals.subscriberIncome;

    // Expenses are usually general, but we can show them in total/taxi view
    const displayExpenses = viewMode === 'company' ? 0 : totals.totalExpenses;
    const displayNet = displayGross - displayExpenses;
    const displayKms = viewMode === 'company' ? 0 : totals.totalKms;

    const formatCurr = (val: number) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });


    const periodOptions = [
        { id: 'day', label: 'Hoy' },
        { id: 'week', label: 'Semana' },
        { id: 'month', label: 'Mes' },
        { id: 'year', label: 'Año' }
    ];

    const viewOptions = [
        { id: 'total', label: 'Todo' },
        { id: 'taxi', label: 'Taxi' },
        { id: 'company', label: 'Abonados' }
    ];

    return (
        <div className="card stats-dashboard">
            <TabSelector
                options={viewOptions}
                activeId={viewMode}
                onChange={(id) => setViewMode(id as any)}
                className="view-tabs"
            />

            <div className="period-container">
                <TabSelector
                    options={periodOptions}
                    activeId={period}
                    onChange={(id) => setPeriod(id as Period)}
                    className="period-selector"
                />
            </div>

            <div className="metrics-grid">
                <MetricCard
                    label="Bruto"
                    value={FinanceService.formatCurrency(displayGross)}
                    variant={viewMode === 'company' ? 'info' : 'primary'}
                />
                <MetricCard
                    label="Gastos"
                    value={FinanceService.formatCurrency(displayExpenses)}
                    variant="warning"
                />
                <MetricCard
                    label="Neto"
                    value={FinanceService.formatCurrency(displayNet)}
                    variant="success"
                />
                <MetricCard
                    label="Distancia"
                    value={`${displayKms.toLocaleString()} km`}
                    variant="neutral"
                />
            </div>
        </div>
    );
};

export default StatsDashboard;
