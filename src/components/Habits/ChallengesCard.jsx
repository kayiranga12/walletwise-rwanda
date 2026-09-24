import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Ban, Coffee, TrendingDown, Mountain, BadgeCheck, Flame, HeartPulse, ShieldCheck, Medal, Hourglass, X, Lock } from 'lucide-react';
import useStore from '../../store/useStore';
import { startChallenge, removeChallenge } from '../../lib/settings';
import { CHALLENGES, BADGES, challengeWindow } from '../../lib/discipline';
import { formatDate, formatMoney, todayISO } from '../../lib/format';
import { ProgressBar } from '../ui/bits';
import ConfirmDialog from '../ui/ConfirmDialog';

const ICONS = { Ban, Coffee, TrendingDown, Mountain, BadgeCheck, Flame, HeartPulse, ShieldCheck, Trophy, Medal, Hourglass };

const STATUS_STYLE = {
    upcoming: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/10',
    active: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10',
    won: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10',
    lost: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-500/10',
};

export const ChallengesCard = ({ challenges }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const [removing, setRemoving] = useState(null);
    const running = challenges.filter(c => ['active', 'upcoming'].includes(c.result.status));
    const runningTypes = new Set(running.map(c => c.type));
    const finished = challenges.filter(c => ['won', 'lost'].includes(c.result.status)).slice(0, 5);

    const start = async (type) => {
        await startChallenge(user.id, type, todayISO());
        const { from, to } = challengeWindow(type, todayISO());
        toast(t('challenges.started', { from: formatDate(from, { withYear: false }), to: formatDate(to, { withYear: false }) }));
    };

    const row = (c) => {
        const def = CHALLENGES.find(d => d.id === c.type);
        const Icon = ICONS[def?.icon] || Trophy;
        const r = c.result;
        return (
            <div key={c.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3.5">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{t(`challenges.list.${c.type}.title`)}</p>
                        <p className="text-xs muted">{formatDate(r.from, { withYear: false })} – {formatDate(r.to, { withYear: false })}</p>
                        {r.detail?.limit !== undefined && !r.detail.noBaseline && (
                            <p className="text-xs muted">{t('challenges.wantsProgress', { current: formatMoney(r.detail.current), limit: formatMoney(r.detail.limit) })}</p>
                        )}
                        {r.detail?.noBaseline && <p className="text-xs muted">{t('challenges.noBaseline')}</p>}
                        {r.detail?.target !== undefined && (
                            <p className="text-xs muted">{t('challenges.saveProgress', { current: formatMoney(r.detail.current), target: formatMoney(r.detail.target) })}</p>
                        )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>{t(`challenges.status.${r.status}`)}</span>
                    {['active', 'upcoming'].includes(r.status) && (
                        <button onClick={() => setRemoving(c)} className="p-1 text-gray-300 hover:text-red-500" aria-label={t('common.delete')}><X className="w-4 h-4" /></button>
                    )}
                </div>
                {r.status === 'active' && <ProgressBar value={r.progress} color="#FF6B35" className="h-1.5 mt-3" />}
            </div>
        );
    };

    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-1"><Trophy className="w-5 h-5 text-amber-500" /> {t('challenges.title')}</h2>
            <p className="text-sm muted mb-4">{t('challenges.subtitle')}</p>

            {running.length > 0 && <div className="space-y-2 mb-5">{running.map(row)}</div>}

            <div className="grid sm:grid-cols-2 gap-2">
                {CHALLENGES.filter(c => !runningTypes.has(c.id)).map(c => {
                    const Icon = ICONS[c.icon];
                    return (
                        <button key={c.id} onClick={() => start(c.id)}
                            className="text-left rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-3.5 hover:border-primary hover:bg-primary/5 transition">
                            <p className="text-sm font-semibold flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /> {t(`challenges.list.${c.id}.title`)}</p>
                            <p className="text-xs muted mt-1">{t(`challenges.list.${c.id}.desc`)}</p>
                            <p className="text-xs text-primary font-semibold mt-2">{t('challenges.start')}</p>
                        </button>
                    );
                })}
            </div>

            {finished.length > 0 && (
                <>
                    <p className="text-sm font-medium mt-5 mb-2">{t('challenges.history')}</p>
                    <div className="space-y-2">{finished.map(row)}</div>
                </>
            )}

            <ConfirmDialog open={!!removing} message={t('challenges.removeConfirm')} confirmLabel={t('challenges.giveUp')}
                onCancel={() => setRemoving(null)}
                onConfirm={async () => { await removeChallenge(user.id, removing.id); setRemoving(null); }} />
        </div>
    );
};

export const BadgesCard = ({ badges }) => {
    const { t } = useTranslation();
    return (
        <div className="card-pad">
            <h2 className="section-title flex items-center gap-2 mb-1"><Medal className="w-5 h-5 text-violet-500" /> {t('badges.title')}</h2>
            <p className="text-sm muted mb-4">{t('badges.subtitle', { count: badges.size, total: BADGES.length })}</p>
            <div className="grid grid-cols-4 gap-3">
                {BADGES.map(b => {
                    const Icon = ICONS[b.icon] || Medal;
                    const earned = badges.has(b.id);
                    return (
                        <div key={b.id} className="text-center" title={t(`badges.list.${b.id}.desc`)}>
                            <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center relative ${earned ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600'}`}>
                                <Icon className="w-6 h-6" />
                                {!earned && <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 text-gray-400" />}
                            </div>
                            <p className={`text-[11px] leading-tight mt-1.5 ${earned ? 'font-semibold' : 'muted'}`}>{t(`badges.list.${b.id}.title`)}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
