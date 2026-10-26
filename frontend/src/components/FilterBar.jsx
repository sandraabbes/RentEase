import { useState } from 'react';

const PROPERTY_TYPES = [
    { value: '', label: 'All types' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'House', label: 'House' },
    { value: 'Studio', label: 'Studio' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Duplex', label: 'Duplex' },
    { value: 'Loft', label: 'Loft' },
    { value: 'Penthouse', label: 'Penthouse' },
    { value: 'Room', label: 'Private Room' }
];

const POPULAR_AMENITIES = [
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
    'Security'
];

const FilterBar = ({ onFilter, currentSort = 'newest', onSortChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState({
        city: '',
        minPrice: '',
        maxPrice: '',
        rooms: '',
        bedrooms: '',
        bathrooms: '',
        propertyType: '',
        furnished: '',
        petsAllowed: '',
        availableFrom: '',
        amenities: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleAmenityToggle = (amenity) => {
        setFilters(prev => {
            const exists = prev.amenities.includes(amenity);
            return {
                ...prev,
                amenities: exists
                    ? prev.amenities.filter(a => a !== amenity)
                    : [...prev.amenities, amenity]
            };
        });
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        onFilter(filters);
    };

    const handleReset = () => {
        const cleared = {
            city: '',
            minPrice: '',
            maxPrice: '',
            rooms: '',
            bedrooms: '',
            bathrooms: '',
            propertyType: '',
            furnished: '',
            petsAllowed: '',
            availableFrom: '',
            amenities: []
        };
        setFilters(cleared);
        onFilter(cleared);
    };

    // Count how many non-default filters are active
    const activeFiltersCount = [
        filters.city,
        filters.minPrice,
        filters.maxPrice,
        filters.rooms,
        filters.bedrooms,
        filters.bathrooms,
        filters.propertyType,
        filters.furnished,
        filters.petsAllowed,
        filters.availableFrom
    ].filter(Boolean).length + (filters.amenities.length > 0 ? 1 : 0);

    return (
        <section className="filter-wrapper" aria-label="Search and filter listings">
            <form onSubmit={handleSubmit} className="filter-bar-main" role="search">
                {/* City */}
                <div className="filter-field filter-field--city">
                    <label htmlFor="filter-city">City or Area</label>
                    <input
                        id="filter-city"
                        type="text"
                        name="city"
                        placeholder="e.g. Tunis, Marsa..."
                        value={filters.city}
                        onChange={handleChange}
                        className="filter-input"
                    />
                </div>

                {/* Property Type */}
                <div className="filter-field">
                    <label htmlFor="filter-type">Property Type</label>
                    <select
                        id="filter-type"
                        name="propertyType"
                        value={filters.propertyType}
                        onChange={handleChange}
                        className="filter-select"
                    >
                        {PROPERTY_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Min Price */}
                <div className="filter-field filter-field--num">
                    <label htmlFor="filter-min-price">Min Rent ($)</label>
                    <input
                        id="filter-min-price"
                        type="number"
                        name="minPrice"
                        placeholder="0"
                        min="0"
                        value={filters.minPrice}
                        onChange={handleChange}
                        className="filter-input"
                    />
                </div>

                {/* Max Price */}
                <div className="filter-field filter-field--num">
                    <label htmlFor="filter-max-price">Max Rent ($)</label>
                    <input
                        id="filter-max-price"
                        type="number"
                        name="maxPrice"
                        placeholder="Any"
                        min="0"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        className="filter-input"
                    />
                </div>

                {/* Sort selector */}
                <div className="filter-field filter-field--sort">
                    <label htmlFor="filter-sort">Sort By</label>
                    <select
                        id="filter-sort"
                        value={currentSort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="filter-select"
                    >
                        <option value="newest">Newest first</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="surface_desc">Largest Area (m²)</option>
                        <option value="rooms_desc">Most Rooms</option>
                    </select>
                </div>

                {/* Buttons */}
                <div className="filter-actions">
                    <button type="submit" className="btn btn-primary filter-btn">
                        Apply
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`btn btn-outline filter-btn ${isExpanded ? 'filter-btn--active' : ''}`}
                    >
                        <span>More Filters</span>
                        {activeFiltersCount > 0 && (
                            <span className="filter-badge-count">{activeFiltersCount}</span>
                        )}
                    </button>
                    {activeFiltersCount > 0 && (
                        <button type="button" onClick={handleReset} className="btn btn-ghost filter-btn">
                            Reset
                        </button>
                    )}
                </div>
            </form>

            {/* Extended Filters Panel */}
            {isExpanded && (
                <div className="filter-expanded-panel">
                    <div className="filter-expanded-grid">
                        {/* Bedrooms */}
                        <div className="filter-field">
                            <label htmlFor="filter-bedrooms">Bedrooms</label>
                            <select
                                id="filter-bedrooms"
                                name="bedrooms"
                                value={filters.bedrooms}
                                onChange={handleChange}
                                className="filter-select"
                            >
                                <option value="">Any</option>
                                <option value="1">1+ bed</option>
                                <option value="2">2+ beds</option>
                                <option value="3">3+ beds</option>
                                <option value="4">4+ beds</option>
                            </select>
                        </div>

                        {/* Bathrooms */}
                        <div className="filter-field">
                            <label htmlFor="filter-bathrooms">Bathrooms</label>
                            <select
                                id="filter-bathrooms"
                                name="bathrooms"
                                value={filters.bathrooms}
                                onChange={handleChange}
                                className="filter-select"
                            >
                                <option value="">Any</option>
                                <option value="1">1+ bath</option>
                                <option value="2">2+ baths</option>
                                <option value="3">3+ baths</option>
                            </select>
                        </div>

                        {/* Furnished */}
                        <div className="filter-field">
                            <label htmlFor="filter-furnished">Furnishing</label>
                            <select
                                id="filter-furnished"
                                name="furnished"
                                value={filters.furnished}
                                onChange={handleChange}
                                className="filter-select"
                            >
                                <option value="">Any</option>
                                <option value="true">Furnished only</option>
                                <option value="false">Unfurnished only</option>
                            </select>
                        </div>

                        {/* Pets Allowed */}
                        <div className="filter-field">
                            <label htmlFor="filter-pets">Pets</label>
                            <select
                                id="filter-pets"
                                name="petsAllowed"
                                value={filters.petsAllowed}
                                onChange={handleChange}
                                className="filter-select"
                            >
                                <option value="">Any</option>
                                <option value="true">Pets allowed</option>
                            </select>
                        </div>

                        {/* Available From */}
                        <div className="filter-field">
                            <label htmlFor="filter-available">Available on / before</label>
                            <input
                                id="filter-available"
                                type="date"
                                name="availableFrom"
                                value={filters.availableFrom}
                                onChange={handleChange}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    {/* Amenities Checklist */}
                    <div className="filter-amenities-section">
                        <p className="filter-amenities-title">Amenities & Features</p>
                        <div className="amenities-chips-grid">
                            {POPULAR_AMENITIES.map((amenity) => {
                                const active = filters.amenities.includes(amenity);
                                return (
                                    <button
                                        type="button"
                                        key={amenity}
                                        onClick={() => handleAmenityToggle(amenity)}
                                        className={`amenity-chip ${active ? 'amenity-chip--active' : ''}`}
                                    >
                                        <span className="amenity-chip-check">{active ? '✓' : '+'}</span>
                                        {amenity}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="filter-panel-footer">
                        <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
                            Clear all filters
                        </button>
                        <button type="button" onClick={handleSubmit} className="btn btn-primary btn-sm">
                            Apply {activeFiltersCount > 0 ? `(${activeFiltersCount} filters)` : 'Filters'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FilterBar;
