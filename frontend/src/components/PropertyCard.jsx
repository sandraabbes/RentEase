import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import FavoritesContext from '../context/FavoritesContext';

/* Inline SVG icons — consistent stroke-width 1.75 */
const MapPinIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
    </svg>
);

const BedIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
    </svg>
);

const BathIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h1M4 21l1-2M20 21l-1-2"/>
    </svg>
);

const MaximizeIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
);

const HeartIcon = ({ filled }) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={filled ? '#e63946' : 'none'}
        stroke={filled ? '#e63946' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const PropertyCard = ({ property }) => {
    const { user } = useContext(AuthContext);
    const { isFavorite, toggleFavorite } = useContext(FavoritesContext);
    const navigate = useNavigate();

    const hasImage = property.images && property.images.length > 0;
    const favorited = isFavorite(property._id);

    const handleHeartClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }
        toggleFavorite(property);
    };

    return (
        <article className="property-card">
            <div className="card-image-container">
                {hasImage ? (
                    <img
                        src={property.images[0]}
                        alt={property.title}
                        className="card-image"
                        loading="lazy"
                    />
                ) : (
                    <div className="card-no-image">No photo</div>
                )}

                {/* Top badges */}
                <div className="card-top-badges">
                    <span className="card-type-badge">
                        {property.propertyType || 'Apartment'}
                    </span>
                    {property.status && property.status !== 'available' && (
                        <span className={`status-badge status-badge--${property.status}`}>
                            {property.status}
                        </span>
                    )}
                </div>

                {/* Favorite Heart Button */}
                <button
                    type="button"
                    className={`card-heart-btn ${favorited ? 'card-heart-btn--active' : ''}`}
                    onClick={handleHeartClick}
                    aria-label={favorited ? 'Remove from saved' : 'Save property'}
                    title={favorited ? 'Remove from saved listings' : 'Save listing'}
                >
                    <HeartIcon filled={favorited} />
                </button>
            </div>

            <div className="card-content">
                <p className="card-city">
                    <MapPinIcon />
                    {property.address ? `${property.address}, ` : ''}{property.city}
                </p>

                <h3 className="card-title">
                    <Link to={`/properties/${property._id}`}>{property.title}</Link>
                </h3>

                <p className="card-price">
                    ${Number(property.price).toLocaleString()}
                    <span> / month</span>
                </p>

                <div className="card-meta">
                    <span className="card-meta-item" title="Bedrooms">
                        <BedIcon />
                        {property.bedrooms || property.rooms || 1} bed{(property.bedrooms || property.rooms || 1) !== 1 ? 's' : ''}
                    </span>
                    <span className="card-meta-item" title="Bathrooms">
                        <BathIcon />
                        {property.bathrooms || 1} bath{(property.bathrooms || 1) !== 1 ? 's' : ''}
                    </span>
                    {property.surfaceArea && (
                        <span className="card-meta-item" title="Surface area">
                            <MaximizeIcon />
                            {property.surfaceArea} m²
                        </span>
                    )}
                </div>

                {/* Feature tags */}
                <div className="card-tags">
                    {property.furnished && (
                        <span className="card-tag card-tag--accent">Furnished</span>
                    )}
                    {property.petsAllowed && (
                        <span className="card-tag">Pets ok</span>
                    )}
                    {property.minLeaseMonths && property.minLeaseMonths > 1 && (
                        <span className="card-tag">{property.minLeaseMonths}m+ lease</span>
                    )}
                </div>
            </div>

            <div className="card-footer">
                <Link
                    to={`/properties/${property._id}`}
                    className="btn btn-outline btn-block"
                >
                    View listing
                </Link>
            </div>
        </article>
    );
};

export default PropertyCard;
