import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { name, email, password, role } = formData;
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password, role);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Registration failed. This email may already be in use.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Left panel */}
            <div className="auth-panel" aria-hidden="true">
                <p className="auth-panel-title">
                    List your property.<br />
                    <em>Reach tenants</em><br />
                    without fees.
                </p>
                <p className="auth-panel-sub">
                    Create an account in under a minute.
                    Owners can list, edit, and manage properties from a dedicated dashboard.
                </p>
            </div>

            {/* Right form */}
            <div className="auth-form-side">
                <div className="auth-form-box">
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-subtitle">You'll be browsing listings in seconds.</p>

                    {error && (
                        <p role="alert" style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--err)',
                            background: 'var(--err-bg)',
                            padding: '0.6rem 0.875rem',
                            borderRadius: 'var(--r-md)',
                            marginBottom: 'var(--s4)'
                        }}>
                            {error}
                        </p>
                    )}

                    <form onSubmit={onSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-name">Full name</label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                value={name}
                                onChange={onChange}
                                placeholder="Your name"
                                required
                                autoComplete="name"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-email">Email address</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">Password</label>
                            <input
                                id="reg-password"
                                type="password"
                                name="password"
                                value={password}
                                onChange={onChange}
                                placeholder="Min. 8 characters"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-role">Account type</label>
                            <select id="reg-role" name="role" value={role} onChange={onChange}>
                                <option value="user">Tenant — browse, save, and contact owners</option>
                                <option value="owner">Property Owner / Landlord — list and manage properties</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            style={{ padding: '0.7rem', marginTop: 'var(--s2)' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>

                    <p className="auth-link">
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
