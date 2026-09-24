import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import { authErrorKey } from '../../lib/authErrors';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setNotice(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                navigate('/');
            }
        } catch (err) {
            setError(t(authErrorKey(err.code)));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setError(null);
        setNotice(null);
        if (!email) {
            setError(t('auth.enterEmailFirst'));
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            setNotice(t('auth.resetSent'));
        } catch (err) {
            setError(t(authErrorKey(err.code)));
        }
    };

    return (
        <AuthShell title={t('auth.welcomeBack')}>
            {error && <div className="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300 p-3 rounded-xl mb-4 text-sm">{error}</div>}
            {notice && <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 p-3 rounded-xl mb-4 text-sm">{notice}</div>}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="label" htmlFor="login-email">{t('auth.email')}</label>
                    <input id="login-email" type="email" required autoComplete="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
                <div>
                    <div className="flex justify-between items-center">
                        <label className="label" htmlFor="login-password">{t('auth.password')}</label>
                        <button type="button" onClick={handleReset} className="text-xs text-primary font-medium mb-1.5">{t('auth.forgot')}</button>
                    </div>
                    <input id="login-password" type="password" required autoComplete="current-password" value={password}
                        onChange={(e) => setPassword(e.target.value)} className="input" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? t('auth.loggingIn') : t('auth.login')}
                </button>
            </form>
            <p className="mt-5 text-center text-sm muted">
                {t('auth.noAccount')} <Link to="/signup" className="text-primary font-semibold">{t('auth.signup')}</Link>
            </p>
        </AuthShell>
    );
};

export default Login;
