import { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import FavoritesContext from '../context/FavoritesContext';
import PropertyCard from '../components/PropertyCard';

const HeartEmptyIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--ink-3)' }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const Favorites = () => {
    const { user } = useContext(AuthContext);
    const { savedProperties, loading, fetchFavorites } = useContext(FavoritesContext);

    useEffect(() => {
        if (user) {
            fetchFavorites();
        }
    }, [user, fetchFavorites]);

    if (!user) {
        return (
            <main className="container">
                <div className="favorites-empty-box">
                    <HeartEmptyIcon />
                    <h1 className="t-display" style={{ fontSize: 'var(--text-2xl)', marginTop: 'var(--s3)' }}>
                        Save your favorite properties
                    </h1>
                    <p style={{ color: 'var(--ink-3)', margin: 'var(--s2) 0 var(--s5) 0', maxWidth: '420px' }}>
                        Log in or create an account as a tenant to save listings and access them anytime.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--s3)' }}>
                        <Link to="/login" className="btn btn-primary">Sign in</Link>
                        <Link to="/register" className="btn btn-outline">Create account</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="container">
            <div className="favorites-page">
                <header className="page-header">
                    <p className="page-header__eyebrow">Tenant collection</p>
                    <h1 className="page-header__title">Saved listings</h1>
                    <p style={{ color: 'var(--ink-3)', marginTop: 'var(--s1)' }}>
                        Review, compare, and get in touch with owners for your shortlisted rental homes.
                    </p>
                </header>

                {loading ? (
                    <p className="loading-row">Loading your saved properties…</p>
                ) : savedProperties.length === 0 ? (
                    <div className="favorites-empty-box">
                        <HeartEmptyIcon />
                        <h2 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--s3)', fontWeight: 600 }}>
                            You haven't saved any listings yet
                        </h2>
                        <p style={{ color: 'var(--ink-3)', margin: 'var(--s2) 0 var(--s5) 0', maxWidth: '400px' }}>
                            Tap the heart icon on any property to keep track of the rentals you love.
                        </p>
                        <Link to="/" className="btn btn-primary">
                            Explore available rentals
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="section-row">
                            <h2 className="section-title">Saved properties</h2>
                            <span className="section-count">
                                {savedProperties.length} listing{savedProperties.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="property-grid">
                            {savedProperties.map(property => (
                                <PropertyCard key={property._id} property={property} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default Favorites;
