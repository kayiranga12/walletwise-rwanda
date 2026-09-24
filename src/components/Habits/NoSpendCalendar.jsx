import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck } from 'lucide-react';
import { formatMoney, formatMonth, monthKey } from '../../lib/format';

const STYLE = {
    none: 'bg-emerald-500 text-white',
    under: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
    over: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    future: 'bg-gray-50 text-gray-300 dark:bg-gray-800/50 dark:text-gray-600',
};

// This month at a glance: no-spend days, days within budget and days over it
const NoSpendCalendar = ({ calendar }) => {
    const { t } = useTranslation();
    const weekdays = t('habits.weekdaysShort', { returnObjects: true });
    // Weeks start on Monday
    const offset = (calendar.days[0].weekday + 6) % 7;

    return (
        <div className="card-pad">
            <div className="flex items-center justify-between mb-1">
                <h2 className="section-title flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-emerald-500" /> {t('habits.calendarTitle')}</h2>
                <span className="text-sm font-semibold text-emerald-600">{t('habits.noSpendCount', { count: calendar.noSpendDays })}</span>
            </div>
            <p className="text-sm muted mb-4">
                {formatMonth(monthKey())} · {calendar.budget > 0 ? t('habits.dailyBudget', { amount: formatMoney(calendar.budget) }) : t('allowance.noIncome')}
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center">
                {(Array.isArray(weekdays) ? [...weekdays.slice(1), weekdays[0]] : []).map(w => (
                    <div key={w} className="text-[11px] muted font-medium pb-1">{w}</div>
                ))}
                {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
                {calendar.days.map(d => (
                    <div key={d.day} title={d.status === 'future' ? '' : formatMoney(d.spent)}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold ${STYLE[d.status]}`}>
                        {d.day}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-xs muted">
                {['none', 'under', 'over'].map(s => (
                    <span key={s} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${STYLE[s]}`} />{t(`habits.legend.${s}`)}</span>
                ))}
            </div>
        </div>
    );
};

export default NoSpendCalendar;
