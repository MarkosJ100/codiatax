import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, MapPin, Clock, Plane, Building2,
    Search, ChevronRight, Info, ArrowLeft, Navigation, Loader, Route
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    getCurrentTariff, getTariffReason, searchDestinations, CATEGORIES,
    FareDestination, TariffInfo
} from '../data/taxiFares2025';
import FreeDestinationCalculator from '../components/Calculator/FreeDestinationCalculator';

// Coordinates for origin detection
const LOCATIONS = {
    airport: { lat: 36.7447, lng: -6.0601, name: 'Aeropuerto' },
    city: { lat: 36.6867, lng: -6.1374, name: 'Jerez Centro' }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const TaxiCalculator: React.FC = () => {
    const navigate = useNavigate();
    const [origin, setOrigin] = useState<'airport' | 'city' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFare, setSelectedFare] = useState<FareDestination | null>(null);
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [geoMessage, setGeoMessage] = useState('');
    const [freeMode, setFreeMode] = useState(false);

    const currentTariff = useMemo(() => getCurrentTariff(), []);

    const filteredDestinations = useMemo(() => {
        if (!origin) return [];
        return searchDestinations(searchQuery, origin, selectedCategory);
    }, [origin, searchQuery, selectedCategory]);

    const formatPrice = (price: number) => {
        return price.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getApplicablePrice = (fare: FareDestination): number => {
        return currentTariff.type === 'tarifa7' ? fare.tarifa7 : fare.tarifa8;
    };

    // Geolocation handler
    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            setGeoStatus('error');
            setGeoMessage('Geolocalización no soportada');
            return;
        }

        setGeoStatus('loading');
        setGeoMessage('Obteniendo ubicación...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                const distToAirport = calculateDistance(latitude, longitude, LOCATIONS.airport.lat, LOCATIONS.airport.lng);
                const distToCity = calculateDistance(latitude, longitude, LOCATIONS.city.lat, LOCATIONS.city.lng);

                const closest = distToAirport < distToCity ? 'airport' : 'city';
                const distanceKm = Math.min(distToAirport, distToCity).toFixed(1);

                setGeoStatus('success');
                setGeoMessage(`📍 Estás a ${distanceKm} km de ${closest === 'airport' ? 'Aeropuerto' : 'Jerez Centro'}`);
                setOrigin(closest);
            },
            (error) => {
                setGeoStatus('error');
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setGeoMessage('Permiso de ubicación denegado');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setGeoMessage('Ubicación no disponible');
                        break;
                    case error.TIMEOUT:
                        setGeoMessage('Tiempo de espera agotado');
                        break;
                    default:
                        setGeoMessage('Error al obtener ubicación');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    // Free Destination Mode (GPS calculation)
    if (freeMode) {
        return <FreeDestinationCalculator onBack={() => setFreeMode(false)} />;
    }

    // Origin Selection Screen
    if (!origin) {
        return (
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{ textAlign: 'center', padding: '2rem' }}
                >
                    <Calculator size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Calculadora de Tarifas</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Tarifas oficiales Jerez 2025
                    </p>

                    {/* Current Tariff Info */}
                    <div style={{
                        backgroundColor: currentTariff.type === 'tarifa8'
                            ? 'rgba(var(--warning-rgb), 0.15)'
                            : 'rgba(var(--success-rgb), 0.15)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                            <Clock size={16} color={currentTariff.type === 'tarifa8' ? 'var(--warning)' : 'var(--success)'} />
                            <span style={{ fontWeight: '600' }}>Tarifa Actual</span>
                        </div>
                        <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: currentTariff.type === 'tarifa8' ? 'var(--warning)' : 'var(--success)'
                        }}>
                            {currentTariff.label}
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-primary)',
                            marginTop: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }}>
                            📅 {getTariffReason()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {currentTariff.description}
                        </div>
                    </div>

                    {/* Geolocation Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGeolocate}
                        disabled={geoStatus === 'loading'}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: 'var(--accent-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: geoStatus === 'loading' ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            marginBottom: '0.75rem'
                        }}
                    >
                        {geoStatus === 'loading' ? (
                            <>
                                <Loader size={20} className="spin" />
                                Localizando...
                            </>
                        ) : (
                            <>
                                <Navigation size={20} />
                                Detectar mi ubicación
                            </>
                        )}
                    </motion.button>

                    {/* Geo Status Message */}
                    {geoMessage && (
                        <div style={{
                            padding: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.8rem',
                            color: geoStatus === 'error' ? 'var(--danger)' : 'var(--text-muted)'
                        }}>
                            {geoMessage}
                        </div>
                    )}

                    <h3 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        O selecciona manualmente
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setOrigin('airport')}
                            style={{
                                padding: '1.5rem 1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '2px solid transparent',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <Plane size={32} color="var(--info)" />
                            <span style={{ fontWeight: '600' }}>Aeropuerto</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>XRY</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setOrigin('city')}
                            style={{
                                padding: '1.5rem 1rem',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '2px solid transparent',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <Building2 size={32} color="var(--warning)" />
                            <span style={{ fontWeight: '600' }}>Jerez Centro</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ciudad</span>
                        </motion.button>
                    </div>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        margin: '1.5rem 0'
                    }}>
                        <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>o</span>
                        <div style={{ flex: 1, borderTop: '1px solid var(--border-light)' }} />
                    </div>

                    {/* GPS Free Route Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFreeMode(true)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: 'rgba(var(--success-rgb), 0.1)',
                            border: '2px solid var(--success)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            color: 'var(--success)'
                        }}
                    >
                        <Route size={20} />
                        <span style={{ fontWeight: '600' }}>Calcular ruta GPS libre</span>
                    </motion.button>

                    <p style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.5rem',
                        textAlign: 'center'
                    }}>
                        Calcula el precio desde tu ubicación GPS a cualquier destino
                    </p>
                </motion.div>
            </div>
        );
    }


    // Result Screen
    if (selectedFare) {
        const price = getApplicablePrice(selectedFare);
        return (
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card"
                    style={{ padding: '1.5rem' }}
                >
                    <button
                        onClick={() => setSelectedFare(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            padding: 0
                        }}
                    >
                        <ArrowLeft size={16} />
                        Volver
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <MapPin size={40} color="var(--accent-primary)" />
                        <h2 style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
                            {selectedFare.name}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Desde {origin === 'airport' ? 'Aeropuerto' : 'Jerez Centro'}
                        </p>

                        {/* Price Display */}
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.5rem',
                            backgroundColor: 'rgba(var(--success-rgb), 0.1)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                PRECIO ESTIMADO
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                {formatPrice(price)} €
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {currentTariff.label}
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{
                            marginTop: '1rem',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem'
                        }}>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>DISTANCIA</div>
                                <div style={{ fontWeight: '600' }}>{selectedFare.km} km</div>
                            </div>
                            <div style={{
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>€/KM</div>
                                <div style={{ fontWeight: '600' }}>{currentTariff.pricePerKm.toFixed(2)} €</div>
                            </div>
                        </div>

                        {/* Other Tariff Price */}
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem'
                        }}>
                            <Info size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            Con {currentTariff.type === 'tarifa7' ? 'Tarifa 8' : 'Tarifa 7'}:
                            <strong style={{ marginLeft: '4px' }}>
                                {formatPrice(currentTariff.type === 'tarifa7' ? selectedFare.tarifa8 : selectedFare.tarifa7)} €
                            </strong>
                        </div>

                        {/* Multilingual Price Info */}
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(var(--info-rgb), 0.1)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'left',
                            fontSize: '0.75rem',
                            lineHeight: '1.6'
                        }}>
                            <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🌍 Información / Information
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                🇬🇧 <strong>English:</strong> The fare from {origin === 'airport' ? 'Airport' : 'Jerez City'} to {selectedFare.name} is approximately <strong>{formatPrice(price)} €</strong>. This is an estimated price; actual fare is calculated by taximeter.
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                🇩🇪 <strong>Deutsch:</strong> Der Fahrpreis vom {origin === 'airport' ? 'Flughafen' : 'Stadtzentrum Jerez'} nach {selectedFare.name} beträgt circa <strong>{formatPrice(price)} €</strong>. Dies ist ein Richtwert; der tatsächliche Preis wird per Taxameter berechnet.
                            </div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                🇫🇷 <strong>Français:</strong> Le tarif depuis {origin === 'airport' ? "l'aéroport" : 'le centre de Jerez'} jusqu'à {selectedFare.name} est d'environ <strong>{formatPrice(price)} €</strong>. Ce prix est indicatif ; le montant réel est calculé au taximètre.
                            </div>
                            <div>
                                🇮🇹 <strong>Italiano:</strong> La tariffa da {origin === 'airport' ? "aeroporto" : 'centro città di Jerez'} a {selectedFare.name} è di circa <strong>{formatPrice(price)} €</strong>. Questo è un prezzo indicativo; l'importo effettivo è calcolato dal tassametro.
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Destination Selection Screen
    return (
        <div className="page-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Header */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => setOrigin(null)}
                            style={{
                                padding: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ORIGEN</div>
                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {origin === 'airport' ? <Plane size={16} /> : <Building2 size={16} />}
                                {origin === 'airport' ? 'Aeropuerto' : 'Jerez Centro'}
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TARIFA ACTUAL</div>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                color: currentTariff.type === 'tarifa7' ? 'var(--success)' : 'var(--warning)'
                            }}>
                                {currentTariff.type === 'tarifa7' ? 'Diurna' : 'Nocturna'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem'
                    }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Buscar destino..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Category Filter */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginTop: '0.75rem',
                        overflowX: 'auto',
                        paddingBottom: '0.25rem'
                    }}>
                        <button
                            onClick={() => setSelectedCategory('all')}
                            style={{
                                padding: '4px 10px',
                                fontSize: '0.7rem',
                                backgroundColor: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: selectedCategory === 'all' ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Todos
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '0.7rem',
                                    backgroundColor: selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                    color: selectedCategory === cat.id ? '#fff' : 'var(--text-muted)',
                                    border: 'none',
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Destinations List */}
                <div className="card" style={{ padding: '0.5rem' }}>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <AnimatePresence>
                            {filteredDestinations.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No se encontraron destinos
                                </div>
                            ) : (
                                filteredDestinations.map((fare, index) => (
                                    <motion.button
                                        key={fare.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        onClick={() => setSelectedFare(fare)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontWeight: '500' }}>{fare.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {fare.km} km
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontWeight: 'bold',
                                                color: 'var(--success)'
                                            }}>
                                                {formatPrice(getApplicablePrice(fare))} €
                                            </span>
                                            <ChevronRight size={16} color="var(--text-muted)" />
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TaxiCalculator;
