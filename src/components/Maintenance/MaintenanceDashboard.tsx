import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, CheckCircle, Plus, PenTool } from 'lucide-react';

const MaintenanceDashboard = () => {
    const { vehicle, setVehicle, currentOdometer, setInitialOdometer, addMaintenanceItem } = useApp();
    const [showConfig, setShowConfig] = useState(false);
    const [showAddCustom, setShowAddCustom] = useState(false);

    // Custom Maintenance Form State
    const [customName, setCustomName] = useState('');
    const [customInterval, setCustomInterval] = useState('');

    // Helper to calculate status
    const getStatus = (item: any) => {
        // Logic: Health Bar.
        // Starts at 100% (Green). Decreases as you drive.
        // 0% means Due/Overdue.
        const serviceAt = item.lastKm + item.interval;
        const remaining = serviceAt - currentOdometer;

        // Health %: (remaining / interval) * 100
        // If remaining < 0, health is 0 (or negative, but we clamp at 0 for bar).
        // If remaining > interval (e.g. error), clamp at 100.
        const health = Math.max(0, Math.min(100, (remaining / item.interval) * 100));

        return { remaining, health, serviceAt };
    };

    const handleConfigChange = (key: string, field: string, value: string) => {
        setVehicle((prev: any) => ({
            ...prev,
            maintenance: {
                ...prev.maintenance,
                [key]: { ...prev.maintenance[key], [field]: parseInt(value) || 0 }
            }
        }));
    };

    const performMaintenance = (key: string) => {
        // Logic: Reset lastKm to currentOdometer.
        if (confirm(`¿Confirmas que has realizado: ${vehicle.maintenance[key].name} a los ${currentOdometer} km?`)) {
            setVehicle(prev => ({
                ...prev,
                maintenance: {
                    ...prev.maintenance,
                    [key]: { ...prev.maintenance[key], lastKm: currentOdometer }
                }
            }));
        }
    };

    const handleAddCustom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customName || !customInterval) return;

        const key = `custom_${Date.now()}`;
        addMaintenanceItem(key, {
            name: customName,
            interval: parseInt(customInterval),
            lastKm: currentOdometer
        });

        setCustomName('');
        setCustomInterval('');
        setShowAddCustom(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Estado del Vehículo</h3>
                <button onClick={() => setShowConfig(!showConfig)} className="btn-ghost" style={{ padding: '4px' }}>
                    <Settings size={20} />
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kilómetros Totales (Odómetro)</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <p style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{currentOdometer.toLocaleString()}</p>

                        {/* Direct Edit of Logic (Initial Odometer + Logs = Current). 
                        It's tricky to "edit current" if it's derived.
                        The user asked: "pon la opcion de introducirlos directamente".
                        If I edit "Current", I am essentially updating "Initial" such that "Initial + Logs = NewCurrent".
                        NewInitial = NewCurrent - Logs.
                    */}
                        <button
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', border: '1px solid var(--text-muted)' }}
                            onClick={() => {
                                const newTotal = prompt("Introduce los Kilómetros Totales actuales del vehículo:", String(currentOdometer));
                                if (newTotal && !isNaN(Number(newTotal))) {
                                    const logsTotal = currentOdometer - (vehicle.initialOdometer || 0);
                                    const newInitial = parseInt(newTotal) - logsTotal;
                                    setInitialOdometer(newInitial);
                                }
                            }}
                        >
                            ✎ Editar
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(vehicle.maintenance).map(([key, item]) => {
                    const { remaining, health } = getStatus(item);

                    // Health Color Logic: 
                    // 100% -> Green. 
                    // 20% -> Yellow. 
                    // 0% -> Red.
                    let barColor = 'var(--success)';
                    if (health < 20) barColor = 'var(--warning)';
                    if (health <= 0) barColor = 'var(--danger)';

                    return (
                        <div key={key} className="card" style={{
                            borderLeft: `4px solid ${barColor}`,
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h4 style={{ fontWeight: 'bold' }}>{item.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Cambio cada: {item.interval.toLocaleString()} km
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        color: barColor
                                    }}>
                                        {remaining.toLocaleString()}
                                    </span>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Km restantes</p>
                                </div>
                            </div>

                            {/* Health Bar (Starts full, shrinks) */}
                            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${health}%`,
                                    backgroundColor: barColor,
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                {showConfig && (
                                    <div style={{ marginRight: 'auto' }}>
                                        <label style={{ fontSize: '0.7rem' }}>Intervalo: </label>
                                        <input
                                            type="number"
                                            value={item.interval}
                                            onChange={(e) => handleConfigChange(key, 'interval', e.target.value)}
                                            style={{ width: '80px', padding: '2px', fontSize: '0.8rem' }}
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={() => performMaintenance(key)}
                                    className="btn"
                                    style={{
                                        fontSize: '0.8rem',
                                        padding: '0.4rem 0.8rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--text-muted)'
                                    }}
                                >
                                    <CheckCircle size={14} style={{ marginRight: '6px' }} />
                                    Hecho
                                </button>
                            </div>
                        </div>
                    );
                })}

                <button
                    className="btn col-span-full"
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    style={{ border: '1px dashed var(--text-muted)', color: 'var(--text-secondary)' }}
                >
                    <Plus size={18} style={{ marginRight: '8px' }} /> Añadir Mantenimiento Manual
                </button>

                {showAddCustom && (
                    <div className="card" style={{ animation: 'fadeIn 0.3s' }}>
                        <h4>Nuevo Mantenimiento</h4>
                        <form onSubmit={handleAddCustom} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            <input
                                placeholder="Nombre (Ej: Correas)"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Revisar cada X km"
                                value={customInterval}
                                onChange={e => setCustomInterval(e.target.value)}
                                required
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowAddCustom(false)} className="btn btn-ghost">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceDashboard;
