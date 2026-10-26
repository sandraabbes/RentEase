import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

/* ---- SVG Icons ---- */
const PlusIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const PencilIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
);

const InboxIcon = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 17.93 4H6.07a2 2 0 0 0-1.62.83z"/>
    </svg>
);

const HomeIcon = () => (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);

const LockIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available (Public)' },
    { value: 'draft', label: 'Draft (Private)' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'rented', label: 'Rented' },
    { value: 'archived', label: 'Archived' }
];

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [properties, setProperties] = useState([]);
    const [messages, setMessages] = useState([]);
    const [counts, setCounts] = useState({ total: 0, available: 0, draft: 0, reserved: 0, rented: 0, archived: 0 });
    const [activeTab, setActiveTab] = useState('properties');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deletingId, setDeletingId] = useState(null);
    const [deletingMsgId, setDeletingMsgId] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [notification, setNotification] = useState('');

    const fetchData = async () => {
        try {
            const [manageRes, msgRes] = await Promise.all([
                axios.get('http://localhost:5000/api/properties/manage'),
                axios.get('http://localhost:5000/api/messages')
            ]);
            setProperties(manageRes.data.properties || []);
            if (manageRes.data.counts) {
                setCounts(manageRes.data.counts);
            }
            setMessages(msgRes.data || []);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        }
    };

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'owner')) {
            fetchData();
        }
    }, [user]);

    const handleStatusChange = async (propertyId, newStatus) => {
        setUpdatingStatusId(propertyId);
        try {
            await axios.patch(`http://localhost:5000/api/properties/${propertyId}/status`, {
                status: newStatus
            });

            setProperties(prev => prev.map(p => {
                if (p._id === propertyId) {
                    return { ...p, status: newStatus };
                }
                return p;
            }));

            setNotification(`Status updated to "${newStatus}"`);
            setTimeout(() => setNotification(''), 3000);
            fetchData();
        } catch (err) {
            console.error('Failed to update status:', err);
            alert(err.response?.data?.msg || 'Failed to update status.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this property permanently? This action cannot be undone.')) return;
        setDeletingId(id);
        try {
            await axios.delete(`http://localhost:5000/api/properties/${id}`);
            setProperties(prev => prev.filter(p => p._id !== id));
            setNotification('Property successfully deleted.');
            setTimeout(() => setNotification(''), 3000);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to delete property.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm('Delete this inquiry message?')) return;
        setDeletingMsgId(msgId);
        try {
            await axios.delete(`http://localhost:5000/api/messages/${msgId}`);
            setMessages(prev => prev.filter(m => m._id !== msgId));
            setNotification('Message removed.');
            setTimeout(() => setNotification(''), 3000);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to delete message.');
        } finally {
            setDeletingMsgId(null);
        }
    };

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return (
            <div className="access-denied">
                <LockIcon />
                <h1 className="access-denied__title">Access denied</h1>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-3)' }}>
                    This dashboard is restricted to registered property owners and administrators.
                </p>
                <Link to="/" className="btn btn-outline" style={{ marginTop: 'var(--s3)' }}>
                    Return to home
                </Link>
            </div>
        );
    }

    const isSystemAdmin = user.role === 'admin';

    const filteredProperties = statusFilter === 'all'
        ? properties
        : properties.filter(p => (p.status || 'available') === statusFilter);

    const avgPrice = properties.length > 0
        ? Math.round(properties.reduce((s, p) => s + Number(p.price || 0), 0) / properties.length)
        : null;

    return (
        <div className="container">
            <div className="admin-page">
                {notification && (
                    <div className="admin-toast-banner" role="status">
                        ✓ {notification}
                    </div>
                )}

                {/* Top row */}
                <div className="admin-top">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h1 className="admin-page-title">
                                {isSystemAdmin ? 'System Administrator Portal' : 'Owner Dashboard'}
                            </h1>
                            <span className="card-tag card-tag--accent" style={{ textTransform: 'uppercase' }}>
                                {isSystemAdmin ? 'Admin Access' : 'Verified Owner'}
                            </span>
                        </div>
                        <p className="admin-page-sub">
                            {isSystemAdmin
                                ? 'Full administrative oversight: review all platform listings, owner accounts, and tenant inquiries.'
                                : 'Manage your personal rental inventory, update live listing statuses, and review tenant inquiries for your homes.'
                            }
                        </p>
                    </div>
                    <Link to="/admin/add-property" className="btn btn-primary">
                        <PlusIcon />
                        Add listing
                    </Link>
                </div>

                {/* Stat strip */}
                <div className="admin-stats">
                    <div className="admin-stat">
                        <span className="admin-stat__value">{properties.length}</span>
                        <span className="admin-stat__label">{isSystemAdmin ? 'Total platform listings' : 'Your listings'}</span>
                    </div>
                    <div className="admin-stat">
                        <span className="admin-stat__value" style={{ color: '#2d6a4f' }}>
                            {counts.available || properties.filter(p => !p.status || p.status === 'available').length}
                        </span>
                        <span className="admin-stat__label">Live & Available</span>
                    </div>
                    <div className="admin-stat">
                        <span className="admin-stat__value">{messages.length}</span>
                        <span className="admin-stat__label">{isSystemAdmin ? 'Total inquiries' : 'Inquiries for your listings'}</span>
                    </div>
                    {avgPrice !== null && (
                        <div className="admin-stat">
                            <span className="admin-stat__value">${avgPrice.toLocaleString()}</span>
                            <span className="admin-stat__label">Average rent / mo</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="admin-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'properties'}
                        className={`admin-tab${activeTab === 'properties' ? ' admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('properties')}
                    >
                        {isSystemAdmin ? 'All Listings' : 'My Listings'} ({properties.length})
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'messages'}
                        className={`admin-tab${activeTab === 'messages' ? ' admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        {isSystemAdmin ? 'All Messages' : 'Inquiries'} ({messages.length})
                    </button>
                </div>

                {/* --- Properties tab --- */}
                {activeTab === 'properties' && (
                    <>
                        {/* Status filter bar */}
                        <div className="admin-status-filter-strip">
                            <span className="status-filter-label">Filter by status:</span>
                            {['all', 'available', 'draft', 'reserved', 'rented', 'archived'].map((st) => (
                                <button
                                    type="button"
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`status-filter-pill ${statusFilter === st ? 'status-filter-pill--active' : ''}`}
                                >
                                    {st.charAt(0).toUpperCase() + st.slice(1)}
                                    {st !== 'all' && (
                                        <span className="status-count-badge">
                                            {properties.filter(p => (p.status || 'available') === st).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {filteredProperties.length === 0 ? (
                            <div className="admin-empty">
                                <HomeIcon className="admin-empty__icon" />
                                <p className="admin-empty__text">
                                    {statusFilter === 'all'
                                        ? isSystemAdmin
                                            ? 'No properties found on the platform.'
                                            : 'You have not added any listings yet. Tap "Add listing" to publish your first property.'
                                        : `No listings with status "${statusFilter}".`}
                                </p>
                            </div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table" aria-label="Property listings">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Property</th>
                                            {isSystemAdmin && <th>Owner</th>}
                                            <th>Type</th>
                                            <th>City</th>
                                            <th>Rent / mo</th>
                                            <th>Status (Change Live)</th>
                                            <th><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProperties.map((property, idx) => (
                                            <tr
                                                key={property._id}
                                                className={deletingId === property._id ? 'admin-row--deleting' : ''}
                                            >
                                                <td className="td-num">{idx + 1}</td>
                                                <td className="td-title">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {property.images && property.images[0] ? (
                                                            <img
                                                                src={property.images[0]}
                                                                alt=""
                                                                style={{ width: '42px', height: '42px', borderRadius: '4px', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div style={{ width: '42px', height: '42px', background: 'var(--bg-subtle)', borderRadius: '4px' }} />
                                                        )}
                                                        <div>
                                                            <Link to={`/properties/${property._id}`} style={{ fontWeight: 600, color: 'var(--ink-1)' }}>
                                                                {property.title}
                                                            </Link>
                                                            {property.address && (
                                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-3)' }}>
                                                                    {property.address}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Admin-only owner column */}
                                                {isSystemAdmin && (
                                                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-2)' }}>
                                                        <strong>{property.owner?.name || property.ownerDetails?.name || 'Admin'}</strong>
                                                        <div style={{ color: 'var(--ink-3)' }}>
                                                            {property.owner?.email || property.ownerDetails?.email || ''}
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="td-type" style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-3)' }}>
                                                    {property.propertyType || 'Apartment'}
                                                </td>
                                                <td className="td-city">{property.city || '—'}</td>
                                                <td className="td-price">
                                                    ${Number(property.price).toLocaleString()}
                                                </td>
                                                <td className="td-status">
                                                    {/* Status Selector */}
                                                    <select
                                                        value={property.status || 'available'}
                                                        onChange={(e) => handleStatusChange(property._id, e.target.value)}
                                                        disabled={updatingStatusId === property._id}
                                                        className={`admin-status-select status-select--${property.status || 'available'}`}
                                                        aria-label="Change listing status"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <div className="td-actions">
                                                        <Link
                                                            to={`/admin/edit-property/${property._id}`}
                                                            className="action-btn action-btn--edit"
                                                            aria-label={`Edit ${property.title}`}
                                                        >
                                                            <PencilIcon />
                                                            Edit
                                                        </Link>
                                                        <button
                                                            className="action-btn action-btn--delete"
                                                            onClick={() => handleDelete(property._id)}
                                                            disabled={deletingId === property._id}
                                                            aria-label={`Delete ${property.title}`}
                                                        >
                                                            <TrashIcon />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* --- Messages tab --- */}
                {activeTab === 'messages' && (
                    messages.length === 0 ? (
                        <div className="admin-empty">
                            <InboxIcon className="admin-empty__icon" />
                            <p className="admin-empty__text">
                                {isSystemAdmin
                                    ? 'No inquiries recorded in the system yet.'
                                    : 'No tenant inquiries received for your listings yet.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="admin-messages">
                            {messages.map((msg) => (
                                <div key={msg._id} className="msg-card">
                                    <div className="msg-avatar" aria-hidden="true">
                                        {(msg.userEmail || 'U')[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="msg-header">
                                            <span className="msg-email">{msg.userEmail}</span>
                                            <span className="msg-re">
                                                re: {msg.propertyId ? msg.propertyId.title : 'Listing'}
                                            </span>
                                        </div>
                                        <p className="msg-body">{msg.message}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--s2)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                                                {new Date(msg.date).toLocaleDateString()} at {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMessage(msg._id)}
                                                disabled={deletingMsgId === msg._id}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--err)', fontSize: '12px', padding: '2px 8px' }}
                                            >
                                                Delete inquiry
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

            </div>
        </div>
    );
};

export default AdminDashboard;
