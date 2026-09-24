import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartPulse, ChevronRight, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { GRADE_COLORS } from '../../lib/discipline';
import { formatMonth, formatPercent } from '../../lib/format';
import { ProgressBar } from '../ui/bits';

const ScoreRing = ({ score, color, size = 'lg' }) => {
    const r = 42, c = 2 * Math.PI * r;
    const box = size === 'lg' ? 'w-32 h-32' : 'w-16 h-16';
    return (
        <div className={`relative ${box} shrink-0`}>
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-gray-100 dark:stroke-gray-800" />
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" stroke={color} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={size === 'lg' ? 'text-3xl font-extrabold' : 'text-lg font-bold'}>{score}</span>
                {size === 'lg' && <span className="text-[11px] muted">/ 100</span>}
            </div>
        </div>
    );
};

// Small version for the dashboard
export const HealthScoreMini = ({ health }) => {
    const { t } = useTranslation();
    const color = GRADE_COLORS[health.grade];
    return (
        <Link to="/habits" className="card p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition">
            <ScoreRing score={health.hasData ? health.score : 0} color={color} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm muted font-medium flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-rose-500" /> {t('health.title')}</p>
                <p className="font-bold text-lg" style={{ color }}>{health.hasData ? t(`health.grades.${health.grade}`) : '—'}</p>
                <p className="text-xs muted truncate">{health.hasData ? t(`health.tips.${health.weakest}`) : t('health.noData')}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </Link>
    );
};

const detailText = (t, id, details) => {
    if (id === 'savings') return t('health.detail.savings', { percent: formatPercent(details.savingsRate) });
    if (id === 'budget') return details.allocated > 0 ? t('health.detail.budget', { percent: formatPercent(details.used / details.allocated) }) : t('health.noData');
    if (id === 'emergency') return t('health.detail.emergency', { months: details.monthsCovered.toFixed(1) });
    return details.debt > 0 ? t('health.detail.debt', { percent: formatPercent(details.debtLoad) }) : t('health.detail.noDebt');
};

const HealthScoreCard = ({ health, history }) => {
    const { t } = useTranslation();
    const color = GRADE_COLORS[health.grade];
    const trend = history.map(h => ({ ...h, label: formatMonth(h.month, { short: true }).split(' ')[0] }));
    const withData = trend.filter(h => h.score !== null);

    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-5"><HeartPulse className="w-5 h-5 text-rose-500" /> {t('health.title')}</h2>
            <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div className="flex items-center gap-4">
                    <ScoreRing score={health.hasData ? health.score : 0} color={color} />
                    <div>
                        <p className="text-2xl font-bold" style={{ color }}>{health.hasData ? t(`health.grades.${health.grade}`) : '—'}</p>
                        <p className="text-sm muted max-w-[14rem]">{t('health.subtitle')}</p>
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    {health.parts.map(p => (
                        <div key={p.id}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">{t(`health.parts.${p.id}`)}</span>
                                <span className="muted">{p.points} / {p.max}</span>
                            </div>
                            <ProgressBar value={p.ratio} color={p.ratio >= 0.8 ? '#10b981' : p.ratio >= 0.5 ? '#f59e0b' : '#ef4444'} />
                            <p className="text-xs muted mt-0.5">{detailText(t, p.id, health.details)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {health.hasData && (
                <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p><span className="font-semibold">{t('health.nextStep')}:</span> {t(`health.tips.${health.weakest}`)}</p>
                </div>
            )}

            {withData.length >= 2 && (
                <div className="mt-6">
                    <p className="text-sm font-medium mb-2">{t('health.trend')}</p>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} width={40} />
                                <Tooltip formatter={(v) => [v, t('health.title')]} contentStyle={{ borderRadius: 12, border: 'none' }} />
                                <Line type="monotone" dataKey="score" stroke={color} strokeWidth={3} dot={{ r: 3 }} connectNulls />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthScoreCard;
