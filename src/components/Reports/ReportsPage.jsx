import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useStore from '../../store/useStore';
import { useUserTable, useSettings } from '../../lib/hooks';
import { summarizeMonth, buildInsights } from '../../lib/insights';
import { BUCKETS, getExpenseCategory, getPet, getGoalColor } from '../../lib/categories';
import { goalProgress } from '../../lib/goals';
import { monthKey, formatMonth, formatMoney, formatPercent, formatDate, entryDay, shiftMonth, formatCompact } from '../../lib/format';
import { toCSV, downloadFile } from '../../lib/csv';
import MonthPicker from '../ui/MonthPicker';
import { PageHeader, Spinner, ProgressBar, InsightItem } from '../ui/bits';

const Row = ({ label, value, strong, tone = '' }) => (
    <div className="flex justify-between py-2 text-sm">
        <span className="muted">{label}</span>
        <span className={`${strong ? 'font-bold' : 'font-medium'} ${tone}`}>{value}</span>
    </div>
);

const ReportsPage = () => {
    const { t } = useTranslation();
    const user = useStore(s => s.user);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const goalTransactions = useUserTable('transactions');
    const { split, limits } = useSettings();
    const [month, setMonth] = useState(monthKey());

    const report = useMemo(() => {
        if (!incomes || !expenses || !goals || !goalTransactions) return null;
        const s = summarizeMonth(month, { incomes, expenses, split });
        const categories = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]);
        const top = [...s.expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
        const insights = buildInsights({ month, incomes, expenses, goals, goalTransactions, split, limits }).filter(i => i.id !== 'safe');
        // The six months up to the selected one
        const trend = Array.from({ length: 6 }, (_, i) => {
            const m = shiftMonth(month, i - 5);
            const ms = summarizeMonth(m, { incomes, expenses, split });
            return { label: formatMonth(m, { short: true }).split(' ')[0], income: ms.income, spent: ms.consumption, saved: ms.saved };
        });
        return { s, categories, top, insights, trend };
    }, [incomes, expenses, goals, goalTransactions, month, split, limits]);

    if (!report) return <Spinner />;
    const { s, categories, top, insights, trend } = report;
    const empty = s.incomes.length === 0 && s.expenses.length === 0;

    const exportCsv = () => {
        const rows = [
            ...s.incomes.map(e => ({ ...e, kind: 'income' })),
            ...s.expenses.map(e => ({ ...e, kind: 'expense' })),
        ].sort((a, b) => entryDay(a).localeCompare(entryDay(b)));
        downloadFile(`walletwise-report-${month}.csv`, toCSV(rows, [
            { key: e => entryDay(e), label: t('common.date') },
            { key: e => t(e.kind === 'income' ? 'money.income' : 'money.expense'), label: 'Type' },
            { key: e => t(`categories.${e.category}`), label: t('common.category') },
            { key: e => (e.bucket ? t(`buckets.${e.bucket}`) : ''), label: t('money.bucket') },
            { key: e => t(`sources.${e.source}`), label: t('common.source') },
            { key: 'description', label: t('common.note') },
            { key: e => (e.kind === 'income' ? e.amount : -e.amount), label: 'Amount (RWF)' },
        ]));
    };

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
            <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')}>
                <MonthPicker value={month} onChange={setMonth} />
                <button className="btn-secondary" onClick={exportCsv} disabled={empty}><Download className="w-4 h-4" /> CSV</button>
                <button className="btn-primary" onClick={() => window.print()} disabled={empty} title={t('reports.printHint')}>
                    <Printer className="w-4 h-4" /> {t('reports.download')}
                </button>
            </PageHeader>

            {/* Printed header */}
            <div className="hidden print:block mb-6">
                <h1 className="text-2xl font-bold">WalletWise Rwanda – {t('reports.title')}</h1>
                <p>{formatMonth(month)} · {t('reports.generatedFor', { name: user?.user_metadata?.username || user?.email })}</p>
            </div>

            {empty ? (
                <div className="card-pad text-center muted py-16">{t('reports.empty')}</div>
            ) : (
                <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="card-pad">
                            <h2 className="section-title mb-2">{t('reports.summary')}</h2>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                <Row label={t('dashboard.income')} value={formatMoney(s.income)} tone="text-emerald-600" />
                                <Row label={t('dashboard.spent')} value={formatMoney(s.spent)} tone="text-rose-600" />
                                <Row label={t('reports.net')} value={formatMoney(s.left)} strong tone={s.left < 0 ? 'text-rose-600' : ''} />
                                <Row label={t('reports.savingsRate')} value={formatPercent(s.savingsRate)} strong />
                            </div>
                        </div>

                        <div className="card-pad">
                            <h2 className="section-title mb-3">{t('reports.vsPlan')}</h2>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="muted text-xs text-left">
                                        <th className="font-medium pb-2" />
                                        <th className="font-medium pb-2 pl-3 text-right">{t('reports.planned')}</th>
                                        <th className="font-medium pb-2 pl-3 text-right">{t('reports.actual')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {BUCKETS.map(b => {
                                        const { spent, allocated } = s.buckets[b.id];
                                        const actualPct = s.income > 0 ? spent / s.income : 0;
                                        const bad = b.id === 'Savings' ? actualPct < split[b.id] / 100 : actualPct > split[b.id] / 100;
                                        return (
                                            <tr key={b.id} className="border-t border-gray-100 dark:border-gray-800">
                                                <td className="py-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />{t(`buckets.${b.id}`)}</td>
                                                <td className="py-2 text-right">{split[b.id]}% <span className="muted text-xs block">{formatMoney(allocated)}</span></td>
                                                <td className={`py-2 text-right font-semibold ${s.income > 0 && bad ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {formatPercent(actualPct)} <span className="muted text-xs block font-normal">{formatMoney(spent)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card-pad">
                        <h2 className="section-title mb-4">{t('reports.trend')}</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#9ca3af33" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={formatCompact} width={44} />
                                    <Tooltip formatter={(v) => formatMoney(v)} cursor={{ fill: '#9ca3af1a' }} contentStyle={{ borderRadius: 12, border: 'none' }} />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="income" name={t('dashboard.income')} fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="spent" name={t('dashboard.spent')} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="saved" name={t('reports.saved')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {insights.length > 0 && (
                        <div className="card-pad space-y-2">
                            {insights.map(i => <InsightItem key={i.id} insight={i} />)}
                        </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="card-pad">
                            <h2 className="section-title mb-4">{t('reports.byCategory')}</h2>
                            <div className="space-y-3">
                                {categories.map(([id, total]) => {
                                    const cat = getExpenseCategory(id);
                                    return (
                                        <div key={id}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{t(`categories.${cat.id}`)}</span>
                                                <span className="font-medium">{formatMoney(total)} <span className="muted text-xs">({formatPercent(total / s.spent)})</span></span>
                                            </div>
                                            <ProgressBar value={total / s.spent} color={cat.color} className="h-1.5" />
                                        </div>
                                    );
                                })}
                                {categories.length === 0 && <p className="muted text-sm">{t('budget.noExpenses')}</p>}
                            </div>
                        </div>

                        <div className="card-pad">
                            <h2 className="section-title mb-2">{t('reports.topExpenses')}</h2>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {top.map(e => (
                                    <div key={e.id} className="flex justify-between py-2 text-sm gap-3">
                                        <span className="truncate">{e.description || t(`categories.${e.category}`)} <span className="muted text-xs">· {formatDate(entryDay(e), { withYear: false })}</span></span>
                                        <span className="font-medium whitespace-nowrap">{formatMoney(e.amount)}</span>
                                    </div>
                                ))}
                                {top.length === 0 && <p className="muted text-sm py-2">{t('budget.noExpenses')}</p>}
                            </div>
                        </div>
                    </div>

                    {goals.length > 0 && (
                        <div className="card-pad">
                            <h2 className="section-title mb-4">{t('reports.goalProgress')}</h2>
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                                {goals.map(g => (
                                    <div key={g.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{getPet(g.pet_avatar).icon} {g.name}</span>
                                            <span className="font-medium">{formatPercent(goalProgress(g))}</span>
                                        </div>
                                        <ProgressBar value={goalProgress(g)} color={getGoalColor(g.color_theme).hex} className="h-1.5" />
                                        <p className="text-xs muted mt-1">{formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
