import React, { useState, useMemo } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, ArrowLeftRight, Target, PieChart, Scale, Repeat, FileText, Settings,
    LogOut, Plus, Bell, Ellipsis, Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import useStore from '../../store/useStore';
import { fullSync } from '../../lib/sync';
import { useUserTable, useSettings } from '../../lib/hooks';
import { buildInsights } from '../../lib/insights';
import { monthKey } from '../../lib/format';
import EntrySheet from '../Money/EntrySheet';
import Celebration from '../Goals/Celebration';
import { InsightItem } from '../ui/bits';

const NAV = [
    { to: '/', icon: LayoutDashboard, key: 'nav.home', end: true },
    { to: '/money', icon: ArrowLeftRight, key: 'nav.money' },
    { to: '/budget', icon: PieChart, key: 'nav.budget' },
    { to: '/goals', icon: Target, key: 'nav.goals' },
    { to: '/net-worth', icon: Scale, key: 'nav.netWorth' },
    { to: '/recurring', icon: Repeat, key: 'nav.recurring' },
    { to: '/reports', icon: FileText, key: 'nav.reports' },
    { to: '/profile', icon: Settings, key: 'nav.settings' },
];

const SyncStatus = ({ compact = false }) => {
    const { t } = useTranslation();
    const sync = useStore(s => s.sync);
    const uid = useStore(s => s.user?.id);

    let Icon = Cloud, text = t('sync.synced'), cls = 'text-emerald-600 dark:text-emerald-400';
    if (!sync.online) { Icon = CloudOff; text = t('sync.offline'); cls = 'text-gray-400'; }
    else if (sync.syncing) { Icon = RefreshCw; text = t('sync.syncing'); cls = 'text-sky-500'; }
    else if (sync.error) { Icon = CloudOff; text = t('sync.error'); cls = 'text-amber-500'; }
    else if (sync.pending > 0) { Icon = RefreshCw; text = t('sync.pending', { count: sync.pending }); cls = 'text-amber-500'; }

    return (
        <button
            onClick={() => uid && fullSync(uid)}
            className={`flex items-center gap-2 text-xs ${cls} ${compact ? 'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800' : 'w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            title={`${text} – ${t('sync.syncNow')}`}
        >
            <Icon className={`w-4 h-4 shrink-0 ${sync.syncing ? 'animate-spin' : ''}`} />
            {!compact && <span className="text-left leading-tight">{text}</span>}
        </button>
    );
};

const AlertsBell = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const goalTransactions = useUserTable('transactions');
    const { split } = useSettings();

    const alerts = useMemo(() => {
        if (!incomes || !expenses) return [];
        return buildInsights({ month: monthKey(), incomes, expenses, goals: goals || [], goalTransactions: goalTransactions || [], split })
            .filter(i => i.level === 'danger' || i.level === 'warning');
    }, [incomes, expenses, goals, goalTransactions, split]);

    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" aria-label={t('insights.alerts')}>
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                    <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {alerts.length}
                    </span>
                )}
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card p-3 shadow-xl z-50 space-y-2 animate-fade-in-up">
                        <p className="text-sm font-semibold px-1">{t('insights.alerts')}</p>
                        {alerts.length === 0
                            ? <p className="muted text-sm px-1 py-2">{t('insights.noAlerts')}</p>
                            : alerts.map(a => <InsightItem key={a.id} insight={a} />)}
                    </div>
                </>
            )}
        </div>
    );
};

const Logo = () => (
    <Link to="/" className="flex items-center gap-2">
        <img src="/icon.svg" alt="" className="w-8 h-8" />
        <span className="text-xl font-extrabold text-primary tracking-tight">WalletWise</span>
    </Link>
);

const AppLayout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useStore(s => s.user);
    const logout = useStore(s => s.logout);
    const openQuickAdd = useStore(s => s.openQuickAdd);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initial = (user?.user_metadata?.username || user?.email || '?').charAt(0).toUpperCase();

    const sideLink = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`;

    const bottomLink = ({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`;

    return (
        <div className="min-h-screen lg:pl-64">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-5 no-print">
                <div className="px-2 mb-6"><Logo /></div>
                <button onClick={() => openQuickAdd('expense')} className="btn-primary w-full mb-5">
                    <Plus className="w-4 h-4" /> {t('nav.add')}
                </button>
                <nav className="flex-1 space-y-1">
                    {NAV.map(({ to, icon: Icon, key, end }) => (
                        <NavLink key={to} to={to} end={end} className={sideLink}>
                            <Icon className="w-5 h-5" /> {t(key)}
                        </NavLink>
                    ))}
                </nav>
                <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <SyncStatus />
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center">{initial}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.user_metadata?.username}</p>
                            <p className="text-xs muted truncate">{user?.email}</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" title={t('profile.logout')}>
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-white/85 dark:bg-gray-950/85 backdrop-blur border-b border-gray-100 dark:border-gray-800 no-print">
                <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
                    <div className="lg:hidden"><Logo /></div>
                    <div className="hidden lg:block" />
                    <div className="flex items-center gap-1">
                        <div className="lg:hidden"><SyncStatus compact /></div>
                        <AlertsBell />
                        <Link to="/profile" className="lg:hidden ml-1 w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">{initial}</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-10 print-area">
                <Outlet />
            </main>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="grid grid-cols-5 items-end max-w-md mx-auto">
                    <NavLink to="/" end className={bottomLink}><LayoutDashboard className="w-5 h-5" />{t('nav.home')}</NavLink>
                    <NavLink to="/money" className={bottomLink}><ArrowLeftRight className="w-5 h-5" />{t('nav.money')}</NavLink>
                    <div className="flex justify-center">
                        <button onClick={() => openQuickAdd('expense')} className="-mt-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-95 transition" aria-label={t('nav.add')}>
                            <Plus className="w-7 h-7" />
                        </button>
                    </div>
                    <NavLink to="/goals" className={bottomLink}><Target className="w-5 h-5" />{t('nav.goals')}</NavLink>
                    <NavLink to="/more" className={bottomLink}><Ellipsis className="w-5 h-5" />{t('nav.more')}</NavLink>
                </div>
            </nav>

            <EntrySheet />
            <Celebration />
        </div>
    );
};


export default AppLayout;
