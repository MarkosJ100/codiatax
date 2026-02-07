import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React/Vite
// We'll use custom SVG icons for a better look
const createIcon = (color: string) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const originIcon = createIcon('var(--success)');
const destinationIcon = createIcon('var(--accent-primary)');

interface RouteMapProps {
    origin: [number, number];
    destination: [number, number];
    geometry: [number, number][];
}

// Component to handle map bounds and fitting the route
const MapController: React.FC<{ geometry: [number, number][] }> = ({ geometry }) => {
    const map = useMap();

    useEffect(() => {
        if (geometry.length > 0) {
            const bounds = L.latLngBounds(geometry);
            map.fitBounds(bounds, { padding: [20, 20] });
        }
    }, [map, geometry]);

    return null;
};

const RouteMap: React.FC<RouteMapProps> = ({ origin, destination, geometry }) => {
    return (
        <div style={{
            height: '200px',
            width: '100%',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '1rem',
            border: '1px solid var(--border-light)',
            position: 'relative',
            zIndex: 1
        }}>
            <MapContainer
                center={origin}
                zoom={13}
                scrollWheelZoom={false}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geometry.length > 0 && (
                    <>
                        <Polyline
                            positions={geometry}
                            pathOptions={{
                                color: 'var(--accent-primary)',
                                weight: 4,
                                opacity: 0.8,
                                lineJoin: 'round'
                            }}
                        />
                        <MapController geometry={geometry} />
                    </>
                )}

                <Marker position={origin} icon={originIcon} />
                <Marker position={destination} icon={destinationIcon} />
            </MapContainer>
        </div>
    );
};

export default RouteMap;
