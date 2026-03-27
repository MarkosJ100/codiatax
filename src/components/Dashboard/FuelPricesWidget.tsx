import React, { useEffect, useState } from 'react';
import { getCachedFuelPrices, FuelPricesData, FuelStation } from '../../services/fuelPrices';
import { Fuel, Clock, TrendingDown, RefreshCw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div style={{ 
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-premium)',
                marginBottom: '1rem'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'inline-block', color: 'var(--accent-primary)' }}
                >
                    <RefreshCw size={24} />
                </motion.div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontWeight: '600' }}>
                    Cargando precios en Jerez...
                </p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ 
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '1.5rem',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-premium)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '1rem' }}>
                    <Fuel size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>No se han podido cargar los precios</span>
                </div>
                <button
                    onClick={fetchData}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--text-primary)'
                    }}
                >
                    Reintentar conexión
                </button>
            </div>
        );
    }

    const PriceCard = ({ station, type }: { station: FuelStation, type: 'diesel' | 'gasoline' }) => (
        <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: '18px',
            padding: '1rem',
            flex: 1,
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-premium)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <TrendingDown size={14} color="var(--success)" />
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '850', letterSpacing: '0.05em' }}>
                    Mejor {type === 'diesel' ? 'Diesel' : 'Gasolina 95'}
                </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '950', color: 'var(--success)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {type === 'diesel' ? station.dieselA?.toFixed(3) : station.gasoline95?.toFixed(3)}<span style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginLeft: '2px' }}>EUR/L</span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-primary)', opacity: 0.9, lineHeight: '1.2' }}>
                {station.name}
            </div>
        </div>
    );

    const StationRow = ({ station, index }: { station: FuelStation, index: number }) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-light)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '8px',
                    backgroundColor: index < 1 ? 'var(--success)' : 'var(--bg-secondary)',
                    color: index < 1 ? 'white' : 'var(--text-muted)',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900'
                }}>
                    {index + 1}
                </span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{station.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '500' }}>{station.address.split(',')[0]}</div>
                </div>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '950', color: index < 1 ? 'var(--success)' : 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {station.dieselA?.toFixed(3)} â‚¬
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    G95: {station.gasoline95?.toFixed(3) || '-'}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ 
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '1.25rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-premium)',
            marginBottom: '1rem'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: 'var(--accent-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-strong)',
                        border: '1px solid rgba(var(--accent-primary-rgb), 0.1)'
                    }}>
                        <Fuel size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '950', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Combustible Jerez</h3>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <Clock size={11} /> Actualizado: {data.lastUpdate}
                        </div>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchData}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '10px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Actualizar"
                >
                    <RefreshCw size={16} />
                </motion.button>
            </div>

            {/* Best Prices Row */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem' }}>
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
                    gap: '6px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    transition: 'all 0.2s ease'
                }}
            >
                {expanded ? 'Ocultar lista detallada' : `Ver ranking de ${data.stations.length} gasolineras`}
                <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={16} />
                </motion.div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}
                    >
                        <div style={{ padding: '0 4px' }}>
                            {data.stations.slice(0, 10).map((station, index) => (
                                <StationRow key={station.id} station={station} index={index} />
                            ))}
                        </div>
                        <div style={{ 
                            fontSize: '0.6rem', 
                            color: 'var(--text-muted)', 
                            textAlign: 'center', 
                            marginTop: '1rem',
                            padding: '8px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '8px',
                            fontWeight: '600'
                        }}>
                            Fuente: Ministerio de Industria y Turismo.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default React.memo(FuelPricesWidget);

