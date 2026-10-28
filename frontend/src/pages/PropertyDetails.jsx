import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import FavoritesContext from '../context/FavoritesContext';
import PropertyMap from '../components/PropertyMap';

/* SVG icons — consistent 16px, stroke-width 1.75 */
const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
    </svg>
);

const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
    </svg>
);

const BedIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>
    </svg>
);

const BathIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h1M4 21l1-2M20 21l-1-2"/>
    </svg>
);

const MaximizeIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
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

const ChatIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const PropertyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { isFavorite, toggleFavorite } = useContext(FavoritesContext);

    const [property, setProperty] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [message, setMessage] = useState('');
    const [msgSent, setMsgSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState(null);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/properties/${id}`);
                setProperty(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProperty();
    }, [id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }
        setSending(true);
        try {
            const res = await axios.post('http://localhost:5000/api/conversations', {
                propertyId: id,
                message
            });
            setConversationId(res.data._id);
            setMsgSent(true);
            setMessage('');
        } catch (err) {
            console.error(err);
            if (err.response?.data?.msg) {
                alert(err.response.data.msg);
            }
        } finally {
            setSending(false);
        }
    };

    if (!property) {
        return (
            <div className="container">
                <p className="loading-row">Loading listing…</p>
            </div>
        );
    }

    const favorited = isFavorite(property._id);
    const images = property.images && property.images.length > 0 ? property.images : [];
    const formattedDate = property.availableFrom
        ? new Date(property.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Immediate';

    const isOwnListing = user && property.owner && (
        (typeof property.owner === 'string' && property.owner === user._id) ||
        (property.owner._id && property.owner._id === user._id)
    );

    return (
        <div className="container">
            <div className="detail-page">
                <div className="detail-top-bar">
                    <button
                        type="button"
                        className="detail-back"
                        onClick={() => navigate(-1)}
                        aria-label="Back to listings"
                    >
                        <ArrowLeftIcon />
                        All listings
                    </button>

                    <button
                        type="button"
                        className={`detail-save-btn ${favorited ? 'detail-save-btn--active' : ''}`}
                        onClick={() => {
                            if (!user) navigate('/login');
                            else toggleFavorite(property);
                        }}
                    >
                        <HeartIcon filled={favorited} />
                        <span>{favorited ? 'Saved to collection' : 'Save property'}</span>
                    </button>
                </div>

                <div className="detail-grid">
                    {/* Left: Gallery & Map */}
                    <div className="detail-media-wrap">
                        <div className="detail-main-image-wrap">
                            {images.length > 0 ? (
                                <img
                                    src={images[selectedImage] || images[0]}
                                    alt={property.title}
                                    className="detail-image"
                                />
                            ) : (
                                <div className="detail-no-image">No photos uploaded for this property</div>
                            )}

                            {property.status && property.status !== 'available' && (
                                <div className={`status-badge-overlay status-badge--${property.status}`}>
                                    {property.status.toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="detail-thumbnails">
                                {images.map((img, idx) => (
                                    <button
                                        type="button"
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`detail-thumb-btn ${selectedImage === idx ? 'detail-thumb-btn--active' : ''}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Map View */}
                        <PropertyMap
                            lat={property.lat}
                            lng={property.lng}
                            title={property.title}
                            address={property.address}
                            city={property.city}
                            price={property.price}
                        />
                    </div>

                    {/* Right: Property Details & Contact Form */}
                    <div className="detail-info">
                        <div className="detail-category-row">
                            <span className="card-type-badge">{property.propertyType || 'Apartment'}</span>
                            <span className="detail-status-pill">{property.status || 'available'}</span>
                        </div>

                        <h1 className="detail-title">{property.title}</h1>

                        <p className="detail-city">
                            <MapPinIcon />
                            {property.address ? `${property.address}, ` : ''}{property.city}
                        </p>

                        <div className="detail-price-box">
                            <div className="detail-price">
                                ${Number(property.price).toLocaleString()}
                                <span> / month</span>
                            </div>
                            {property.depositAmount > 0 && (
                                <div className="detail-deposit">
                                    Deposit: <strong>${Number(property.depositAmount).toLocaleString()}</strong>
                                </div>
                            )}
                        </div>

                        {/* Key Specs Grid */}
                        <div className="detail-specs-grid">
                            <div className="spec-card">
                                <BedIcon />
                                <span className="spec-card__val">{property.bedrooms || property.rooms || 1}</span>
                                <span className="spec-card__label">Bedrooms</span>
                            </div>
                            <div className="spec-card">
                                <BathIcon />
                                <span className="spec-card__val">{property.bathrooms || 1}</span>
                                <span className="spec-card__label">Bathrooms</span>
                            </div>
                            {property.surfaceArea && (
                                <div className="spec-card">
                                    <MaximizeIcon />
                                    <span className="spec-card__val">{property.surfaceArea} m²</span>
                                    <span className="spec-card__label">Area</span>
                                </div>
                            )}
                            <div className="spec-card">
                                <CalendarIcon />
                                <span className="spec-card__val">{property.minLeaseMonths || 1} mo</span>
                                <span className="spec-card__label">Min Lease</span>
                            </div>
                        </div>

                        {/* Availability and furnishing bar */}
                        <div className="detail-highlight-strip">
                            <div className="highlight-item">
                                <span className="highlight-item__label">Available From</span>
                                <span className="highlight-item__val">{formattedDate}</span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-item__label">Furnishing</span>
                                <span className="highlight-item__val">
                                    {property.furnished ? 'Fully Furnished' : 'Unfurnished'}
                                </span>
                            </div>
                            <div className="highlight-item">
                                <span className="highlight-item__label">Pets Policy</span>
                                <span className="highlight-item__val">
                                    {property.petsAllowed ? 'Pets Allowed' : 'No Pets'}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="detail-desc-block">
                            <h2 className="detail-desc-label">About this property</h2>
                            <p className="detail-desc">{property.description}</p>
                        </div>

                        {/* Amenities */}
                        {property.amenities && property.amenities.length > 0 && (
                            <div className="detail-amenities-block">
                                <h2 className="detail-desc-label">Amenities & Features</h2>
                                <div className="detail-amenities-tags">
                                    {property.amenities.map((amenity, i) => (
                                        <span key={i} className="detail-amenity-tag">
                                            <CheckIcon />
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Owner Section */}
                        <div className="contact-section">
                            <h2 className="contact-title">Contact Property Owner</h2>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-3)', marginBottom: 'var(--s3)' }}>
                                {property.owner && property.owner.name ? `Managed by ${property.owner.name}` : 'Direct listing by verified owner'}
                            </p>

                            {isOwnListing ? (
                                <div className="message-info-box">
                                    <ChatIcon />
                                    <span>This is your listing. Tenant messages will appear in your <Link to="/messages" style={{ color: 'var(--accent)', fontWeight: 600 }}>Inbox</Link>.</span>
                                </div>
                            ) : !user ? (
                                <div className="message-info-box">
                                    <ChatIcon />
                                    <span><Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link> to message the owner.</span>
                                </div>
                            ) : msgSent ? (
                                <div className="message-success">
                                    <CheckIcon />
                                    <div>
                                        <p>Message sent! The owner can reply in-app.</p>
                                        <Link
                                            to={`/messages?thread=${conversationId}`}
                                            className="msg-continue-link"
                                        >
                                            <ChatIcon /> View conversation
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSendMessage} noValidate>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="contact-message">Your message</label>
                                        <textarea
                                            id="contact-message"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Hi, I'm interested in this property and would like to arrange a viewing…"
                                            style={{ minHeight: '110px' }}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-block"
                                        style={{ padding: '0.7rem' }}
                                        disabled={sending || !message.trim()}
                                    >
                                        {sending ? 'Sending…' : 'Send message'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetails;
