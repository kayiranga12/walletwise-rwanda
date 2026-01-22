import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import LanguageToggle from './LanguageToggle';

const ProfileSettings = () => {
    const { user, setUser } = useStore();
    const { t } = useTranslation();
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
            const { data, error } = await supabase.auth.updateUser({
                data: { username },
            });

            if (error) throw error;
            if (data.user) {
                setUser(data.user);
                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.settings')}</h1>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">{t('profile.language')}</h2>
                <LanguageToggle />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : t('common.save')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;
