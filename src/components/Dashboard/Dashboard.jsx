import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Plus, Minus, ChevronRight, Sparkles, Activity, PartyPopper } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable, useSettings, useUpcomingBills } from '../../lib/hooks';
import { plannedContribution, paidThisPayday } from '../../lib/goals';
import { salaryForMonth } from '../../lib/salary';
import UpcomingBills from '../Salary/UpcomingBills';
import { summarizeMonth, buildInsights } from '../../lib/insights';
import { BUCKETS } from '../../lib/categories';
import { monthKey, formatMoney, entryMonth, entryDay, daysInMonthKey } from '../../lib/format';
import GoalCard, { AddGoalCard } from './GoalCard';
import EntryRow from '../Money/EntryRow';
import { Spinner, ProgressBar, InsightItem, EmptyState } from '../ui/bits';

const greetingKey = () => {
    const h = new Date().getHours();
    return h < 12 ? 'greeting.morning' : h < 17 ? 'greeting.afternoon' : 'greeting.evening';
};

const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
    <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}><Icon className="w-4 h-4" /></div>
            <p className="text-xs sm:text-sm muted font-medium">{label}</p>
        </div>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {hint && <p className="text-xs muted mt-0.5">{hint}</p>}
    </div>
);

const Dashboard = () => {
    const { t } = useTranslation();
    const user = useStore(s => s.user);
    const openQuickAdd = useStore(s => s.openQuickAdd);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const goalTransactions = useUserTable('transactions');
    const { split, limits } = useSettings();
    const bills = useUpcomingBills();
    const month = monthKey();

    const data = useMemo(() => {
        if (!incomes || !expenses || !goals || !goalTransactions) return null;
        const summary = summarizeMonth(month, { incomes, expenses, split });
        const insights = buildInsights({ month, incomes, expenses, goals, goalTransactions, split, limits, bills });
        const salary = salaryForMonth(incomes, month);
        const paydayToSave = goals
            .filter(g => !paidThisPayday(g, goalTransactions, month))
            .reduce((s, g) => s + plannedContribution(g), 0);
        const savedToGoals = goalTransactions
            .filter(tx => entryMonth(tx) === month)
            .reduce((s, tx) => s + (tx.type === 'deposit' ? tx.amount : -tx.amount), 0);
        const recent = [
            ...incomes.map(e => ({ ...e, kind: 'income' })),
            ...expenses.map(e => ({ ...e, kind: 'expense' })),
        ]
            .sort((a, b) => entryDay(b).localeCompare(entryDay(a)) || (b.created_at || '').localeCompare(a.created_at || ''))
            .slice(0, 6);
        return { summary, insights, savedToGoals, recent, salary, paydayToSave };
    }, [incomes, expenses, goals, goalTransactions, month, split, limits, bills]);

    if (!data) return <Spinner />;
    const { summary, insights, savedToGoals, recent, salary, paydayToSave } = data;
    const billsDue = bills.reduce((s, b) => s + b.amount, 0);
    const free = summary.left - billsDue;

    const daysLeft = daysInMonthKey(month) - new Date().getDate() + 1;
    const activeGoals = goals.filter(g => !g.is_completed)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 3);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">{t(greetingKey())}, {user?.user_metadata?.username || 'Saver'}! 👋</h1>
                    <p className="muted mt-1">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => openQuickAdd('income')} className="btn-secondary flex-1 sm:flex-none">
                        <Plus className="w-4 h-4 text-emerald-500" /> {t('dashboard.addIncome')}
                    </button>
                    <button onClick={() => openQuickAdd('expense')} className="btn-primary flex-1 sm:flex-none">
                        <Minus className="w-4 h-4" /> {t('dashboard.addExpense')}
                    </button>
                </div>
            </div>

            {salary > 0 && paydayToSave > 0 && (
                <Link to="/salary" className="flex items-center gap-4 rounded-2xl p-4 sm:p-5 text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:shadow-lg transition">
                    <PartyPopper className="w-8 h-8 shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold">{t('dashboard.paydayTitle')}</p>
                        <p className="text-sm text-emerald-50">{t('dashboard.paydayBody', { amount: formatMoney(paydayToSave) })}</p>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </Link>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={ArrowDownLeft} label={t('dashboard.income')} value={formatMoney(summary.income)}
                    tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" />
                <StatCard icon={ArrowUpRight} label={t('dashboard.spent')} value={formatMoney(summary.spent)}
                    tone="bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" />
                <StatCard icon={Wallet} label={t('dashboard.left')} value={formatMoney(summary.left)}
                    hint={billsDue > 0
                        ? t('dashboard.afterBills', { amount: formatMoney(free) })
                        : summary.left > 0 ? t('dashboard.perDay', { amount: formatMoney(summary.left / daysLeft) }) : null}
                    tone="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400" />
                <StatCard icon={PiggyBank} label={t('dashboard.savedThisMonth')} value={formatMoney(savedToGoals)}
                    tone="bg-primary/10 text-primary" />
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 card-pad">
                    <h2 className="section-title flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-primary" /> {t('dashboard.insights')}</h2>
                    {insights.length === 0
                        ? <p className="muted text-sm">{t('dashboard.noInsights')}</p>
                        : <div className="space-y-2">{insights.slice(0, 4).map(i => <InsightItem key={i.id} insight={i} />)}</div>}
                </div>

                <div className="lg:col-span-2 card-pad">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="section-title">{t('dashboard.budgetSnapshot')}</h2>
                        <Link to="/budget" className="text-sm text-primary font-medium flex items-center">{t('common.viewAll')} <ChevronRight className="w-4 h-4" /></Link>
                    </div>
                    <div className="space-y-4">
                        {BUCKETS.map(b => {
                            const { spent, allocated, ratio } = summary.buckets[b.id];
                            return (
                                <div key={b.id}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium">{t(`buckets.${b.id}`)}</span>
                                        <span className={`${ratio > 1 ? 'text-red-600 font-semibold' : 'muted'}`}>
                                            {formatMoney(spent)} <span className="text-xs">/ {formatMoney(allocated)}</span>
                                        </span>
                                    </div>
                                    <ProgressBar value={ratio} color={ratio > 1 ? '#ef4444' : b.color} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {bills.length > 0 && <UpcomingBills bills={bills} left={summary.left} compact />}

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="section-title">{t('dashboard.yourGoals')}</h2>
                    <Link to="/goals" className="text-sm text-primary font-medium flex items-center">{t('common.viewAll')} <ChevronRight className="w-4 h-4" /></Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeGoals.map(goal => <GoalCard key={goal.id} goal={goal} transactions={goalTransactions} />)}
                    {activeGoals.length < 3 && <AddGoalCard />}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="section-title">{t('dashboard.recentActivity')}</h2>
                    <Link to="/money" className="text-sm text-primary font-medium flex items-center">{t('common.viewAll')} <ChevronRight className="w-4 h-4" /></Link>
                </div>
                {recent.length === 0
                    ? <EmptyState icon={Activity} text={t('dashboard.noActivity')} />
                    : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recent.map(e => <EntryRow key={e.id} entry={e} kind={e.kind} onClick={() => openQuickAdd(e.kind, e)} />)}
                        </div>
                    )}
            </div>
        </div>
    );
};

export default Dashboard;
