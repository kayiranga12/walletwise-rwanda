import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Trash2, Target, Hourglass, Briefcase, TriangleAlert } from 'lucide-react';
import { deservesPause, purchaseImpact, WAIT_HOURS } from '../../lib/discipline';
import { addToWishlist } from '../../lib/settings';
import { formatMoney } from '../../lib/format';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import useStore from '../../store/useStore';
import { createRecord, updateRecord, deleteRecord } from '../../lib/repo';
import { useUserTable, useSettings } from '../../lib/hooks';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SOURCES, BUCKETS, getExpenseCategory } from '../../lib/categories';
import { todayISO, entryDay } from '../../lib/format';
import { summarizeMonth, budgetCrossing, limitCrossing } from '../../lib/insights';
import { updateGoalDepositExpense, deleteGoalDepositExpense } from '../../lib/goals';

const blank = (kind) => ({
    amount: '',
    date: todayISO(),
    category: kind === 'income' ? 'salary' : 'food',
    source: 'momo',
    description: '',
    bucket: 'Needs',
    repeat: false,
});

// Add or edit an income/expense. Opened from anywhere through the store's quickAdd.
const EntrySheet = () => {
    const { t } = useTranslation();
    const quickAdd = useStore(s => s.quickAdd);
    const close = useStore(s => s.closeQuickAdd);
    const toast = useStore(s => s.toast);
    const user = useStore(s => s.user);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const goalTransactions = useUserTable('transactions');
    const { split, limits } = useSettings();

    const editing = quickAdd?.entry || null;
    const [kind, setKind] = useState('expense');
    const [form, setForm] = useState(blank('expense'));
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (!quickAdd) return;
        const k = quickAdd.kind || 'expense';
        setKind(k);
        if (quickAdd.entry) {
            const e = quickAdd.entry;
            setForm({
                amount: String(e.amount), date: entryDay(e), category: e.category || 'other',
                source: e.source || 'cash', description: e.description || '',
                bucket: e.bucket || 'Needs', repeat: false,
            });
        } else {
            setForm(blank(k));
        }
    }, [quickAdd]);

    if (!quickAdd) return null;

    const set = (patch) => setForm(f => ({ ...f, ...patch }));
    const switchKind = (k) => { setKind(k); setForm(f => ({ ...blank(k), amount: f.amount, date: f.date, description: f.description })); };
    const table = kind === 'income' ? 'incomes' : 'expenses';
    // A goal deposit's category is fixed; changing its amount also updates the goal
    const goalDeposit = !!editing?.goal_id;
    const categories = kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    // Think before you buy: a pause for big "Wants" purchases
    const pauseCheck = !editing && kind === 'expense' && !form.repeat
        && deservesPause({ amount: Number(form.amount), bucket: form.bucket, incomes: incomes || [] })
        ? purchaseImpact({ amount: Number(form.amount), incomes: incomes || [], goals: goals || [], transactions: goalTransactions || [] })
        : null;

    const waitFirst = async () => {
        await addToWishlist(user.id, {
            amount: Number(form.amount), category: form.category, bucket: form.bucket,
            source: form.source, description: form.description.trim(),
        });
        toast(t('think.added', { amount: formatMoney(Number(form.amount)) }));
        close();
    };

    const pickCategory = (id) => {
        const patch = { category: id };
        if (kind === 'expense') patch.bucket = getExpenseCategory(id).bucket;
        set(patch);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!amount || amount <= 0) return;
        setSaving(true);
        try {
            const fields = {
                amount, date: form.date, category: form.category, source: form.source,
                description: form.description.trim(),
                ...(kind === 'expense' ? { bucket: form.bucket } : {}),
            };

            if (goalDeposit) {
                await updateGoalDepositExpense(editing, fields);
                toast(t('common.saved'));
            } else if (editing) {
                await updateRecord(table, editing.id, fields);
                toast(t('common.saved'));
            } else {
                // Check the budget before this expense is added, to warn on crossing 80%/100%
                const before = kind === 'expense'
                    ? summarizeMonth(form.date.slice(0, 7), { incomes: incomes || [], expenses: expenses || [], split })
                    : null;

                await createRecord(table, user.id, fields);

                if (form.repeat) {
                    await createRecord('recurring', user.id, {
                        kind, ...fields, day_of_month: Number(form.date.slice(8, 10)),
                        start_month: form.date.slice(0, 7), last_generated: form.date.slice(0, 7), active: true,
                    });
                    toast(t('recurring.created'));
                } else {
                    toast(t('common.saved'));
                }

                const crossing = before && budgetCrossing(before, form.bucket, amount);
                if (crossing) {
                    toast(t(crossing === 'over' ? 'budget.overToast' : 'budget.nearToast', { bucket: t(`buckets.${form.bucket}`) }),
                        crossing === 'over' ? 'error' : 'warning');
                }
                const limitHit = before && limitCrossing(before, form.category, amount, limits);
                if (limitHit) {
                    toast(t(limitHit === 'over' ? 'budget.limitOverToast' : 'budget.limitNearToast', { category: t(`categories.${form.category}`) }),
                        limitHit === 'over' ? 'error' : 'warning');
                }
                // Salary just arrived: nudge towards the payday plan
                if (kind === 'income' && form.category === 'salary') {
                    toast(t('salary.paydayToast'), 'info');
                }
            }
            close();
        } catch (err) {
            console.error(err);
            toast(t('common.somethingWrong'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (goalDeposit) await deleteGoalDepositExpense(editing);
        else await deleteRecord(table, editing.id);
        setConfirmDelete(false);
        toast(t('common.deleted'));
        close();
    };

    const title = editing
        ? t(kind === 'income' ? 'money.editIncome' : 'money.editExpense')
        : t(kind === 'income' ? 'money.addIncome' : 'money.addExpense');

    return (
        <>
            <Modal open onClose={close} title={title}>
                <form onSubmit={handleSubmit} className="space-y-5" id="entry-form">
                    {!editing && (
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
                            {['expense', 'income'].map(k => (
                                <button
                                    key={k} type="button" onClick={() => switchKind(k)}
                                    className={`py-2 rounded-lg text-sm font-semibold transition ${kind === k
                                        ? (k === 'income' ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm' : 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm')
                                        : 'text-gray-500'}`}
                                >
                                    {t(k === 'income' ? 'money.income' : 'money.expense')}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                            <label className="label" htmlFor="entry-amount">{t('common.amount')}</label>
                            <input
                                id="entry-amount" type="number" inputMode="numeric" min="1" required autoFocus
                                value={form.amount} onChange={e => set({ amount: e.target.value })}
                                className="input text-lg font-semibold" placeholder="0"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="label" htmlFor="entry-date">{t('common.date')}</label>
                            <input id="entry-date" type="date" required value={form.date} max={todayISO()}
                                onChange={e => set({ date: e.target.value })} className="input" />
                        </div>
                    </div>

                    {goalDeposit && (
                        <Link to={`/goals/${editing.goal_id}`} onClick={close}
                            className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3.5 py-3 text-sm">
                            <Target className="w-4 h-4 shrink-0" /> {t('money.goalDepositHint')}
                        </Link>
                    )}

                    {!goalDeposit && <div>
                        <span className="label">{t('common.category')}</span>
                        <div className="grid grid-cols-4 gap-2">
                            {categories.map(({ id, icon: Icon, color }) => {
                                const active = form.category === id;
                                return (
                                    <button
                                        key={id} type="button" onClick={() => pickCategory(id)}
                                        className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[11px] leading-tight font-medium transition
                                            ${active ? 'border-primary bg-primary/10 text-gray-900 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
                                    >
                                        <Icon className="w-5 h-5" style={{ color }} />
                                        <span className="text-center">{t(`categories.${id}`)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>}

                    {kind === 'expense' && !goalDeposit && (
                        <div>
                            <span className="label">{t('money.bucket')}</span>
                            <div className="grid grid-cols-3 gap-2">
                                {BUCKETS.map(b => (
                                    <button
                                        key={b.id} type="button" onClick={() => set({ bucket: b.id })}
                                        className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${form.bucket === b.id ? 'border-transparent text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                        style={form.bucket === b.id ? { backgroundColor: b.color } : undefined}
                                    >
                                        {t(`buckets.${b.id}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <span className="label">{t(kind === 'income' ? 'common.receivedVia' : 'common.source')}</span>
                        <div className="flex flex-wrap gap-2">
                            {SOURCES.map(s => (
                                <button key={s.id} type="button" onClick={() => set({ source: s.id })}
                                    className={`chip ${form.source === s.id ? 'chip-active' : ''}`}>
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                    {t(`sources.${s.id}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label" htmlFor="entry-note">{t('common.note')}</label>
                        <input id="entry-note" type="text" value={form.description} maxLength={120}
                            onChange={e => set({ description: e.target.value })} className="input"
                            placeholder={t('common.notePlaceholder')} />
                    </div>

                    {!editing && (
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.repeat} onChange={e => set({ repeat: e.target.checked })}
                                className="mt-0.5 w-4 h-4 rounded accent-primary" />
                            <span>
                                <span className="block text-sm font-medium">{t('money.repeatMonthly')}</span>
                                <span className="block text-xs muted">{t('money.repeatHint')}</span>
                            </span>
                        </label>
                    )}

                    {pauseCheck && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-4 space-y-2 text-sm">
                            <p className="font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300"><TriangleAlert className="w-4 h-4" /> {t('think.title')}</p>
                            {pauseCheck.workDays !== null && (
                                <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                                    {t('think.workDays', { days: pauseCheck.workDays < 1 ? pauseCheck.workDays.toFixed(1) : Math.round(pauseCheck.workDays) })}</p>
                            )}
                            {pauseCheck.goal && pauseCheck.delayMonths !== null && (
                                <p className="flex items-center gap-2"><Target className="w-4 h-4 text-amber-600 shrink-0" />
                                    {t('think.delay', { goal: pauseCheck.goal.name, months: pauseCheck.delayMonths < 1 ? Math.max(1, Math.round(pauseCheck.delayMonths * 30)) : pauseCheck.delayMonths.toFixed(1), unit: t(pauseCheck.delayMonths < 1 ? 'think.days' : 'think.months') })}</p>
                            )}
                            <button type="button" onClick={waitFirst} className="btn w-full mt-1 bg-amber-500 text-white hover:bg-amber-600">
                                <Hourglass className="w-4 h-4" /> {t('think.wait', { hours: WAIT_HOURS })}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        {editing && (
                            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost text-red-500" aria-label={t('common.delete')}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button type="button" onClick={close} className="btn-secondary flex-1">{t('common.cancel')}</button>
                        <button type="submit" disabled={saving} className="btn-primary flex-1">{t('common.save')}</button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog open={confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
        </>
    );
};

export default EntrySheet;
