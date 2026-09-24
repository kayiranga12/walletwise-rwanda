import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateProfile } from 'firebase/auth';
import { Sun, Moon, Monitor, Download, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { auth } from '../../lib/firebase';
import { db } from '../../lib/db';
import { COLLECTIONS } from '../../lib/sync';
import { downloadFile } from '../../lib/csv';
import { formatDate, todayISO } from '../../lib/format';
import LanguageToggle from './LanguageToggle';
import { PageHeader } from '../ui/bits';

const ProfileSettings = () => {
    const { user, setUser, toast, theme, setTheme, sync, logout } = useStore();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.user_metadata?.username) {
            setUsername(user.user_metadata.username);
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: username.trim() });
                setUser({ ...user, user_metadata: { ...user.user_metadata, username: username.trim() } });
                toast(t('profile.updated'));
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast(t('common.somethingWrong'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadBackup = async () => {
        const backup = { app: 'WalletWise Rwanda', exported_at: new Date().toISOString(), user: { id: user.id, email: user.email } };
        for (const table of Object.keys(COLLECTIONS)) {
            backup[table] = await db[table].where('user_id').equals(user.id).toArray();
        }
        downloadFile(`walletwise-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const themes = [
        { id: 'light', icon: Sun },
        { id: 'dark', icon: Moon },
        { id: 'system', icon: Monitor },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <PageHeader title={t('profile.settings')} />

            <div className="card-pad">
                <h2 className="section-title mb-4">{t('profile.editProfile')}</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="label" htmlFor="profile-name">{t('profile.username')}</label>
                        <input id="profile-name" type="text" value={username} maxLength={40} onChange={(e) => setUsername(e.target.value)} className="input" />
                        <p className="text-xs muted mt-1.5">{user?.email}</p>
                    </div>
                    <button type="submit" disabled={loading || !username.trim()} className="btn-primary">
                        {loading ? t('common.loading') : t('common.save')}
                    </button>
                </form>
            </div>

            <div className="card-pad">
                <h2 className="section-title mb-4">{t('profile.language')}</h2>
                <LanguageToggle />
            </div>

            <div className="card-pad">
                <h2 className="section-title mb-4">{t('profile.appearance')}</h2>
                <div className="grid grid-cols-3 gap-2">
                    {themes.map(({ id, icon: Icon }) => (
                        <button key={id} onClick={() => setTheme(id)}
                            className={`flex flex-col items-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition ${theme === id ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                            <Icon className="w-5 h-5" /> {t(`profile.${id}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card-pad">
                <h2 className="section-title mb-1">{t('profile.data')}</h2>
                <p className="muted text-sm mb-4">{t('profile.dataHint')}</p>
                <button onClick={downloadBackup} className="btn-secondary"><Download className="w-4 h-4" /> {t('profile.backup')}</button>
                <p className="text-xs muted mt-4">
                    {t('profile.cloudSync')}: {sync.pending > 0 ? t('sync.pending', { count: sync.pending }) : t('sync.synced')}
                    {sync.lastSyncedAt && ` · ${formatDate(sync.lastSyncedAt)} ${sync.lastSyncedAt.slice(11, 16)} UTC`}
                </p>
            </div>

            <button onClick={handleLogout} className="btn-ghost w-full text-red-500 lg:hidden">
                <LogOut className="w-4 h-4" /> {t('profile.logout')}
            </button>
        </div>
    );
};

export default ProfileSettings;
