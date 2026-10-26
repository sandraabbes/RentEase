import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const AddProperty = () => {
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
        rooms: 2,
        bedrooms: 1,
        bathrooms: 1,
        surfaceArea: '',
        furnished: false,
        petsAllowed: false,
        minLeaseMonths: 1,
        availableFrom: new Date().toISOString().split('T')[0],
        status: 'available',
        amenities: []
    });

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

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
        setImages(files);

        // Generate previews
        const previews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const onSubmit = async e => {
        e.preventDefault();
        setErrorMsg('');

        if (!title.trim() || !city.trim() || !price || !description.trim()) {
            setErrorMsg('Please fill in all required fields (title, city, rent, description).');
            return;
        }

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
            data.append('availableFrom', availableFrom);
            data.append('status', status);
            data.append('amenities', JSON.stringify(amenities));

            for (let i = 0; i < images.length; i++) {
                data.append('images', images[i]);
            }

            await axios.post('http://localhost:5000/api/properties', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            navigate('/admin');
        } catch (err) {
            console.error(err);
            setErrorMsg(err.response?.data?.msg || 'Failed to create listing. Please verify your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

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

                <h1 className="form-page-title">Create a new listing</h1>
                <p className="form-page-sub">Provide detailed listing attributes to attract verified tenants.</p>

                {errorMsg && (
                    <div className="form-error-banner" role="alert">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={onSubmit} noValidate>
                    {/* Basic details */}
                    <p className="form-section-label">1. Primary Information</p>

                    <div className="form-group">
                        <label className="form-label" htmlFor="add-title">Listing title *</label>
                        <input
                            id="add-title"
                            type="text"
                            name="title"
                            value={title}
                            onChange={onChange}
                            placeholder="e.g. Elegant 2-Bedroom with Sea View in La Marsa"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-type">Property type</label>
                            <select id="add-type" name="propertyType" value={propertyType} onChange={onChange}>
                                {PROPERTY_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-status">Listing status</label>
                            <select id="add-status" name="status" value={status} onChange={onChange}>
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
                            <label className="form-label" htmlFor="add-price">Monthly rent ($) *</label>
                            <input
                                id="add-price"
                                type="number"
                                name="price"
                                value={price}
                                onChange={onChange}
                                placeholder="e.g. 1200"
                                min="0"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-deposit">Security deposit ($)</label>
                            <input
                                id="add-deposit"
                                type="number"
                                name="depositAmount"
                                value={depositAmount}
                                onChange={onChange}
                                placeholder="e.g. 1200"
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Location & Map Picker */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        2. Location & Map Pin
                    </p>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-city">City / Area *</label>
                            <input
                                id="add-city"
                                type="text"
                                name="city"
                                value={city}
                                onChange={onChange}
                                placeholder="e.g. Tunis"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-address">Street address</label>
                            <input
                                id="add-address"
                                type="text"
                                name="address"
                                value={address}
                                onChange={onChange}
                                placeholder="e.g. 15 Rue de Carthage"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Map Location (Pin Picker)</label>
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
                            <label className="form-label" htmlFor="add-bedrooms">Bedrooms</label>
                            <input
                                id="add-bedrooms"
                                type="number"
                                name="bedrooms"
                                value={bedrooms}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-bathrooms">Bathrooms</label>
                            <input
                                id="add-bathrooms"
                                type="number"
                                name="bathrooms"
                                value={bathrooms}
                                onChange={onChange}
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-rooms">Total rooms</label>
                            <input
                                id="add-rooms"
                                type="number"
                                name="rooms"
                                value={rooms}
                                onChange={onChange}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-surface">Surface (m²)</label>
                            <input
                                id="add-surface"
                                type="number"
                                name="surfaceArea"
                                value={surfaceArea}
                                onChange={onChange}
                                placeholder="e.g. 95"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-available">Available From</label>
                            <input
                                id="add-available"
                                type="date"
                                name="availableFrom"
                                value={availableFrom}
                                onChange={onChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="add-min-lease">Min. Lease (months)</label>
                            <input
                                id="add-min-lease"
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
                        <label className="form-label" htmlFor="add-description">Description *</label>
                        <textarea
                            id="add-description"
                            name="description"
                            value={description}
                            onChange={onChange}
                            placeholder="Describe natural lighting, view, transport options, recent renovations, neighborhood vibe..."
                            style={{ minHeight: '130px' }}
                            required
                        />
                    </div>

                    {/* Photos */}
                    <p className="form-section-label" style={{ marginTop: 'var(--s6)' }}>
                        6. Property Photos
                    </p>
                    <div className="form-group">
                        <div className="file-drop-zone">
                            <label className="file-drop-label" htmlFor="add-images">
                                <ImageIcon />
                                <span className="file-drop-text">
                                    {images.length > 0
                                        ? <><strong>{images.length} file{images.length !== 1 ? 's' : ''} selected</strong></>
                                        : <><strong>Choose photos</strong> or drag them here</>
                                    }
                                </span>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)' }}>
                                    JPEG, PNG, WebP — multiple photos supported
                                </span>
                            </label>
                            <input
                                id="add-images"
                                type="file"
                                name="images"
                                onChange={onFileChange}
                                multiple
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Thumbnails preview */}
                        {imagePreviews.length > 0 && (
                            <div className="form-previews-strip">
                                {imagePreviews.map((src, idx) => (
                                    <img key={idx} src={src} alt="Preview" className="form-preview-thumb" />
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
                        {isSubmitting ? 'Creating listing…' : 'Publish listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProperty;
