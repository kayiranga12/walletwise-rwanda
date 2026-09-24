import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import AuthShell from './AuthShell';
import { authErrorKey } from '../../lib/authErrors';

const Signup = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, { displayName: username.trim() });
                // The auth listener fired before the name was set; refresh it
                const { user, setUser } = useStore.getState();
                if (user) setUser({ ...user, user_metadata: { ...user.user_metadata, username: username.trim() } });
                navigate('/');
            }
        } catch (err) {
            setError(t(authErrorKey(err.code)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title={t('auth.join')}>
            {error && <div className="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 p-3 rounded-xl mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="label" htmlFor="signup-name">{t('auth.username')}</label>
                    <input id="signup-name" type="text" required maxLength={40} autoComplete="name" value={username}
                        onChange={(e) => setUsername(e.target.value)} className="input" />
                </div>
                <div>
                    <label className="label" htmlFor="signup-email">{t('auth.email')}</label>
                    <input id="signup-email" type="email" required autoComplete="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
                <div>
                    <label className="label" htmlFor="signup-password">{t('auth.password')}</label>
                    <input id="signup-password" type="password" required minLength={6} autoComplete="new-password" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="input" />
                    <p className="text-xs muted mt-1">{t('auth.passwordHint')}</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? t('auth.signingUp') : t('auth.signup')}
                </button>
            </form>
            <p className="mt-5 text-center text-sm muted">
                {t('auth.haveAccount')} <Link to="/login" className="text-primary font-semibold">{t('auth.login')}</Link>
            </p>
        </AuthShell>
    );
};

export default Signup;
