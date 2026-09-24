import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { SlidersHorizontal, Plus } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable, useSettings } from '../../lib/hooks';
import { summarizeMonth } from '../../lib/insights';
import { BUCKETS, EXPENSE_CATEGORIES, getExpenseCategory } from '../../lib/categories';
import { createRecord, updateRecord } from '../../lib/repo';
import { monthKey, formatMoney } from '../../lib/format';
import MonthPicker from '../ui/MonthPicker';
import Modal from '../ui/Modal';
import { PageHeader, Spinner, ProgressBar, CategoryIcon } from '../ui/bits';

const SplitEditor = ({ open, onClose, split }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const { raw } = useSettings();
    const [values, setValues] = useState(split);
    const total = BUCKETS.reduce((s, b) => s + (Number(values[b.id]) || 0), 0);

    const save = async () => {
        const next = Object.fromEntries(BUCKETS.map(b => [b.id, Number(values[b.id]) || 0]));
        if (raw) await updateRecord('settings', user.id, { split: next });
        else await createRecord('settings', user.id, { split: next }, user.id);
        toast(t('budget.splitSaved'));
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={t('budget.splitTitle')} size="sm">
            <p className="muted text-sm mb-5">{t('budget.splitHint')}</p>
            <div className="space-y-5">
                {BUCKETS.map(b => (
                    <div key={b.id}>
                        <div className="flex justify-between text-sm font-medium mb-1.5">
                            <span>{t(`buckets.${b.id}`)}</span>
                            <span style={{ color: b.color }}>{values[b.id]}%</span>
                        </div>
                        <input type="range" min="0" max="100" step="5" value={values[b.id]}
                            onChange={e => setValues(v => ({ ...v, [b.id]: Number(e.target.value) }))}
                            className="w-full" style={{ accentColor: b.color }} aria-label={t(`buckets.${b.id}`)} />
                    </div>
                ))}
            </div>
            <p className={`text-sm font-semibold mt-5 ${total === 100 ? 'text-emerald-600' : 'text-red-500'}`}>{t('budget.splitTotal', { total })}</p>
            <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={() => setValues({ Needs: 50, Wants: 30, Savings: 20 })}>50/30/20</button>
                <button className="btn-primary flex-1" disabled={total !== 100} onClick={save}>{t('common.save')}</button>
            </div>
        </Modal>
    );
};

const BudgetDashboard = () => {
    const { t } = useTranslation();
    const openQuickAdd = useStore(s => s.openQuickAdd);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const { split } = useSettings();
    const [month, setMonth] = useState(monthKey());
    const [editing, setEditing] = useState(false);

    const summary = useMemo(
        () => (incomes && expenses ? summarizeMonth(month, { incomes, expenses, split }) : null),
        [incomes, expenses, month, split]
    );

    if (!summary) return <Spinner />;

    const splitLabel = BUCKETS.map(b => split[b.id]).join('/');
    const pieData = BUCKETS.map(b => ({ name: t(`buckets.${b.id}`), value: summary.buckets[b.id].spent, color: b.color })).filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader title={t('budget.title')} subtitle={t('budget.subtitle', { split: splitLabel })}>
                <MonthPicker value={month} onChange={setMonth} />
                <button className="btn-secondary" onClick={() => setEditing(true)}><SlidersHorizontal className="w-4 h-4" /> {t('budget.customize')}</button>
            </PageHeader>

            <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-indigo-200 uppercase tracking-wide">{t('budget.totalIncome')}</p>
                    <p className="text-3xl font-bold mt-1">{formatMoney(summary.income)}</p>
                </div>
                <div className="flex gap-6 text-sm">
                    <div><p className="text-indigo-200">{t('dashboard.spent')}</p><p className="font-bold text-lg">{formatMoney(summary.spent)}</p></div>
                    <div><p className="text-indigo-200">{t('dashboard.left')}</p><p className="font-bold text-lg">{formatMoney(summary.left)}</p></div>
                </div>
            </div>

            {summary.income === 0 && (
                <div className="card-pad flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="muted text-sm">{t('budget.noIncome')}</p>
                    <button className="btn-primary" onClick={() => openQuickAdd('income')}><Plus className="w-4 h-4" /> {t('money.addIncome')}</button>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {BUCKETS.map(b => {
                        const { spent, allocated, ratio } = summary.buckets[b.id];
                        const over = allocated > 0 && spent > allocated;
                        const cats = EXPENSE_CATEGORIES
                            .map(c => ({ ...c, total: summary.expenses.filter(e => e.bucket === b.id && e.category === c.id).reduce((s, e) => s + Number(e.amount), 0) }))
                            .filter(c => c.total > 0)
                            .sort((a, z) => z.total - a.total);

                        return (
                            <div key={b.id} className={`card-pad ${over ? 'ring-1 ring-red-300 dark:ring-red-500/40' : ''}`}>
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div>
                                        <p className="font-semibold flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                                            {t(`buckets.${b.id}`)} <span className="muted font-normal text-sm">{split[b.id]}%</span>
                                        </p>
                                        <p className="text-xs muted mt-0.5">{t(`buckets.${b.id}Hint`)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${over ? 'text-red-600' : ''}`}>{formatMoney(spent)}</p>
                                        <p className="text-xs muted">{t('budget.budgetOf', { amount: formatMoney(allocated) })}</p>
                                    </div>
                                </div>
                                <ProgressBar value={ratio} color={over ? '#ef4444' : b.color} />
                                <p className={`text-xs mt-2 font-medium ${over ? 'text-red-600' : 'muted'}`}>
                                    {allocated > 0 && (over
                                        ? `${t('budget.overBudget')} ${t('budget.over', { amount: formatMoney(spent - allocated) })}`
                                        : t('budget.remaining', { amount: formatMoney(allocated - spent) }))}
                                </p>
                                {cats.length > 0 && (
                                    <div className="mt-4 space-y-2.5">
                                        {cats.map(c => (
                                            <div key={c.id} className="flex items-center gap-3">
                                                <CategoryIcon icon={getExpenseCategory(c.id).icon} color={c.color} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="truncate">{t(`categories.${c.id}`)}</span>
                                                        <span className="font-medium">{formatMoney(c.total)}</span>
                                                    </div>
                                                    <ProgressBar value={spent > 0 ? c.total / spent : 0} color={c.color} className="h-1 mt-1" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="card-pad h-fit">
                    <h3 className="section-title mb-4">{t('budget.breakdown')}</h3>
                    {pieData.length > 0 ? (
                        <>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                                            {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(v) => formatMoney(v)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-2">
                                {pieData.map(d => (
                                    <div key={d.name} className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                                        <span className="font-medium">{Math.round((d.value / summary.spent) * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="muted text-sm text-center py-16">{t('budget.noExpenses')}</p>
                    )}
                </div>
            </div>

            {editing && <SplitEditor open onClose={() => setEditing(false)} split={split} />}
        </div>
    );
};

export default BudgetDashboard;
