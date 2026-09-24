import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays, Coins, Zap, ArrowUpDown, BarChart3 } from 'lucide-react';
import { getExpenseCategory } from '../../lib/categories';
import { formatMoney, formatCompact, formatPercent } from '../../lib/format';
import { CategoryIcon, EmptyState } from '../ui/bits';

// "How do I spend?" – patterns from the last 90 days
const PatternsSection = ({ habits }) => {
    const { t } = useTranslation();
    const names = t('habits.weekdaysLong', { returnObjects: true });
    const short = t('habits.weekdaysShort', { returnObjects: true });

    if (!habits.hasData) {
        return <div className="card"><EmptyState icon={BarChart3} text={t('patterns.notEnough')} /></div>;
    }

    // Monday first
    const week = [1, 2, 3, 4, 5, 6, 0].map(i => ({ ...habits.weekdays[i], label: Array.isArray(short) ? short[i] : i }));
    const peakDay = habits.peak?.weekday;

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="card-pad">
                <h2 className="section-title flex items-center gap-2 mb-1"><CalendarDays className="w-5 h-5 text-indigo-500" /> {t('patterns.weekdayTitle')}</h2>
                <p className="text-sm muted mb-4">
                    {habits.peak && Array.isArray(names)
                        ? t('patterns.peakDay', { day: names[peakDay], amount: formatMoney(habits.peak.average), avg: formatMoney(habits.overallDaily) })
                        : t('patterns.evenWeek', { avg: formatMoney(habits.overallDaily) })}
                </p>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={week} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={formatCompact} width={44} />
                            <Tooltip formatter={(v) => [formatMoney(v), t('patterns.avgPerDay')]} cursor={{ fill: '#9ca3af1a' }} contentStyle={{ borderRadius: 12, border: 'none' }} />
                            <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                                {week.map(d => <Cell key={d.weekday} fill={d.weekday === peakDay ? '#FF6B35' : '#a5b4fc'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card-pad space-y-5">
                <div>
                    <h2 className="section-title flex items-center gap-2 mb-1"><Coins className="w-5 h-5 text-amber-500" /> {t('patterns.leaksTitle')}</h2>
                    <p className="text-sm muted mb-3">{t('patterns.leaksHint')}</p>
                    {habits.leaks.length === 0 ? <p className="text-sm muted">{t('patterns.noLeaks')}</p> : (
                        <div className="space-y-2.5">
                            {habits.leaks.map(l => {
                                const cat = getExpenseCategory(l.category);
                                return (
                                    <div key={l.category} className="flex items-center gap-3">
                                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                        <p className="flex-1 text-sm">{t('patterns.leak', { category: t(`categories.${cat.id}`), count: l.count })}</p>
                                        <span className="text-sm font-semibold">{formatMoney(l.total)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-rose-500" /> {t('patterns.paydayTitle')}</h3>
                    <p className="text-sm muted">
                        {habits.paydayShare === null
                            ? t('patterns.paydayNoData')
                            : t(habits.paydayShare > 0.4 ? 'patterns.paydayHigh' : 'patterns.paydayOk', { percent: formatPercent(habits.paydayShare) })}
                    </p>
                </div>
            </div>

            <div className="card-pad lg:col-span-2">
                <h2 className="section-title flex items-center gap-2 mb-1"><ArrowUpDown className="w-5 h-5 text-sky-500" /> {t('patterns.changesTitle')}</h2>
                <p className="text-sm muted mb-4">{t('patterns.changesHint')}</p>
                {habits.changes.length === 0 ? <p className="text-sm muted">{t('patterns.noChanges')}</p> : (
                    <div className="grid sm:grid-cols-2 gap-3">
                        {habits.changes.map(c => {
                            const cat = getExpenseCategory(c.category);
                            const up = c.change > 0;
                            return (
                                <div key={c.category} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                                    <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{t(`categories.${cat.id}`)}</p>
                                        <p className="text-xs muted">{t('patterns.vsAverage', { current: formatMoney(c.current), average: formatMoney(c.average) })}</p>
                                    </div>
                                    <span className={`text-sm font-bold ${up ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {up ? '+' : '−'}{formatPercent(Math.abs(c.change))}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatternsSection;
