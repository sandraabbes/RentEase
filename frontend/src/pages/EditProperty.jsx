import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import MapPicker from '../components/MapPicker';

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
    </svg>
);

const ImageIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
    </svg>
);

const TrashSmallIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    </svg>
);

const AMENITIES_OPTIONS = [
    'WiFi',
    'Air Conditioning',
    'Balcony',
    'Parking',
    'Elevator',
    'Dishwasher',
    'Washing Machine',
    'Central Heating',
    'Swimming Pool',
    'Gym',
    'Garden',
    'Security',
    'Storage',
    'Concierge'
];

const PROPERTY_TYPES = [
    'Apartment',
    'House',
    'Studio',
    'Villa',
    'Duplex',
    'Loft',
    'Penthouse',
    'Room',
    'Other'
];

const EditProperty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        depositAmount: '',
        city: '',
        address: '',
        lat: null,
        lng: null,
        propertyType: 'Apartment',
        rooms: 1,
        bedrooms: 1,
        bathrooms: 1,
        surfaceArea: '',
        furnished: false,
        petsAllowed: false,
        minLeaseMonths: 1,
        availableFrom: '',
        status: 'available',
        amenities: []
    });

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/properties/${id}`);
                const p = res.data;
                setFormData({
                    title: p.title || '',
                    description: p.description || '',
                    price: p.price || '',
                    depositAmount: p.depositAmount || '',
                    city: p.city || '',
                    address: p.address || '',
                    lat: p.lat || null,
                    lng: p.lng || null,
                    propertyType: p.propertyType || 'Apartment',
                    rooms: p.rooms || 1,
                    bedrooms: p.bedrooms || 1,
                    bathrooms: p.bathrooms || 1,
                    surfaceArea: p.surfaceArea || '',
                    furnished: Boolean(p.furnished),
                    petsAllowed: Boolean(p.petsAllowed),
                    minLeaseMonths: p.minLeaseMonths || 1,
                    availableFrom: p.availableFrom ? p.availableFrom.split('T')[0] : '',
                    status: p.status || 'available',
                    amenities: Array.isArray(p.amenities) ? p.amenities : []
                });
                setExistingImages(p.images || []);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to load property details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const {
        title,
        description,
        price,
        depositAmount,
        city,
        address,
        lat,
        lng,
        propertyType,
        rooms,
        bedrooms,
        bathrooms,
        surfaceArea,
        furnished,
        petsAllowed,
        minLeaseMonths,
        availableFrom,
        status,
        amenities
    } = formData;

    const onChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleMapChange = ({ lat: newLat, lng: newLng, address: newAddr }) => {
        setFormData(prev => ({
            ...prev,
            lat: newLat,
            lng: newLng,
            ...(newAddr ? { address: newAddr } : {})
        }));
    };

    const onFileChange = e => {
        const files = Array.from(e.target.files);
        setNewImages(files);
        setNewImagePreviews(files.map(file => URL.createObjectURL(file)));
    };

    const handleRemoveExistingImage = (idxToRemove) => {
        setExistingImages(prev => prev.filter((_, idx) => idx !== idxToRemove));
    };

    const onSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', title);
            data.append('description', description);
            data.append('price', price);
            data.append('depositAmount', depositAmount || 0);
            data.append('city', city);
            data.append('address', address);
            if (lat !== null && lat !== undefined) data.append('lat', lat);
            if (lng !== null && lng !== undefined) data.append('lng', lng);
            data.append('propertyType', propertyType);
            data.append('rooms', rooms);
            data.append('bedrooms', bedrooms);
            data.append('bathrooms', bathrooms);
            if (surfaceArea) data.append('surfaceArea', surfaceArea);
            data.append('furnished', furnished);
            data.append('petsAllowed', petsAllowed);
            data.append('minLeaseMonths', minLeaseMonths);
            if (availableFrom) data.append('availableFrom', availableFrom);
            data.append('status', status);
            data.append('amenities', JSON.stringify(amenities));
            data.append('existingImages', JSON.stringify(existingImages));

            for (let i = 0; i < newImages.length; i++) {
                data.append('images', newImages[i]);
            }

            await axios.put(`http://localhost:5000/api/properties/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/admin');
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.msg || 'Failed to update property.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container">
                <p className="loading-row">Loading property data…</p>
            </div>
        );
    }

    return (
        <div className="form-centered">
            <div className="form-centered-box" style={{ maxWidth: '780px' }}>
                <button
                    type="button"
                    className="form-back-btn"
                    onClick={() => navigate('/admin')}
                    aria-label="Back to dashboard"
                >
                    <ArrowLeftIcon />
                    Back to dashboard
                </button>

                <h1 className="form-page-title">Edit property listing</h1>
                <p className="form-page-sub">Update property attributes, status, and photos.</p>

                {errorMsg && (
                    <div className="form-error-banner" role="alert">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={onSubmit} noValidate>
                    {/* Basic details */}
                    <p className="form-section-label">1. Primary Information</p>

                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-title">Listing title *</label>
                        <input
                            id="edit-title"
                            type="text"
                            name="title"
                            value={title}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-type">Property type</label>
                            <select id="edit-type" name="propertyType" value={propertyType} onChange={onChange}>
                                {PROPERTY_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-status">Status</label>
                            <select id="edit-status" name="status" value={status} onChange={onChange}>
                                <option value="available">Available (Public)</option>
                                <option value="draft">Draft (Private)</option>
                                <option value="reserved">Reserved</option>
                                <option value="rented">Rented</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-price">Monthly rent ($) *</label>
                            <input
                                id="edit-price"
                                type="number"
                                name="price"
                                value={price}
                                onChange={onChange}
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-deposit">Security deposit ($)</label>
                            <input
                                id="edit-deposit"
                                type="number"
                                name="depositAmount"
                                value={depositAmount}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Location & Map */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        2. Location & Map Pin
                    </p>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-city">City / Area *</label>
                            <input
                                id="edit-city"
                                type="text"
                                name="city"
                                value={city}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-address">Street address</label>
                            <input
                                id="edit-address"
                                type="text"
                                name="address"
                                value={address}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Map Pin Location</label>
                        <MapPicker
                            lat={lat}
                            lng={lng}
                            address={address}
                            onChange={handleMapChange}
                        />
                    </div>

                    {/* Specs & Layout */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        3. Layout & Specs
                    </p>

                    <div className="form-grid-4">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-bedrooms">Bedrooms</label>
                            <input
                                id="edit-bedrooms"
                                type="number"
                                name="bedrooms"
                                value={bedrooms}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-bathrooms">Bathrooms</label>
                            <input
                                id="edit-bathrooms"
                                type="number"
                                name="bathrooms"
                                value={bathrooms}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-rooms">Total rooms</label>
                            <input
                                id="edit-rooms"
                                type="number"
                                name="rooms"
                                value={rooms}
                                onChange={onChange}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-surface">Surface (m²)</label>
                            <input
                                id="edit-surface"
                                type="number"
                                name="surfaceArea"
                                value={surfaceArea}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-available">Available From</label>
                            <input
                                id="edit-available"
                                type="date"
                                name="availableFrom"
                                value={availableFrom}
                                onChange={onChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-min-lease">Min. Lease (months)</label>
                            <input
                                id="edit-min-lease"
                                type="number"
                                name="minLeaseMonths"
                                value={minLeaseMonths}
                                onChange={onChange}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ marginTop: 'var(--s2)' }}>
                        <label className="form-checkbox-label">
                            <input
                                type="checkbox"
                                name="furnished"
                                checked={furnished}
                                onChange={onChange}
                            />
                            <span>Furnished property</span>
                        </label>
                        <label className="form-checkbox-label">
                            <input
                                type="checkbox"
                                name="petsAllowed"
                                checked={petsAllowed}
                                onChange={onChange}
                            />
                            <span>Pets allowed</span>
                        </label>
                    </div>

                    {/* Amenities */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        4. Amenities & Inclusions
                    </p>
                    <div className="amenities-chips-grid" style={{ marginBottom: 'var(--s5)' }}>
                        {AMENITIES_OPTIONS.map(opt => {
                            const isChecked = amenities.includes(opt);
                            return (
                                <button
                                    type="button"
                                    key={opt}
                                    onClick={() => handleAmenityToggle(opt)}
                                    className={`amenity-chip ${isChecked ? 'amenity-chip--active' : ''}`}
                                >
                                    <span className="amenity-chip-check">{isChecked ? '✓' : '+'}</span>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {/* Description */}
                    <p className="form-section-label">5. Description</p>
                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-description">Description *</label>
                        <textarea
                            id="edit-description"
                            name="description"
                            value={description}
                            onChange={onChange}
                            style={{ minHeight: '130px' }}
                            required
                        />
                    </div>

                    {/* Existing & New Photos */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        6. Photos
                    </p>

                    {existingImages.length > 0 && (
                        <div style={{ marginBottom: 'var(--s4)' }}>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)', marginBottom: 'var(--s2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Photos</p>
                            <div className="form-previews-strip">
                                {existingImages.map((src, idx) => (
                                    <div key={idx} className="preview-wrap">
                                        <img src={src} alt="Current photo" className="form-preview-thumb" />
                                        <button
                                            type="button"
                                            className="preview-remove-btn"
                                            onClick={() => handleRemoveExistingImage(idx)}
                                            title="Delete this photo"
                                        >
                                            <TrashSmallIcon />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <div className="file-drop-zone">
                            <label className="file-drop-label" htmlFor="edit-images">
                                <ImageIcon />
                                <span className="file-drop-text">
                                    {newImages.length > 0
                                        ? <><strong>{newImages.length} new photo{newImages.length !== 1 ? 's' : ''} selected</strong></>
                                        : <><strong>Add more photos</strong> or leave empty to keep current</>
                                    }
                                </span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)' }}>
                                    JPEG, PNG, WebP
                                </span>
                            </label>
                            <input
                                id="edit-images"
                                type="file"
                                name="images"
                                onChange={onFileChange}
                                multiple
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>

                        {newImagePreviews.length > 0 && (
                            <div className="form-previews-strip" style={{ marginTop: 'var(--s3)' }}>
                                {newImagePreviews.map((src, idx) => (
                                    <img key={idx} src={src} alt="New upload preview" className="form-preview-thumb" />
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="form-submit-btn"
                        disabled={isSubmitting}
                        style={{ marginTop: 'var(--s6)' }}
                    >
                        {isSubmitting ? 'Saving changes…' : 'Save changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProperty;
