import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ListingsMapView = ({ properties = [], onSelectProperty }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);

    // Filter properties that have valid coords
    const mappedProps = properties.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng));

    useEffect(() => {
        if (!mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
            const defaultCenter = mappedProps.length > 0
                ? [mappedProps[0].lat, mappedProps[0].lng]
                : [36.8065, 10.1815];

            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 12,
                scrollWheelZoom: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(map);

            const markersLayer = L.layerGroup().addTo(map);
            markersLayerRef.current = markersLayer;
            mapInstanceRef.current = map;
        }

        // Update markers
        if (markersLayerRef.current && mapInstanceRef.current) {
            markersLayerRef.current.clearLayers();

            const bounds = [];

            mappedProps.forEach(p => {
                const priceFormatted = `$${Number(p.price).toLocaleString()}`;
                const priceBadgeIcon = L.divIcon({
                    className: 'map-price-badge-icon',
                    html: `
                        <div class="map-price-marker">
                            ${priceFormatted}
                        </div>
                    `,
                    iconSize: [60, 26],
                    iconAnchor: [30, 13]
                });

                const popupHtml = `
                    <div style="font-family: inherit; width: 200px;">
                        ${p.images && p.images[0] ? `<img src="${p.images[0]}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ''}
                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #7a786f; font-weight: 600;">${p.propertyType || 'Apartment'} &bull; ${p.city}</div>
                        <h4 style="font-size: 13px; font-weight: 700; margin: 3px 0 6px 0; color: #111010; line-height: 1.2;">${p.title}</h4>
                        <div style="font-weight: 700; font-size: 14px; color: #1a1a2e; margin-bottom: 8px;">${priceFormatted} <span style="font-size: 11px; font-weight: 400; color: #7a786f;">/ mo</span></div>
                        <a href="/properties/${p._id}" style="display: block; text-align: center; background: #1a1a2e; color: #ffffff; padding: 6px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-decoration: none;">View details &rarr;</a>
                    </div>
                `;

                const marker = L.marker([p.lat, p.lng], { icon: priceBadgeIcon })
                    .bindPopup(popupHtml);

                marker.on('click', () => {
                    if (onSelectProperty) onSelectProperty(p);
                });

                markersLayerRef.current.addLayer(marker);
                bounds.push([p.lat, p.lng]);
            });

            if (bounds.length > 0 && mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [properties]);

    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markersLayerRef.current = null;
            }
        };
    }, []);

    if (mappedProps.length === 0) {
        return (
            <div className="map-view-empty">
                <p>None of the properties in current view have coordinates on the map.</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-3)', marginTop: '4px' }}>
                    Switch back to Grid view to see all {properties.length} listings.
                </p>
            </div>
        );
    }

    return (
        <div className="listings-map-wrapper">
            <div
                ref={mapContainerRef}
                style={{ height: '580px', width: '100%', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--line)' }}
            />
            <div className="map-overlay-badge">
                📍 Showing {mappedProps.length} property pin{mappedProps.length !== 1 ? 's' : ''} on map
            </div>
        </div>
    );
};

export default ListingsMapView;
