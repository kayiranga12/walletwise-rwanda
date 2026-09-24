import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, PiggyBank, Calculator, CircleCheck, Plus, TriangleAlert, Repeat } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable, useSettings, useUpcomingBills } from '../../lib/hooks';
import { BUCKETS, getPet, getGoalColor } from '../../lib/categories';
import { plannedContribution, paidThisPayday, runPayday } from '../../lib/goals';
import { salaryForMonth, calculateNetSalary, RATES } from '../../lib/salary';
import { createRecord } from '../../lib/repo';
import { runRecurring } from '../../lib/recurring';
import { monthKey, formatMoney, formatMonth } from '../../lib/format';
import { summarizeMonth } from '../../lib/insights';
import { PageHeader, Spinner, EmptyState } from '../ui/bits';
import UpcomingBills from './UpcomingBills';

const PaydayPlan = ({ salary, split, goals, transactions, summary }) => {
    const { t } = useTranslation();
    const { toast, celebrate, openQuickAdd } = useStore();
    const [busy, setBusy] = useState(false);
    const month = monthKey();

    const plan = goals
        .filter(g => !g.is_completed)
        .map(g => ({ goal: g, amount: plannedContribution(g), paid: paidThisPayday(g, transactions, month) }))
        .filter(p => p.amount > 0 || p.paid);
    const toSave = plan.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
    const savingsAllocation = salary * (split.Savings / 100);
    const plannedTotal = plan.reduce((s, p) => s + p.amount, 0);

    const saveNow = async () => {
        setBusy(true);
        try {
            const crossed = await runPayday(plan.filter(p => !p.paid).map(p => p.goal), transactions, month);
            toast(t('salary.savedToGoals', { amount: formatMoney(toSave) }));
            if (crossed[0]) celebrate(crossed[0].goal, crossed[0].milestone);
        } catch (err) {
            console.error(err);
            toast(t('common.somethingWrong'), 'error');
        } finally {
            setBusy(false);
        }
    };

    if (salary <= 0) {
        return (
            <div className="card">
                <EmptyState icon={Wallet} text={t('salary.noSalary')}
                    action={<button className="btn-primary" onClick={() => openQuickAdd('income')}><Plus className="w-4 h-4" /> {t('money.addIncome')}</button>} />
            </div>
        );
    }

    return (
        <div className="card-pad space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-sm muted">{t('salary.receivedIn', { month: formatMonth(month) })}</p>
                    <p className="text-3xl font-bold">{formatMoney(salary)}</p>
                </div>
                <Link to="/budget" className="text-sm text-primary font-medium">{t('budget.customize')}</Link>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {BUCKETS.map(b => {
                    const planned = salary * split[b.id] / 100;
                    const spent = summary.buckets[b.id].spent;
                    return (
                        <div key={b.id} className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: `${b.color}14` }}>
                            <p className="text-xs font-semibold" style={{ color: b.color }}>{t(`buckets.${b.id}`)} · {split[b.id]}%</p>
                            <p className="text-base sm:text-lg font-bold mt-1">{formatMoney(planned)}</p>
                            <p className="text-[11px] muted mt-0.5">{t('salary.usedSoFar', { amount: formatMoney(spent) })}</p>
                        </div>
                    );
                })}
            </div>

            <div>
                <h3 className="font-semibold flex items-center gap-2 mb-1"><PiggyBank className="w-5 h-5 text-emerald-500" /> {t('salary.payYourselfFirst')}</h3>
                <p className="text-sm muted mb-3">{t('salary.payYourselfFirstHint')}</p>
                {plan.length === 0 ? (
                    <p className="text-sm muted">{t('salary.noGoalPlan')} <Link to="/goals/new" className="text-primary font-medium">{t('goals.createGoal')}</Link></p>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800">
                        {plan.map(({ goal, amount, paid }) => (
                            <Link key={goal.id} to={`/goals/${goal.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${getGoalColor(goal.color_theme).hex}22` }}>{getPet(goal.pet_avatar).icon}</span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium truncate">{goal.name}</span>
                                    <span className="block text-xs muted">{goal.monthly_contribution != null ? t('salary.yourAmount') : t('salary.suggested')}</span>
                                </span>
                                {paid
                                    ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CircleCheck className="w-4 h-4" /> {t('salary.done')}</span>
                                    : <span className="text-sm font-semibold">{formatMoney(amount)}</span>}
                            </Link>
                        ))}
                    </div>
                )}
                {plannedTotal > savingsAllocation && savingsAllocation > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5">
                        <TriangleAlert className="w-3.5 h-3.5" /> {t('salary.overSavings', { amount: formatMoney(savingsAllocation) })}
                    </p>
                )}
                {toSave > 0 && (
                    <button onClick={saveNow} disabled={busy} className="btn w-full mt-4 bg-emerald-500 text-white hover:bg-emerald-600">
                        <PiggyBank className="w-4 h-4" /> {t('salary.saveNow', { amount: formatMoney(toSave) })}
                    </button>
                )}
                {plan.length > 0 && toSave === 0 && (
                    <p className="text-sm text-emerald-600 font-medium mt-3 flex items-center gap-1.5"><CircleCheck className="w-4 h-4" /> {t('salary.allSaved')}</p>
                )}
            </div>
        </div>
    );
};

