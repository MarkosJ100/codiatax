import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Navigation, Loader, Info, ArrowLeft, Clock, Route
} from 'lucide-react';
import { getCurrentTariff, getTariffReason } from '../../data/taxiFares2025';
import { calculateRoute, geocodeAddress, reverseGeocode, calculateFare, Coordinates, FareCalculation } from '../../services/routingService';
import RouteMap from './RouteMap';

interface Props {
    onBack: () => void;
}

const FreeDestinationCalculator: React.FC<Props> = ({ onBack }) => {
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [originAddress, setOriginAddress] = useState<{ street: string; city: string } | null>(null);
    const [destination, setDestination] = useState('');
    const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
    const [destinationAddress, setDestinationAddress] = useState<{ street: string; city: string } | null>(null);
    const [destinationName, setDestinationName] = useState('');
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [geoMessage, setGeoMessage] = useState('');
    const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [calcMessage, setCalcMessage] = useState('');
    const [result, setResult] = useState<FareCalculation | null>(null);
    const [routeDistance, setRouteDistance] = useState<number>(0);
    const [routeDuration, setRouteDuration] = useState<number>(0);
    const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);

    const currentTariff = useMemo(() => getCurrentTariff(), []);

    const formatPrice = (price: number) => {
        return price.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Get user location
    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            setGeoStatus('error');
            setGeoMessage('Geolocalización no soportada');
            return;
        }

        setGeoStatus('loading');
        setGeoMessage('Obteniendo ubicación...');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(coords);

                // Get address from coordinates
                setGeoMessage('Obteniendo dirección...');
                const addressResult = await reverseGeocode(coords);
                if (addressResult.success) {
                    setOriginAddress({
                        street: addressResult.street,
                        city: addressResult.city
                    });
                    setGeoMessage(`📍 ${addressResult.street || 'Tu ubicación'}, ${addressResult.city}`);
                } else {
                    setGeoMessage(`📍 Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lng.toFixed(4)}`);
                }
                setGeoStatus('success');
            },
            (error) => {
                setGeoStatus('error');
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setGeoMessage('Permiso de ubicación denegado');
                        break;
                    default:
                        setGeoMessage('Error al obtener ubicación');
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    };

    // Calculate route and fare
    const handleCalculate = async () => {
        if (!userLocation || !destination.trim()) {
            setCalcMessage('Necesitas ubicación y destino');
            return;
        }

        setCalcStatus('loading');
        setCalcMessage('Buscando destino...');

        // Geocode destination
        const geoResult = await geocodeAddress(destination);
        if (!geoResult.success) {
            setCalcStatus('error');
            setCalcMessage(geoResult.error || 'Destino no encontrado');
            return;
        }

        const destCoords = { lat: geoResult.lat, lng: geoResult.lng };
        setDestinationCoords(destCoords);
        setDestinationName(geoResult.displayName);

        // Extract readable destination address
        const parts = geoResult.displayName.split(',');
        setDestinationAddress({
            street: parts[0]?.trim() || destination,
            city: parts[1]?.trim() || parts[2]?.trim() || ''
        });

        setCalcMessage('Calculando ruta...');

        // Calculate route
        const routeResult = await calculateRoute(userLocation, destCoords);
        if (!routeResult.success) {
            setCalcStatus('error');
            setCalcMessage(routeResult.error || 'Error calculando ruta');
            return;
        }

        setRouteDistance(routeResult.distance);
        setRouteDuration(routeResult.duration);
        setRouteGeometry(routeResult.geometry || []);

        // Calculate fare
        const fare = calculateFare(routeResult.distance, currentTariff.type);
        fare.duration = routeResult.duration;
        setResult(fare);
        setCalcStatus('success');
        setCalcMessage('');
    };

    // Reset calculation
    const handleReset = () => {
        setResult(null);
        setDestination('');
        setDestinationCoords(null);
        setCalcStatus('idle');
        setCalcMessage('');
    };

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
                            onClick={onBack}
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
                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Route size={18} color="var(--accent-primary)" />
                                Calculadora GPS
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Calcula el precio desde tu ubicación
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Tariff */}
                <div className="card" style={{
                    marginBottom: '1rem',
                    backgroundColor: currentTariff.type === 'tarifa8'
                        ? 'rgba(var(--warning-rgb), 0.15)'
                        : 'rgba(var(--success-rgb), 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} color={currentTariff.type === 'tarifa8' ? 'var(--warning)' : 'var(--success)'} />
                            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{currentTariff.label}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            📅 {getTariffReason()}
                        </span>
                    </div>
                </div>

                {/* Result Display */}
                {result ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card"
                    >
                        {/* Route Info: Origin → Destination */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem'
                        }}>
                            {/* Origin */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Navigation size={12} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origen</div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                        {originAddress?.street || 'Tu ubicación'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {originAddress?.city || ''}
                                    </div>
                                </div>
                            </div>

                            {/* Connector Line */}
                            <div style={{
                                marginLeft: '11px',
                                borderLeft: '2px dashed var(--border-light)',
                                height: '12px'
                            }} />

                            {/* Destination */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <MapPin size={12} color="#fff" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destino</div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                        {destinationAddress?.street || destination}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {destinationAddress?.city || ''}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Route Map */}
                        {userLocation && destinationCoords && (
                            <RouteMap
                                origin={[userLocation.lat, userLocation.lng]}
                                destination={[destinationCoords.lat, destinationCoords.lng]}
                                geometry={routeGeometry}
                            />
                        )}

                        {/* Price */}
                        <div style={{
                            padding: '1.5rem',
                            backgroundColor: 'rgba(var(--success-rgb), 0.1)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                PRECIO ESTIMADO
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                {formatPrice(result.totalFare)} €
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>DISTANCIA</div>
                                <div style={{ fontWeight: '600' }}>{routeDistance.toFixed(1)} km</div>
                            </div>
                            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>DURACIÓN</div>
                                <div style={{ fontWeight: '600' }}>{Math.round(routeDuration)} min</div>
                            </div>
                            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>PRECIO/KM</div>
                                <div style={{ fontWeight: '600' }}>{(currentTariff.pricePerKm * 2).toFixed(2)} €</div>
                            </div>
                        </div>

                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Distancia del trayecto:</span>
                                <span>{routeDistance.toFixed(1)} km</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span>Precio interurbano (Ida y Vuelta):</span>
                                <span>{(currentTariff.pricePerKm * 2).toFixed(2)} €/km</span>
                            </div>
                        </div>

                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: 'rgba(var(--info-rgb), 0.1)',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'left',
                            fontSize: '0.7rem',
                            lineHeight: '1.5'
                        }}>
                            <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: 'var(--info)' }}>
                                🌍 Información Interurbana
                            </div>
                            <div>🇪🇸 Trayecto calculado según normativa BOJA para servicios interurbanos. <strong>Incluye el retorno</strong> a Jerez (Tarifa x 2).</div>
                            <div style={{ marginTop: '4px' }}>🇬🇧 Fare includes the return trip as per official interurban regulations.</div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReset}
                            style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                color: 'var(--text-primary)'
                            }}
                        >
                            Nuevo cálculo
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="card">
                        {/* Step 1: Location */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: userLocation ? 'var(--success)' : 'var(--accent-primary)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem'
                                }}>1</span>
                                Tu ubicación
                            </div>

                            {!userLocation ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleGetLocation}
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
                                        fontWeight: '600'
                                    }}
                                >
                                    {geoStatus === 'loading' ? (
                                        <><Loader size={18} className="spin" /> Localizando...</>
                                    ) : (
                                        <><Navigation size={18} /> Obtener mi ubicación</>
                                    )}
                                </motion.button>
                            ) : (
                                <div style={{
                                    padding: '0.75rem',
                                    backgroundColor: 'rgba(var(--success-rgb), 0.1)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.8rem',
                                    color: 'var(--success)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        ✅ Ubicación obtenida
                                    </div>
                                    {originAddress && (
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            color: 'var(--text-primary)',
                                            marginTop: '4px'
                                        }}>
                                            📍 {originAddress.street}{originAddress.city ? `, ${originAddress.city}` : ''}
                                        </div>
                                    )}
                                </div>
                            )}

                            {geoMessage && geoStatus === 'error' && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: 'var(--danger)'
                                }}>
                                    {geoMessage}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Destination */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem'
                                }}>2</span>
                                Destino
                            </div>

                            <input
                                type="text"
                                placeholder="Ej: Cádiz, El Puerto, Sevilla..."
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        {/* Calculate Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCalculate}
                            disabled={!userLocation || !destination.trim() || calcStatus === 'loading'}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: (!userLocation || !destination.trim())
                                    ? 'var(--bg-secondary)'
                                    : 'var(--success)',
                                color: (!userLocation || !destination.trim())
                                    ? 'var(--text-muted)'
                                    : '#fff',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                cursor: (!userLocation || !destination.trim() || calcStatus === 'loading')
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontWeight: '700',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {calcStatus === 'loading' ? (
                                <><Loader size={20} className="spin" /> {calcMessage}</>
                            ) : (
                                <>Calcular precio</>
                            )}
                        </motion.button>

                        {calcMessage && calcStatus === 'error' && (
                            <div style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem',
                                fontSize: '0.8rem',
                                color: 'var(--danger)',
                                textAlign: 'center'
                            }}>
                                ❌ {calcMessage}
                            </div>
                        )}

                        {/* Info */}
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(var(--info-rgb), 0.1)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                        }}>
                            <Info size={14} style={{ display: 'inline', marginRight: '4px' }} />
                            El precio se calcula usando la distancia por carretera real (OSRM) y las tarifas oficiales interurbanas del BOJA 2025 (incluyendo retorno).
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default FreeDestinationCalculator;
