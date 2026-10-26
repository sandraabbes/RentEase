import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
        <div style="
            background: #1a1a2e;
            color: #c8a96e;
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 2px solid #ffffff;
        ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

const PropertyMap = ({ lat, lng, title, address, city, price }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const hasCoords = lat !== null && lat !== undefined && lng !== null && lng !== undefined && !isNaN(lat) && !isNaN(lng);

    useEffect(() => {
        if (!hasCoords || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [Number(lat), Number(lng)],
                zoom: 15,
                scrollWheelZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            const popupContent = `
                <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
                    <strong style="color: #1a1a2e; font-size: 14px; display: block; margin-bottom: 2px;">${title || 'Property Location'}</strong>
                    <div style="color: #7a786f; margin-bottom: 4px;">${address || city || ''}</div>
                    ${price ? `<div style="color: #1a1a2e; font-weight: 700;">$${Number(price).toLocaleString()} <span style="font-weight: 400; color: #7a786f; font-size: 11px;">/ month</span></div>` : ''}
                    <div style="margin-top: 6px;">
                        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color: #c8a96e; font-weight: 600; text-decoration: underline; font-size: 12px;">Open in Google Maps &rarr;</a>
                    </div>
                </div>
            `;

            L.marker([Number(lat), Number(lng)], { icon: customPinIcon })
                .addTo(map)
                .bindPopup(popupContent)
                .openPopup();

            mapInstanceRef.current = map;
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, hasCoords, title, address, city, price]);

    if (!hasCoords) {
        return (
            <div className="property-map-fallback">
                <div className="map-fallback-icon">📍</div>
                <div>
                    <h3 className="map-fallback-title">Location: {address ? `${address}, ${city}` : city || 'Undisclosed'}</h3>
                    <p className="map-fallback-sub">Map coordinates have not been provided for this property.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="property-map-section">
            <div className="property-map-header">
                <div>
                    <h2 className="detail-section-title">Location & Surroundings</h2>
                    <p className="detail-section-subtitle">
                        {address ? `${address}, ` : ''}{city}
                    </p>
                </div>
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                >
                    Get Directions
                </a>
            </div>
            <div
                ref={mapContainerRef}
                className="property-map-view"
                style={{ height: '360px', width: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)' }}
            />
        </div>
    );
};

export default PropertyMap;
