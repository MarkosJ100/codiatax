import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calculator, ChevronRight, Clock, MapPin, Plane, Route } from 'lucide-react';
import { CATEGORIES, FareDestination, getTariffReason } from '../data/taxiFares2026';
import { FareService } from '../services/FareService';
import FreeDestinationCalculator from '../components/Calculator/FreeDestinationCalculator';

const TaxiCalculator: React.FC = () => {
    const navigate = useNavigate();
    const [origin, setOrigin] = useState<'airport' | 'city' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFare, setSelectedFare] = useState<FareDestination | null>(null);
    const [freeMode, setFreeMode] = useState(false);

    const currentTariff = useMemo(() => FareService.getCurrentTariff(), []);

    const filteredDestinations = useMemo(() => {
        if (!origin) return [];
        return FareService.searchDestinations(searchQuery, origin, selectedCategory);
    }, [origin, searchQuery, selectedCategory]);

    const formatPrice = (price: number) => FareService.formatPrice(price);
    const getApplicablePrice = (fare: FareDestination): number => FareService.getApplicablePrice(fare, currentTariff.type);

    if (freeMode) {
        return <FreeDestinationCalculator onBack={() => setFreeMode(false)} />;
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            {!origin ? (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Calculator size={30} color="#1c1917" />
                        </div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.04em', marginBottom: '0.35rem' }}>Calculadora de tarifas</h1>
                        <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Tarifas oficiales de Jerez 2026</p>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={22} color="var(--accent-strong)" />
                        </div>
                        <div>
                            <div className="section-label" style={{ marginBottom: '0.2rem' }}>Tarifa activa</div>
                            <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{currentTariff.label}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{getTariffReason()}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button onClick={() => setOrigin('airport')} className="card" style={{ marginBottom: 0, textAlign: 'center', cursor: 'pointer' }}>
                            <Plane size={28} color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem' }} />
                            <div style={{ fontWeight: '800', marginBottom: '0.2rem' }}>Aeropuerto</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Origen XRY</div>
                        </button>
                        <button onClick={() => setOrigin('city')} className="card" style={{ marginBottom: 0, textAlign: 'center', cursor: 'pointer' }}>
                            <Building2 size={28} color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem' }} />
                            <div style={{ fontWeight: '800', marginBottom: '0.2rem' }}>Jerez centro</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Casco urbano</div>
                        </button>
                    </div>

                    <button
                        onClick={() => setFreeMode(true)}
                        className="btn"
                        style={{ border: '1px solid var(--success)', color: 'var(--success)', background: 'var(--bg-card)', borderRadius: '16px' }}
                    >
                        <Route size={18} />
                        Calcular ruta GPS libre
                    </button>
                </div>
            ) : selectedFare ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <button onClick={() => setSelectedFare(null)} className="btn-ghost" style={{ width: 'auto', justifyContent: 'flex-start', padding: 0 }}>
                        <ArrowLeft size={18} />
                        Volver
                    </button>

                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ width: '74px', height: '74px', borderRadius: '24px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <MapPin size={34} color="var(--accent-strong)" />
                        </div>
                        <h2 style={{ fontSize: '1.7rem', fontWeight: '900', marginBottom: '0.5rem' }}>{selectedFare.name}</h2>
                        <div className="badge badge-info" style={{ marginBottom: '1.5rem' }}>
                            Desde {origin === 'airport' ? 'Aeropuerto' : 'Jerez centro'}
                        </div>

                        <div style={{ padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                            <div className="section-label" style={{ marginBottom: '0.35rem' }}>Precio estimado</div>
                            <div style={{ fontSize: '3.2rem', fontWeight: '950', letterSpacing: '-0.06em' }}>
                                {formatPrice(getApplicablePrice(selectedFare))} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>EUR</span>
                            </div>
                            <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{currentTariff.label}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1rem' }}>
                            <div className="card" style={{ marginBottom: 0, background: 'var(--bg-elevated)' }}>
                                <div className="section-label" style={{ marginBottom: '0.25rem' }}>Distancia</div>
                                <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>{selectedFare.km} km</div>
                            </div>
                            <div className="card" style={{ marginBottom: 0, background: 'var(--bg-elevated)' }}>
                                <div className="section-label" style={{ marginBottom: '0.25rem' }}>Alternativa</div>
                                <div style={{ fontWeight: '900', fontSize: '1.2rem' }}>
                                    {formatPrice(currentTariff.type === 'tarifa7' ? selectedFare.tarifa8 : selectedFare.tarifa7)} EUR
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => setOrigin(null)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                            <ArrowLeft size={18} />
                            Cambiar origen
                        </button>
                        <div className="badge badge-info">{origin === 'airport' ? 'Aeropuerto' : 'Jerez centro'}</div>
                    </div>

                    <div className="card" style={{ marginBottom: 0 }}>
                        <input
                            type="text"
                            placeholder="A donde vamos?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginBottom: '0.8rem' }}
                            autoFocus
                        />

                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                            <button onClick={() => setSelectedCategory('all')} className={selectedCategory === 'all' ? 'badge badge-info' : 'badge'} style={{ cursor: 'pointer' }}>Todos</button>
                            {CATEGORIES.map((cat) => (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={selectedCategory === cat.id ? 'badge badge-info' : 'badge'} style={{ cursor: 'pointer' }}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                        <span className="section-label">Destinos encontrados</span>
                        <span className="badge">{filteredDestinations.length}</span>
                    </div>

                    <div style={{ display: 'grid', gap: '10px' }}>
                        {filteredDestinations.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                No se encontraron destinos
                            </div>
                        ) : (
                            filteredDestinations.map((fare) => (
                                <button
                                    key={fare.name}
                                    onClick={() => setSelectedFare(fare)}
                                    className="card"
                                    style={{ marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{fare.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fare.km} km · Jerez</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '900', color: 'var(--success)' }}>{formatPrice(getApplicablePrice(fare))} EUR</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Estimado</div>
                                        </div>
                                        <ChevronRight size={18} color="var(--text-muted)" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default TaxiCalculator;
