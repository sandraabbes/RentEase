import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG icon for Leaflet marker
const customPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
        <div style="
            background: #1a1a2e;
            color: #c8a96e;
            width: 34px;
            height: 34px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
        ">
            <svg style="transform: rotate(45deg); width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
});

const MapPicker = ({ lat, lng, address, onChange }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Initial center: provided lat/lng or default to Tunis (36.8065, 10.1815)
    const initialLat = lat && !isNaN(lat) ? Number(lat) : 36.8065;
    const initialLng = lng && !isNaN(lng) ? Number(lng) : 10.1815;
    const hasInitialCoords = lat && lng && !isNaN(lat) && !isNaN(lng);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Leaflet map
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [initialLat, initialLng],
                zoom: hasInitialCoords ? 14 : 11,
                scrollWheelZoom: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            // Add marker if initial coords exist
            if (hasInitialCoords) {
                const marker = L.marker([initialLat, initialLng], {
                    icon: customPinIcon,
                    draggable: true
                }).addTo(map);

                marker.on('dragend', (e) => {
                    const { lat: newLat, lng: newLng } = e.target.getLatLng();
                    handleCoordUpdate(newLat, newLng);
                });

                markerRef.current = marker;
            }

            // Click listener on map to place/move marker
            map.on('click', (e) => {
                const { lat: clickedLat, lng: clickedLng } = e.latlng;
                if (markerRef.current) {
                    markerRef.current.setLatLng([clickedLat, clickedLng]);
                } else {
                    const newMarker = L.marker([clickedLat, clickedLng], {
                        icon: customPinIcon,
                        draggable: true
                    }).addTo(map);

                    newMarker.on('dragend', (ev) => {
                        const { lat: newLat, lng: newLng } = ev.target.getLatLng();
                        handleCoordUpdate(newLat, newLng);
                    });

                    markerRef.current = newMarker;
                }
                handleCoordUpdate(clickedLat, clickedLng, true);
            });

            mapInstanceRef.current = map;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    // Helper to update coords and optionally reverse geocode
    const handleCoordUpdate = async (newLat, newLng, doReverse = false) => {
        const roundedLat = parseFloat(Number(newLat).toFixed(6));
        const roundedLng = parseFloat(Number(newLng).toFixed(6));

        onChange({
            lat: roundedLat,
            lng: roundedLng
        });

        if (doReverse && (!address || address.trim() === '')) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}`);
                const data = await res.json();
                if (data && data.display_name) {
                    const shortAddr = data.address?.road
                        ? `${data.address.road}${data.address.suburb ? ', ' + data.address.suburb : ''}`
                        : data.display_name.split(',').slice(0, 3).join(',');
                    onChange({
                        lat: roundedLat,
                        lng: roundedLng,
                        address: shortAddr
                    });
                }
            } catch (e) {
                // Ignore geocoding failure gracefully
            }
        }
    };

    // Search address with Nominatim
    const handleSearch = async (e) => {
        e.preventDefault();
        const query = searchQuery || address;
        if (!query || !query.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const foundLat = parseFloat(data[0].lat);
                const foundLng = parseFloat(data[0].lon);

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([foundLat, foundLng], 15);
                    if (markerRef.current) {
                        markerRef.current.setLatLng([foundLat, foundLng]);
                    } else {
                        const newMarker = L.marker([foundLat, foundLng], {
                            icon: customPinIcon,
                            draggable: true
                        }).addTo(mapInstanceRef.current);

                        newMarker.on('dragend', (ev) => {
                            const { lat: newLat, lng: newLng } = ev.target.getLatLng();
                            handleCoordUpdate(newLat, newLng);
                        });

                        markerRef.current = newMarker;
                    }
                }

                onChange({
                    lat: parseFloat(foundLat.toFixed(6)),
                    lng: parseFloat(foundLng.toFixed(6))
                });
            } else {
                alert('Location not found. Try clicking directly on the map.');
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // Clear marker
    const handleClear = () => {
        if (markerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
        onChange({ lat: null, lng: null });
    };

    return (
        <div className="map-picker-wrapper">
            <div className="map-picker-search-bar">
                <input
                    type="text"
                    placeholder="Search an address, city, or neighborhood to locate on map..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="map-picker-search-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(e); }}
                />
                <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="btn btn-primary btn-sm map-search-btn"
                >
                    {isSearching ? 'Locating…' : 'Locate'}
                </button>
            </div>

            <p className="map-picker-tip">
                💡 <em>Click anywhere on the map or drag the pin to set the exact property location.</em>
            </p>

            <div
                ref={mapContainerRef}
                className="map-picker-container"
                style={{ height: '300px', width: '100%', borderRadius: 'var(--r-md)', overflow: 'hidden' }}
            />

            <div className="map-picker-coords">
                {lat && lng ? (
                    <>
                        <span className="coord-badge">
                            <strong>Lat:</strong> {Number(lat).toFixed(5)}
                        </span>
                        <span className="coord-badge">
                            <strong>Lng:</strong> {Number(lng).toFixed(5)}
                        </span>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="coord-clear-btn"
                            title="Remove pin"
                        >
                            Remove pin
                        </button>
                    </>
                ) : (
                    <span className="coord-none">No pin placed yet (optional, but recommended).</span>
                )}
            </div>
        </div>
    );
};

export default MapPicker;
