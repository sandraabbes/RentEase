import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import FavoritesContext from '../context/FavoritesContext';

const HeartNavIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
);

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { favoriteIds } = useContext(FavoritesContext);
    const location = useLocation();

    const isOwnerOrAdmin = user && (user.role === 'admin' || user.role === 'owner');

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                Rent<span>Ease</span>
            </Link>
            <ul className="nav-links">
                <li>
                    <Link
                        to="/"
                        className={`nav-link ${location.pathname === '/' ? 'nav-link--active' : ''}`}
                    >
                        Browse Rentals
                    </Link>
                </li>

                {user ? (
                    <>
                        {/* Saved Listings / Favorites Link */}
                        <li>
                            <Link
                                to="/favorites"
                                className={`nav-link nav-link--favorites ${location.pathname === '/favorites' ? 'nav-link--active' : ''}`}
                            >
                                <HeartNavIcon />
                                <span>Saved</span>
                                {favoriteIds.length > 0 && (
                                    <span className="nav-badge-pill">{favoriteIds.length}</span>
                                )}
                            </Link>
                        </li>

                        {/* Owner / Admin Dashboard */}
                        {isOwnerOrAdmin && (
                            <li>
                                <Link
                                    to="/admin"
                                    className={`nav-link ${location.pathname.startsWith('/admin') ? 'nav-link--active' : ''}`}
                                >
                                    {user.role === 'admin' ? 'Admin Portal' : 'Owner Dashboard'}
                                </Link>
                            </li>
                        )}

                        <li className="nav-user-item">
                            <span className="nav-user-name" title={user.email}>
                                {user.name}
                            </span>
                            <button onClick={logout} className="nav-btn">
                                Sign out
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link to="/favorites" className="nav-link">
                                <HeartNavIcon />
                                <span>Saved</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/login" className="nav-link">Sign in</Link>
                        </li>
                        <li>
                            <Link to="/register" className="nav-register-btn">Create account</Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;