const NetSalaryCalculator = ({ salaryRule }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const [gross, setGross] = useState('');
    const [day, setDay] = useState(25);
    const r = calculateNetSalary(gross);

    const addRule = async () => {
        await createRecord('recurring', user.id, {
            kind: 'income', amount: Math.round(r.net), category: 'salary', source: 'bank',
            description: t('categories.salary'), day_of_month: Number(day),
            start_month: monthKey(), last_generated: null, active: true,
        });
        await runRecurring(user.id);
        toast(t('recurring.created'));
    };

    const rows = [
        ['salary.paye', r.paye],
        ['salary.pension', r.pension, `${+(RATES.pension * 100).toFixed(2)}%`],
        ['salary.maternity', r.maternity, `${+(RATES.maternity * 100).toFixed(2)}%`],
        ['salary.cbhi', r.cbhi, `${+(RATES.cbhi * 100).toFixed(2)}%`],
    ];

    return (
        <div className="card-pad">
            <h3 className="section-title flex items-center gap-2 mb-1"><Calculator className="w-5 h-5 text-violet-500" /> {t('salary.calculator')}</h3>
            <p className="muted text-sm mb-4">{t('salary.calculatorHint')}</p>
            <label className="label" htmlFor="gross">{t('salary.gross')}</label>
            <input id="gross" type="number" inputMode="numeric" min="0" className="input text-lg font-semibold" placeholder="300000"
                value={gross} onChange={e => setGross(e.target.value)} />

            {r.gross > 0 && (
                <>
                    <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                        {rows.map(([key, value, rate]) => (
                            <div key={key} className="flex justify-between py-2">
                                <span className="muted">{t(key)} {rate && <span className="text-xs">({rate})</span>}</span>
                                <span>−{formatMoney(value)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between py-3">
                            <span className="font-semibold">{t('salary.net')}</span>
                            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(r.net)}</span>
                        </div>
                    </div>
                    <p className="text-xs muted">{t('salary.estimateNote')}</p>
                    {!salaryRule && (
                        <div className="flex items-end gap-3 mt-4">
                            <div className="w-28">
                                <label className="label" htmlFor="payday">{t('salary.payday')}</label>
                                <select id="payday" className="input" value={day} onChange={e => setDay(e.target.value)}>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <button className="btn-primary flex-1" onClick={addRule}><Repeat className="w-4 h-4" /> {t('salary.useAsSalary')}</button>
                        </div>
                    )}
                </>
            )}
            {salaryRule && (
                <p className="text-sm mt-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                    {t('salary.ruleExists', { amount: formatMoney(salaryRule.amount), day: salaryRule.day_of_month })}
                </p>
            )}
        </div>
    );
};

const SalaryPage = () => {
    const { t } = useTranslation();
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const transactions = useUserTable('transactions');
    const rules = useUserTable('recurring');
    const bills = useUpcomingBills();
    const { split } = useSettings();
    const month = monthKey();

    const summary = useMemo(
        () => (incomes && expenses ? summarizeMonth(month, { incomes, expenses, split }) : null),
        [incomes, expenses, month, split]
    );

    if (!summary || !goals || !transactions || !rules) return <Spinner />;

    const salary = salaryForMonth(incomes, month);
    const salaryRule = rules.find(r => r.active && r.kind === 'income' && r.category === 'salary');

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader title={t('salary.title')} subtitle={t('salary.subtitle')} />
            <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <PaydayPlan salary={salary} split={split} goals={goals} transactions={transactions} summary={summary} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <UpcomingBills bills={bills} left={summary.left} />
                    <NetSalaryCalculator salaryRule={salaryRule} />
                </div>
            </div>
        </div>
    );
};

export default SalaryPage;
