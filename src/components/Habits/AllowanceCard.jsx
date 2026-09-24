import React from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Wallet } from 'lucide-react';
import useStore from '../../store/useStore';
import { formatMoney } from '../../lib/format';
import { ProgressBar } from '../ui/bits';

// "You can spend X today" – the one number that keeps daily spending in check
const AllowanceCard = ({ allowance, streak, compact = false }) => {
    const { t } = useTranslation();
    const openQuickAdd = useStore(s => s.openQuickAdd);
    const { hasIncome, remaining, spentToday } = allowance;
    const daily = allowance.allowance;
    const over = remaining < 0;
    const ratio = daily > 0 ? spentToday / daily : spentToday > 0 ? 1 : 0;

    return (
        <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-lg ${over ? 'bg-gradient-to-br from-rose-500 to-red-700' : 'bg-gradient-to-br from-indigo-600 to-violet-700'}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-white/80 flex items-center gap-1.5"><Wallet className="w-4 h-4" /> {t('allowance.title')}</p>
                    {hasIncome ? (
                        <>
                            <p className="text-3xl sm:text-4xl font-extrabold mt-1">{formatMoney(Math.max(remaining, 0))}</p>
                            <p className="text-sm text-white/80 mt-1">
                                {over
                                    ? t('allowance.over', { amount: formatMoney(-remaining) })
                                    : t('allowance.ofDaily', { spent: formatMoney(spentToday), daily: formatMoney(daily) })}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-white/90 mt-2 max-w-xs">{t('allowance.noIncome')}</p>
                    )}
                </div>
                <div className="text-center shrink-0 rounded-xl bg-white/15 px-3 py-2">
                    <Flame className={`w-6 h-6 mx-auto ${streak > 0 ? 'text-amber-300' : 'text-white/50'}`} />
                    <p className="text-xl font-bold leading-tight">{streak}</p>
                    <p className="text-[10px] text-white/80 leading-tight">{t('allowance.streak', { count: streak })}</p>
                </div>
            </div>
            {hasIncome && (
                <>
                    <div className="mt-4 [&>div]:bg-white/20 dark:[&>div]:bg-white/20"><ProgressBar value={ratio} color={over ? '#fecaca' : '#ffffff'} /></div>
                    {!compact && (
                        <p className="text-xs text-white/75 mt-3">
                            {t('allowance.explain', { bills: formatMoney(allowance.billsDue), savings: formatMoney(allowance.pendingSavings), days: allowance.daysLeft })}
                        </p>
                    )}
                </>
            )}
            {compact && (
                <button onClick={() => openQuickAdd('expense')} className="mt-4 w-full rounded-xl bg-white/15 hover:bg-white/25 py-2 text-sm font-semibold transition">
                    {t('allowance.log')}
                </button>
            )}
        </div>
    );
};

export default AllowanceCard;
