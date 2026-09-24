import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PieChart, Scale, Repeat, FileText, Settings, LogOut, ChevronRight } from 'lucide-react';
import useStore from '../../store/useStore';
import { PageHeader } from '../ui/bits';

const LINKS = [
    { to: '/budget', icon: PieChart, key: 'nav.budget', color: '#6366f1' },
    { to: '/net-worth', icon: Scale, key: 'nav.netWorth', color: '#10b981' },
    { to: '/recurring', icon: Repeat, key: 'nav.recurring', color: '#f59e0b' },
    { to: '/reports', icon: FileText, key: 'nav.reports', color: '#0ea5e9' },
    { to: '/profile', icon: Settings, key: 'nav.settings', color: '#6b7280' },
];

// The mobile "More" tab: everything that doesn't fit in the bottom bar
const MorePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const logout = useStore(s => s.logout);

    return (
        <div className="max-w-lg mx-auto animate-fade-in-up">
            <PageHeader title={t('nav.more')} />
            <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {LINKS.map(({ to, icon: Icon, key, color }) => (
                    <Link key={to} to={to} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}1f`, color }}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1 font-medium">{t(key)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                ))}
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }} className="btn-ghost w-full mt-6 text-red-500">
                <LogOut className="w-4 h-4" /> {t('profile.logout')}
            </button>
        </div>
    );
};

export default MorePage;
