import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import FilterBar from '../components/FilterBar';
import ListingsMapView from '../components/ListingsMapView';

const GridIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const MapIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
);

const Home = () => {
    const [properties, setProperties] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [currentFilters, setCurrentFilters] = useState({});
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

    const fetchProperties = useCallback(async (filters = currentFilters, sort = sortBy, pageNum = page) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Append filters
            Object.entries(filters).forEach(([key, val]) => {
                if (val !== '' && val !== null && val !== undefined) {
                    if (Array.isArray(val) && val.length > 0) {
                        queryParams.append(key, val.join(','));
                    } else if (!Array.isArray(val)) {
                        queryParams.append(key, val);
                    }
                }
            });

            // Sorting & Pagination
            queryParams.append('sortBy', sort);
            queryParams.append('page', pageNum);
            queryParams.append('limit', 9);

            const res = await axios.get(`http://localhost:5000/api/properties?${queryParams.toString()}`);

            if (res.data && res.data.properties) {
                setProperties(res.data.properties);
                setTotal(res.data.total || 0);
                setTotalPages(res.data.totalPages || 1);
                setPage(res.data.page || 1);
            } else if (Array.isArray(res.data)) {
                // Fallback for array response
                setProperties(res.data);
                setTotal(res.data.length);
                setTotalPages(1);
                setPage(1);
            }
        } catch (err) {
            console.error('Failed to fetch properties:', err);
        } finally {
            setLoading(false);
        }
    }, [currentFilters, sortBy, page]);

    useEffect(() => {
        fetchProperties(currentFilters, sortBy, page);
    }, [page, sortBy]);

    const handleFilterSubmit = (newFilters) => {
        setCurrentFilters(newFilters);
        setPage(1);
        fetchProperties(newFilters, sortBy, 1);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <main>
            <div className="container">
                <header className="page-header">
                    <p className="page-header__eyebrow">Public Rental Marketplace</p>
                    <h1 className="page-header__title">
                        Find a property that fits your life — not just your budget.
                    </h1>
                </header>

                <FilterBar
                    onFilter={handleFilterSubmit}
                    currentSort={sortBy}
                    onSortChange={handleSortChange}
                />

                <div className="listing-controls-row">
                    <div className="section-row" style={{ margin: 0 }}>
                        <h2 className="section-title">Available rentals</h2>
                        <span className="section-count">
                            {total} verified listing{total !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* View Switcher: Grid vs Map */}
                    <div className="view-mode-toggle" role="group" aria-label="View mode">
                        <button
                            type="button"
                            className={`view-mode-btn ${viewMode === 'grid' ? 'view-mode-btn--active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            <GridIcon />
                            <span>Grid</span>
                        </button>
                        <button
                            type="button"
                            className={`view-mode-btn ${viewMode === 'map' ? 'view-mode-btn--active' : ''}`}
                            onClick={() => setViewMode('map')}
                            aria-label="Map view"
                        >
                            <MapIcon />
                            <span>Map View</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="loading-row">Searching available properties…</p>
                ) : properties.length === 0 ? (
                    <div className="empty-results-box">
                        <p className="empty-results-title">No listings match your search criteria.</p>
                        <p className="empty-results-sub">Try expanding your price range, clearing filters, or checking different cities.</p>
                    </div>
                ) : viewMode === 'map' ? (
                    <ListingsMapView properties={properties} />
                ) : (
                    <>
                        <div className="property-grid">
                            {properties.map(property => (
                                <PropertyCard key={property._id} property={property} />
                            ))}
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <nav className="pagination-nav" aria-label="Listings pagination">
                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="pagination-btn pagination-btn--prev"
                                >
                                    &larr; Previous
                                </button>

                                <div className="pagination-pages">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => handlePageChange(num)}
                                            className={`pagination-page-num ${page === num ? 'pagination-page-num--active' : ''}`}
                                            aria-current={page === num ? 'page' : undefined}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="pagination-btn pagination-btn--next"
                                >
                                    Next &rarr;
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default Home;
