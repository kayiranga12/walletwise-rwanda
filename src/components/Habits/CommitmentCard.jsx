import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Pencil, Plus, TrendingUp, TrendingDown, ClipboardCheck } from 'lucide-react';
import useStore from '../../store/useStore';
import { setCommitment } from '../../lib/settings';
import { COMMITMENT_TYPES } from '../../lib/discipline';
import { EXPENSE_CATEGORIES } from '../../lib/categories';
import { formatMoney, formatMonth, formatPercent } from '../../lib/format';
import Modal from '../ui/Modal';
import { ProgressBar } from '../ui/bits';

const STATUS_STYLE = {
    on_track: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10',
    kept: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10',
    at_risk: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10',
    broken: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-500/10',
    missed: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-500/10',
};

const describe = (t, c) => {
    const amount = c.type === 'no_spend_days' ? c.amount : formatMoney(c.amount);
    return t(`commitment.types.${c.type}`, { amount, category: t(`categories.${c.category || 'other'}`) });
};

const CommitmentEditor = ({ month, current, onClose }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const [form, setForm] = useState({
        type: current?.type || 'category_cap',
        category: current?.category || 'eating_out',
        amount: current ? String(current.amount) : '',
    });

    const save = async (e) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!(amount > 0)) return;
        await setCommitment(user.id, month, { type: form.type, amount, ...(form.type === 'category_cap' ? { category: form.category } : {}) });
        toast(t('commitment.saved'));
        onClose();
    };

    const remove = async () => {
        await setCommitment(user.id, month, null);
        onClose();
    };

    return (
        <Modal open onClose={onClose} title={t('commitment.editorTitle', { month: formatMonth(month) })} size="sm">
            <form onSubmit={save} className="space-y-4">
                <p className="text-sm muted">{t('commitment.editorHint')}</p>
                <div className="space-y-2">
                    {COMMITMENT_TYPES.map(type => (
                        <label key={type} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer text-sm ${form.type === type ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                            <input type="radio" name="ctype" checked={form.type === type} onChange={() => setForm(f => ({ ...f, type }))} className="accent-primary" />
                            {t(`commitment.labels.${type}`)}
                        </label>
                    ))}
                </div>
                {form.type === 'category_cap' && (
                    <div>
                        <label className="label" htmlFor="c-cat">{t('common.category')}</label>
                        <select id="c-cat" className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                            {EXPENSE_CATEGORIES.filter(c => c.bucket !== 'Savings').map(c => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label className="label" htmlFor="c-amount">{t(form.type === 'no_spend_days' ? 'commitment.days' : 'common.amount')}</label>
                    <input id="c-amount" type="number" inputMode="numeric" min="1" required className="input font-semibold"
                        value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="flex gap-3">
                    {current && <button type="button" className="btn-ghost text-red-500" onClick={remove}>{t('common.delete')}</button>}
                    <button type="button" className="btn-secondary flex-1" onClick={onClose}>{t('common.cancel')}</button>
                    <button type="submit" className="btn-primary flex-1">{t('common.save')}</button>
                </div>
            </form>
        </Modal>
    );
};

export const CommitmentCard = ({ month, commitment, result }) => {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);

    return (
        <div className="card-pad">
            <div className="flex items-center justify-between gap-3 mb-1">
                <h2 className="section-title flex items-center gap-2"><Crosshair className="w-5 h-5 text-primary" /> {t('commitment.title')}</h2>
                <button className="btn-ghost py-1.5" onClick={() => setEditing(true)} aria-label={t('common.edit')}>
                    {commitment ? <Pencil className="w-4 h-4" /> : <><Plus className="w-4 h-4" /> {t('commitment.set')}</>}
                </button>
            </div>
            <p className="text-sm muted mb-4">{t('commitment.subtitle', { month: formatMonth(month) })}</p>
            {commitment && result ? (
                <div>
                    <p className="font-semibold">{describe(t, commitment)}</p>
                    <div className="flex items-center justify-between text-sm mt-3 mb-1.5">
                        <span className="muted">
                            {commitment.type === 'no_spend_days'
                                ? t('commitment.progressDays', { current: result.current, target: result.target })
                                : t('commitment.progressAmount', { current: formatMoney(result.current), target: formatMoney(result.target) })}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[result.status]}`}>{t(`commitment.status.${result.status}`)}</span>
                    </div>
                    <ProgressBar value={result.progress}
                        color={['broken', 'missed'].includes(result.status) ? '#ef4444' : result.status === 'at_risk' ? '#f59e0b' : '#10b981'} />
                </div>
            ) : (
                <button onClick={() => setEditing(true)} className="w-full rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-6 text-sm muted hover:border-primary hover:text-primary transition">
                    {t('commitment.empty')}
                </button>
            )}
            {editing && <CommitmentEditor month={month} current={commitment} onClose={() => setEditing(false)} />}
        </div>
    );
};

export const ReviewCard = ({ review, lastCommitment, lastResult }) => {
    const { t } = useTranslation();
    if (!review) return null;
    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-1"><ClipboardCheck className="w-5 h-5 text-sky-500" /> {t('review.title', { month: formatMonth(review.month) })}</h2>
            <p className="text-sm muted mb-4">{t('review.subtitle')}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                    <p className="text-xs muted">{t('review.score')}</p>
                    <p className="text-lg font-bold">{review.score}</p>
                    {review.scoreChange !== null && (
                        <p className={`text-xs font-semibold ${review.scoreChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {review.scoreChange >= 0 ? '+' : ''}{review.scoreChange}
                        </p>
                    )}
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                    <p className="text-xs muted">{t('reports.savingsRate')}</p>
                    <p className="text-lg font-bold">{formatPercent(review.savingsRate)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                    <p className="text-xs muted">{t('dashboard.spent')}</p>
                    <p className="text-sm sm:text-base font-bold">{formatMoney(review.spent)}</p>
                </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
                {review.improved.map(d => (
                    <p key={`i-${d.category}`} className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                        <TrendingDown className="w-4 h-4" /> {t('review.spentLess', { category: t(`categories.${d.category}`), amount: formatMoney(-d.change) })}
                    </p>
                ))}
                {review.worsened.map(d => (
                    <p key={`w-${d.category}`} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <TrendingUp className="w-4 h-4" /> {t('review.spentMore', { category: t(`categories.${d.category}`), amount: formatMoney(d.change) })}
                    </p>
                ))}
                {lastCommitment && lastResult && (
                    <p className={`font-medium ${lastResult.status === 'kept' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t(lastResult.status === 'kept' ? 'review.commitmentKept' : 'review.commitmentMissed', { commitment: describe(t, lastCommitment) })}
                    </p>
                )}
            </div>
        </div>
    );
};
