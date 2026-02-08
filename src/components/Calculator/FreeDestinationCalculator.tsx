import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin, Navigation, Loader, Info, ArrowLeft, Clock, Route
} from 'lucide-react';
import { getCurrentTariff, getTariffReason } from '../../data/taxiFares2025';
import { calculateRoute, geocodeAddress, reverseGeocode, calculateFare, Coordinates, FareCalculation, getLocationSuggestions, LocationSuggestion } from '../../services/routingService';
import { getDestinationWeather, WeatherInfo } from '../../services/weatherService';
import { getTrafficIncidents, extractProvince, TrafficIncident } from '../../services/trafficService';
import RouteMap from './RouteMap';
import { Cloud, Thermometer, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSuggestionCoords, setSelectedSuggestionCoords] = useState<Coordinates | null>(null);
    const [weather, setWeather] = useState<WeatherInfo | null>(null);
    const [traffic, setTraffic] = useState<TrafficIncident[]>([]);
    const suggestionsRef = useRef<HTMLDivElement>(null);

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

    // Autocomplete effect
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (destination.trim().length >= 3 && !isSearching) {
                const results = await getLocationSuggestions(destination);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [destination, isSearching]);

    const handleSelectSuggestion = (s: LocationSuggestion) => {
        setIsSearching(true);
        setDestination(s.displayName);
        // Store the coordinates from the suggestion
        const coords = { lat: s.lat, lng: s.lng };
        setSelectedSuggestionCoords(coords);
        setSuggestions([]);
        setShowSuggestions(false);

        // Auto-calculate immediately
        setTimeout(() => {
            setIsSearching(false);
            handleCalculate(coords, s.displayName);
        }, 300);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    // Calculate route and fare
    const handleCalculate = async (forcedCoords?: Coordinates, forcedName?: string) => {
        if (!userLocation || (!destination.trim() && !forcedCoords)) {
            setCalcMessage('Necesitas ubicación y destino');
            return;
        }

        setCalcStatus('loading');

        let destCoords: Coordinates;
        let geoDisplayName: string;

        // Use forced coords (from auto-select) or stored coordinates if available
        if (forcedCoords) {
            destCoords = forcedCoords;
            geoDisplayName = forcedName || destination;
        } else if (selectedSuggestionCoords) {
            setCalcMessage('Usando destino seleccionado...');
            destCoords = selectedSuggestionCoords;
            geoDisplayName = destination;
        } else {
            // Otherwise, geocode the destination
            setCalcMessage('Buscando destino...');
            const geoResult = await geocodeAddress(destination);
            if (!geoResult.success) {
                setCalcStatus('error');
                setCalcMessage(geoResult.error || 'Destino no encontrado');
                return;
            }
            destCoords = { lat: geoResult.lat, lng: geoResult.lng };
            geoDisplayName = geoResult.displayName;
        }

        setDestinationCoords(destCoords);
        setDestinationName(geoDisplayName);

        // Extract readable destination address
        const parts = geoDisplayName.split(',');
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

        // Fetch smart info (weather & traffic) in parallel
        try {
            const [weatherData, trafficData] = await Promise.all([
                getDestinationWeather(destCoords.lat, destCoords.lng),
                getTrafficIncidents(extractProvince(geoDisplayName))
            ]);
            setWeather(weatherData);
            setTraffic(trafficData);
        } catch (e) {
            console.error('Error fetching smart info:', e);
        }
    };

    // Launch native navigator
    const handleOpenNavigator = () => {
        if (!destinationCoords || !userLocation) return;

        const { lat: destLat, lng: destLng } = destinationCoords;
        const { lat: userLat, lng: userLng } = userLocation;

        // Google Maps (Universal) - uses 'dir' mode for directions
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`;

        // Apple Maps (iOS specialized)
        const appleMapsUrl = `http://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&dirflg=d`;

        // Detection for iOS/Safari to use Apple Maps, else Google Maps
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            window.open(appleMapsUrl, '_blank');
        } else {
            window.open(googleMapsUrl, '_blank');
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: '2rem' }}>
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
                                Calcula el precio y navega al destino
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Section - ALWAYS VISIBLE */}
                <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                    {/* 1. Origin / Location Section */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <Navigation size={14} color={userLocation ? 'var(--success)' : 'var(--accent-primary)'} />
                            Punto de Origen
                        </div>

                        {!userLocation ? (
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleGetLocation}
                                disabled={geoStatus === 'loading'}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: geoStatus === 'loading' ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    boxShadow: '0 4px 12px rgba(var(--accent-primary-rgb), 0.2)'
                                }}
                            >
                                {geoStatus === 'loading' ? (
                                    <><Loader size={18} className="spin" /> Localizando...</>
                                ) : (
                                    <><Navigation size={18} /> Usar mi ubicación actual</>
                                )}
                            </motion.button>
                        ) : (
                            <div
                                onClick={handleGetLocation}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: 'rgba(var(--success-rgb), 0.05)',
                                    border: '1px solid rgba(var(--success-rgb), 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--success)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Navigation size={16} color="#fff" />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--success)' }}>
                                        📍 Ubicación detectada
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem',
                                        color: 'var(--text-primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {originAddress ? `${originAddress.street}${originAddress.city ? `, ${originAddress.city}` : ''}` : 'Detectando dirección...'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. Destination Section */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <MapPin size={14} color="var(--accent-primary)" />
                            Destino del Viaje
                        </div>

                        <div style={{ position: 'relative' }} ref={suggestionsRef}>
                            <input
                                type="text"
                                placeholder="Escribe el destino (ej: Aeropuerto Sevilla)"
                                value={destination}
                                onChange={(e) => {
                                    setDestination(e.target.value);
                                    setSelectedSuggestionCoords(null);
                                }}
                                onFocus={() => destination.length >= 3 && setShowSuggestions(suggestions.length > 0)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    outline: 'none'
                                }}
                            />
                            {showSuggestions && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 1000,
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                                    boxShadow: 'var(--shadow-xl)',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    marginTop: '2px'
                                }}>
                                    {suggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleSelectSuggestion(s)}
                                            style={{
                                                padding: '14px 16px',
                                                fontSize: '0.95rem',
                                                borderBottom: i === suggestions.length - 1 ? 'none' : '1px solid var(--border-light)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <MapPin size={16} color="var(--text-muted)" />
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                                                {s.displayName}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manual Calculate Button */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCalculate()}
                        disabled={!userLocation || !destination.trim() || calcStatus === 'loading'}
                        style={{
                            marginTop: '1.25rem',
                            width: '100%',
                            padding: '1rem',
                            backgroundColor: (!userLocation || !destination.trim()) ? 'var(--bg-secondary)' : 'var(--success)',
                            color: (!userLocation || !destination.trim()) ? 'var(--text-muted)' : '#fff',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            cursor: (!userLocation || !destination.trim() || calcStatus === 'loading') ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {calcStatus === 'loading' ? (
                            <><Loader size={20} className="spin" /> {calcMessage || 'Calculando...'}</>
                        ) : (
                            <><Route size={20} /> CALCULAR TRAYECTO</>
                        )}
                    </motion.button>

                    {calcMessage && calcStatus === 'error' && (
                        <div style={{
                            marginTop: '0.75rem',
                            fontSize: '0.85rem',
                            color: 'var(--danger)',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            ❌ {calcMessage}
                        </div>
                    )}
                </div>

                {/* Tariff Info */}
                <div className="card" style={{
                    marginBottom: '1rem',
                    border: '1px solid',
                    borderColor: currentTariff.type === 'tarifa8' ? 'rgba(var(--warning-rgb), 0.3)' : 'rgba(var(--success-rgb), 0.3)',
                    backgroundColor: 'var(--bg-primary)',
                    padding: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                backgroundColor: currentTariff.type === 'tarifa8' ? 'var(--warning)' : 'var(--success)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Clock size={20} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TARIFA ACTUAL</div>
                                <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{currentTariff.label}</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{getTariffReason()}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{currentTariff.description}</div>
                        </div>
                    </div>
                </div>

                {/* Result Section */}
                {result && calcStatus !== 'loading' && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card"
                        style={{ borderTop: '4px solid var(--success)', padding: '0px', overflow: 'hidden' }}
                    >
                        {/* Price Header */}
                        <div style={{
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, rgba(var(--success-rgb), 0.15), rgba(var(--success-rgb), 0.05))',
                            textAlign: 'center',
                            borderBottom: '1px solid var(--border-light)'
                        }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                Precio Estimado (con Retorno)
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--success)', letterSpacing: '-0.02em' }}>
                                {formatPrice(result.totalFare)}<span style={{ fontSize: '1.5rem', marginLeft: '4px' }}>€</span>
                            </div>
                        </div>

                        {/* Route Map */}
                        {userLocation && destinationCoords && (
                            <div style={{ height: '220px', position: 'relative' }}>
                                <RouteMap
                                    origin={[userLocation.lat, userLocation.lng]}
                                    destination={[destinationCoords.lat, destinationCoords.lng]}
                                    geometry={routeGeometry}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '12px',
                                    right: '12px',
                                    padding: '6px 12px',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: '700',
                                    color: '#333',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Navigation size={12} color="var(--accent-primary)" />
                                    {routeDistance.toFixed(1)} km
                                </div>
                            </div>
                        )}

                        <div style={{ padding: '1.25rem' }}>
                            {/* Details Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.75rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>TIEMPO</div>
                                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>{Math.round(routeDuration)} min</div>
                                </div>
                                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>DISTANCIA</div>
                                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>{routeDistance.toFixed(1)} km</div>
                                </div>
                                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>PRECIO/KM</div>
                                    <div style={{ fontWeight: '800', fontSize: '1rem' }}>{(currentTariff.pricePerKm * 2).toFixed(2)}€</div>
                                </div>
                            </div>

                            {/* Smart Info Section */}
                            <div style={{
                                backgroundColor: 'rgba(var(--accent-primary-rgb), 0.03)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgba(var(--accent-primary-rgb), 0.1)',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: '800',
                                    color: 'var(--accent-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '1rem'
                                }}>
                                    <Info size={14} />
                                    ESTADO DEL DESTINO
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: traffic.length > 0 ? '1rem' : '0px' }}>
                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: 'var(--bg-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        border: '1px solid var(--border-light)'
                                    }}>
                                        <div style={{ fontSize: '1.5rem' }}>{weather?.icon || '🌡️'}</div>
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>CLIMA</div>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>
                                                {weather ? `${weather.temperature}°C` : '--°C'}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                {weather?.condition || 'Cargando...'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '0.75rem',
                                        backgroundColor: traffic.length > 0 ? 'rgba(var(--warning-rgb), 0.05)' : 'rgba(var(--success-rgb), 0.05)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        border: '1px solid',
                                        borderColor: traffic.length > 0 ? 'rgba(var(--warning-rgb), 0.2)' : 'rgba(var(--success-rgb), 0.2)'
                                    }}>
                                        {traffic.length > 0 ? <AlertTriangle size={20} color="var(--warning)" /> : <ShieldCheck size={20} color="var(--success)" />}
                                        <div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-muted)' }}>TRÁFICO</div>
                                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: traffic.length > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                                {traffic.length > 0 ? `${traffic.length} Alertas` : 'Vía despejada'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Traffic Alerts List */}
                                {traffic.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {traffic.map((t, idx) => (
                                            <div key={idx} style={{
                                                padding: '0.85rem',
                                                backgroundColor: 'var(--bg-primary)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.75rem',
                                                borderLeft: `3px solid ${t.level === 'red' ? 'var(--danger)' : 'var(--warning)'}`,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AlertTriangle size={12} color={t.level === 'red' ? 'var(--danger)' : 'var(--warning)'} />
                                                    {t.road}: {t.type}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{t.description}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Navigation Action */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleOpenNavigator}
                                style={{
                                    width: '100%',
                                    padding: '1.15rem',
                                    backgroundColor: 'var(--accent-primary)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    fontSize: '1.05rem',
                                    boxShadow: '0 8px 16px rgba(var(--accent-primary-rgb), 0.3)'
                                }}
                            >
                                <Navigation size={22} />
                                INICIAR NAVEGACIÓN GPS
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default FreeDestinationCalculator;
