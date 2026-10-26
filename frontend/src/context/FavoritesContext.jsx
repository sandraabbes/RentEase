import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [savedProperties, setSavedProperties] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch favorite IDs when user changes
    const fetchFavoriteIds = useCallback(async () => {
        if (!user) {
            setFavoriteIds([]);
            setSavedProperties([]);
            return;
        }
        try {
            const res = await axios.get('http://localhost:5000/api/properties/favorites/ids');
            setFavoriteIds((res.data || []).map(id => (typeof id === 'object' ? id._id || id.toString() : id.toString())));
        } catch (err) {
            console.error('Error fetching favorite IDs:', err);
        }
    }, [user]);

    // Fetch full saved properties
    const fetchFavorites = useCallback(async () => {
        if (!user) {
            setSavedProperties([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/properties/favorites');
            setSavedProperties(res.data || []);
            setFavoriteIds((res.data || []).map(p => p._id.toString()));
        } catch (err) {
            console.error('Error fetching favorites:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchFavoriteIds();
    }, [fetchFavoriteIds]);

    const isFavorite = (id) => {
        if (!id) return false;
        const idStr = id.toString();
        return favoriteIds.includes(idStr);
    };

    const toggleFavorite = async (property) => {
        if (!user) {
            return { error: 'login_required' };
        }
        const propId = property._id || property;
        const propIdStr = propId.toString();
        const currentlyFav = favoriteIds.includes(propIdStr);

        // Optimistic update
        if (currentlyFav) {
            setFavoriteIds(prev => prev.filter(id => id !== propIdStr));
            setSavedProperties(prev => prev.filter(p => (p._id || p).toString() !== propIdStr));
        } else {
            setFavoriteIds(prev => [...prev, propIdStr]);
            if (typeof property === 'object') {
                setSavedProperties(prev => [property, ...prev]);
            }
        }

        try {
            const res = await axios.post(`http://localhost:5000/api/properties/${propIdStr}/favorite`);
            if (res.data && res.data.favorites) {
                setFavoriteIds(res.data.favorites.map(id => id.toString()));
            }
            return { favorited: !currentlyFav };
        } catch (err) {
            console.error('Error toggling favorite:', err);
            // Rollback on error
            fetchFavoriteIds();
            return { error: err.message };
        }
    };

    return (
        <FavoritesContext.Provider value={{
            favoriteIds,
            savedProperties,
            loading,
            isFavorite,
            toggleFavorite,
            fetchFavorites,
            fetchFavoriteIds
        }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export default FavoritesContext;
