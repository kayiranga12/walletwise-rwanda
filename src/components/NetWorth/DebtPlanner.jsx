import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mountain, Snowflake, Flame, CalendarCheck, TriangleAlert } from 'lucide-react';
import { addMonths } from 'date-fns';
import { planDebtPayoff } from '../../lib/debt';
import { formatMoney, formatMonth, monthKey } from '../../lib/format';

// Which loan to pay first, and when the user will be debt-free
const DebtPlanner = ({ liabilities, onEdit }) => {
    const { t } = useTranslation();
    const [extra, setExtra] = useState('');
    const [strategy, setStrategy] = useState('avalanche');
    const extraAmount = Number(extra) || 0;

    const missing = liabilities.filter(l => l.amount > 0 && !(Number(l.monthly_payment) > 0));
    const plans = useMemo(() => ({
        current: planDebtPayoff(liabilities, 0, strategy),
        withExtra: planDebtPayoff(liabilities, extraAmount, strategy),
        other: planDebtPayoff(liabilities, extraAmount, strategy === 'avalanche' ? 'snowball' : 'avalanche'),
    }), [liabilities, extraAmount, strategy]);

    const plan = plans.withExtra;
    const when = (months) => formatMonth(monthKey(addMonths(new Date(), months)));
    const saved = plans.current.feasible && plan.feasible ? plans.current.totalInterest - plan.totalInterest : null;
    const monthsSooner = plans.current.feasible && plan.feasible ? plans.current.months - plan.months : null;

    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-1"><Mountain className="w-5 h-5 text-rose-500" /> {t('debt.title')}</h2>
            <p className="text-sm muted mb-5">{t('debt.subtitle')}</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                    <span className="label">{t('debt.strategy')}</span>
                    <div className="grid grid-cols-2 gap-2">
                        {[{ id: 'avalanche', icon: Flame }, { id: 'snowball', icon: Snowflake }].map(({ id, icon: Icon }) => (
                            <button key={id} onClick={() => setStrategy(id)}
                                className={`rounded-xl border-2 p-3 text-left transition ${strategy === id ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                <p className="text-sm font-semibold flex items-center gap-1.5"><Icon className="w-4 h-4 text-primary" /> {t(`debt.${id}`)}</p>
                                <p className="text-[11px] muted mt-0.5">{t(`debt.${id}Hint`)}</p>
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="label" htmlFor="debt-extra">{t('debt.extra')}</label>
                    <input id="debt-extra" type="number" inputMode="numeric" min="0" className="input font-semibold" placeholder="10000"
                        value={extra} onChange={e => setExtra(e.target.value)} />
                    <p className="text-xs muted mt-1.5">{t('debt.extraHint')}</p>
                </div>
            </div>

            {missing.length > 0 && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 px-4 py-3 text-sm mb-4">
                    <p className="flex items-center gap-2 font-medium"><TriangleAlert className="w-4 h-4" /> {t('debt.missing')}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {missing.map(l => <button key={l.id} onClick={() => onEdit(l)} className="chip bg-white dark:bg-gray-900">{l.name}</button>)}
                    </div>
                </div>
            )}

            {!plan.feasible ? (
                <p className="text-sm text-red-600 font-medium">{t('debt.notFeasible')}</p>
            ) : (
                <>
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-4 flex items-center gap-4">
                        <CalendarCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm muted">{t('debt.freeBy')}</p>
                            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{when(plan.months)}</p>
                            <p className="text-xs muted">{t('debt.summary', { months: plan.months, interest: formatMoney(plan.totalInterest), payment: formatMoney(plan.budget) })}</p>
                        </div>
                    </div>
                    {extraAmount > 0 && saved !== null && (monthsSooner > 0 || saved > 0) && (
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-3">
                            {t('debt.extraEffect', { amount: formatMoney(extraAmount), months: monthsSooner, interest: formatMoney(saved) })}
                        </p>
                    )}
                    {plans.other.feasible && plans.other.totalInterest < plan.totalInterest - 1000 && (
                        <p className="text-sm muted mt-2">{t('debt.otherBetter', { strategy: t(`debt.${strategy === 'avalanche' ? 'snowball' : 'avalanche'}`), amount: formatMoney(plan.totalInterest - plans.other.totalInterest) })}</p>
                    )}
                    <ol className="mt-4 space-y-2">
                        {plan.order.map((o, i) => (
                            <li key={o.id} className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                <span className="flex-1 font-medium">{o.name}</span>
                                <span className="muted">{t('debt.paidOff', { date: when(o.month) })}</span>
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </div>
    );
};

export default DebtPlanner;
