import React, { useEffect, useState } from 'react';
import { getCachedFuelPrices, FuelPricesData, FuelStation } from '../../services/fuelPrices';
import { Fuel, MapPin, Clock, TrendingDown, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const FuelPricesWidget: React.FC = () => {
    const [data, setData] = useState<FuelPricesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const prices = await getCachedFuelPrices();
            setData(prices);
            if (!prices) setError(true);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Cargando precios...
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                    <Fuel size={18} />
                    <span style={{ fontSize: '0.85rem' }}>No se pudieron cargar los precios</span>
                </div>
                <button
                    onClick={fetchData}
                    style={{
                        marginTop: '0.5rem',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--bg-secondary)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const PriceCard = ({ station, type }: { station: FuelStation, type: 'diesel' | 'gasoline' }) => (
        <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            flex: 1
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                <TrendingDown size={14} color="var(--success)" />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Mejor {type === 'diesel' ? 'Diésel' : 'Gasolina 95'}
                </span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success)' }}>
                {type === 'diesel' ? station.dieselA?.toFixed(3) : station.gasoline95?.toFixed(3)} €/L
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                {station.name}
            </div>
        </div>
    );

    const StationRow = ({ station, index }: { station: FuelStation, index: number }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: index < 3 ? 'var(--success)' : 'var(--bg-secondary)',
                    color: index < 3 ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {index + 1}
                </span>
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{station.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{station.address.slice(0, 30)}...</div>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: index < 3 ? 'var(--success)' : 'var(--text-primary)' }}>
                    {station.dieselA?.toFixed(3)} €
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    G95: {station.gasoline95?.toFixed(3) || '-'}
                </div>
            </div>
        </div>
    );

    return (
        <div className="card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Fuel size={20} color="var(--accent-primary)" />
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Combustible Jerez</h3>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> {data.lastUpdate}
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchData}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--text-muted)'
                    }}
                    title="Actualizar"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Best Prices Row */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                {data.cheapestDiesel && <PriceCard station={data.cheapestDiesel} type="diesel" />}
                {data.cheapestGasoline && <PriceCard station={data.cheapestGasoline} type="gasoline" />}
            </div>

            {/* Expandable List */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem'
                }}
            >
                {expanded ? 'Ocultar lista' : `Ver ${data.stations.length} gasolineras`}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && (
                <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {data.stations.slice(0, 10).map((station, index) => (
                        <StationRow key={station.id} station={station} index={index} />
                    ))}
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                        Datos: Ministerio de Industria y Turismo
                    </div>
                </div>
            )}
        </div>
    );
};

export default FuelPricesWidget;
