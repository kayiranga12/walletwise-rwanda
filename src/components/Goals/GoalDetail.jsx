import React, { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2, Plus, Minus, Pencil, CalendarClock, TrendingUp, X } from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { db } from '../../lib/db';
import { addGoalTransaction, deleteGoalTransaction, deleteGoal, goalProgress, forecastGoal } from '../../lib/goals';
import { getPet, getGoalColor } from '../../lib/categories';
import { formatMoney, formatDate, todayISO } from '../../lib/format';
import useStore from '../../store/useStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Spinner, EmptyState } from '../ui/bits';

const ProgressRing = ({ value, color, children }) => {
    const r = 70, c = 2 * Math.PI * r;
    return (
        <div className="relative w-44 h-44">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r={r} fill="none" strokeWidth="12" className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="80" cy="80" r={r} fill="none" strokeWidth="12" stroke={color} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c * (1 - value)} className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
        </div>
    );
};

const GoalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast, celebrate } = useStore();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [countInBudget, setCountInBudget] = useState(true);
    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(null); // 'goal' | transaction

    const goal = useLiveQuery(() => db.goals.get(id), [id]);
    const transactions = useLiveQuery(
        () => db.transactions.where('goal_id').equals(id).toArray()
            .then(rows => rows.sort((a, b) => (b.transaction_date || b.created_at).localeCompare(a.transaction_date || a.created_at))),
        [id]
    );

    if (goal === undefined || transactions === undefined) return <Spinner />;
    if (!goal) return <Navigate to="/goals" replace />;

    const progress = goalProgress(goal);
    const color = getGoalColor(goal.color_theme).hex;
    const forecast = forecastGoal(goal, transactions);
    const daysLeft = goal.deadline ? differenceInCalendarDays(parseISO(goal.deadline), new Date()) : null;

    const handleTransaction = async (type) => {
        const value = parseFloat(amount);
        if (!value || value <= 0) return;
        setBusy(true);
        try {
            const milestone = await addGoalTransaction(goal, {
                type, amount: value, note, date: todayISO(), countInBudget: type === 'deposit' && countInBudget,
            });
            setAmount('');
            setNote('');
            toast(t('common.saved'));
            if (milestone) celebrate(goal, milestone);
        } catch (err) {
            toast(err.message === 'insufficient' ? t('goals.insufficient') : t('common.somethingWrong'), 'error');
        } finally {
            setBusy(false);
        }
    };

    const handleConfirm = async () => {
        if (confirm === 'goal') {
            await deleteGoal(goal);
            toast(t('common.deleted'));
            navigate('/goals');
        } else {
            await deleteGoalTransaction(goal, confirm);
            toast(t('common.deleted'));
        }
        setConfirm(null);
    };

    let forecastText;
    if (forecast.status === 'done') forecastText = t('goals.forecastDone');
    else if (forecast.status === 'no_data') forecastText = t('goals.forecastNoData');
    else forecastText = t(forecast.status === 'on_track' ? 'goals.forecastOnTrack' : 'goals.forecastBehind', { date: formatDate(forecast.eta) });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/goals')} className="btn-ghost -ml-3"><ArrowLeft className="w-4 h-4" /> {t('goals.title')}</button>
                <div className="flex gap-1">
                    <Link to={`/goals/${goal.id}/edit`} className="btn-ghost" aria-label={t('common.edit')}><Pencil className="w-4 h-4" /></Link>
                    <button onClick={() => setConfirm('goal')} className="btn-ghost text-red-500" aria-label={t('common.delete')}><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="h-2" style={{ backgroundColor: color }} />
                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                    <ProgressRing value={progress} color={color}>
                        <span className="text-5xl animate-bounce-short">{getPet(goal.pet_avatar).icon}</span>
                        <span className="text-lg font-bold mt-1">{Math.round(progress * 100)}%</span>
                    </ProgressRing>
                    <div className="flex-1 w-full text-center md:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{goal.name}</h1>
                        <p className="text-2xl font-semibold mt-3">{formatMoney(goal.current_amount)}</p>
                        <p className="muted">{t('goals.target', { amount: formatMoney(goal.target_amount) })}</p>
                        {goal.deadline && (
                            <p className={`text-sm mt-2 inline-flex items-center gap-1.5 ${daysLeft < 0 && !goal.is_completed ? 'text-red-500' : 'muted'}`}>
                                <CalendarClock className="w-4 h-4" />
                                {formatDate(goal.deadline)}
                                {!goal.is_completed && ` · ${daysLeft < 0 ? t('goals.overdue') : t('goals.daysLeft', { count: daysLeft })}`}
                            </p>
                        )}
                        <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 text-sm space-y-1 text-left">
                            <p className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> {t('goals.forecast')}</p>
                            <p className={forecast.status === 'behind' ? 'text-amber-600 dark:text-amber-400' : ''}>{forecastText}</p>
                            {forecast.ratePerMonth > 0 && <p className="muted">{t('goals.savingRate', { amount: formatMoney(forecast.ratePerMonth) })}</p>}
                            {forecast.perMonthNeeded > 0 && <p className="muted">{t('goals.needPerMonth', { amount: formatMoney(forecast.perMonthNeeded) })}</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-pad">
                <h3 className="section-title mb-4">{t('goals.addTransaction')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="number" inputMode="numeric" min="1" placeholder={t('common.amount')} value={amount}
                        onChange={(e) => setAmount(e.target.value)} className="input" aria-label={t('common.amount')} />
                    <input type="text" placeholder={t('common.notePlaceholder')} value={note} maxLength={100}
                        onChange={(e) => setNote(e.target.value)} className="input" aria-label={t('common.note')} />
                </div>
                <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
                    <input type="checkbox" checked={countInBudget} onChange={e => setCountInBudget(e.target.checked)} className="w-4 h-4 accent-primary" />
                    {t('goals.countInBudget')}
                </label>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => handleTransaction('deposit')} disabled={busy} className="btn flex-1 bg-emerald-500 text-white hover:bg-emerald-600">
                        <Plus className="w-4 h-4" /> {t('common.deposit')}
                    </button>
                    <button onClick={() => handleTransaction('withdrawal')} disabled={busy} className="btn flex-1 bg-rose-500 text-white hover:bg-rose-600">
                        <Minus className="w-4 h-4" /> {t('common.withdraw')}
                    </button>
                </div>
            </div>

            <div className="card overflow-hidden">
                <h3 className="section-title px-5 pt-5 pb-3">{t('goals.history')}</h3>
                {transactions.length === 0
                    ? <EmptyState text={t('goals.noTransactions')} />
                    : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {transactions.map(tx => (
                                <li key={tx.id} className="flex items-center gap-3 px-5 py-3 group">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15'}`}>
                                        {tx.type === 'deposit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{tx.note || t(tx.type === 'deposit' ? 'common.deposit' : 'common.withdraw')}</p>
                                        <p className="text-xs muted">{formatDate(tx.transaction_date || tx.created_at)}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.type === 'deposit' ? '+' : '−'}{formatMoney(tx.amount)}
                                    </span>
                                    <button onClick={() => setConfirm(tx)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label={t('common.delete')}>
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
            </div>

            <ConfirmDialog
                open={!!confirm}
                message={confirm === 'goal' ? t('goals.deleteConfirm') : t('goals.deleteTxConfirm')}
                onConfirm={handleConfirm}
                onCancel={() => setConfirm(null)}
            />
        </div>
    );
};

export default GoalDetail;
