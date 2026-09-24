import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, CircleCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { getPet, getGoalColor } from '../../lib/categories';
import { goalProgress, forecastGoal } from '../../lib/goals';
import { formatMoney, formatDate } from '../../lib/format';
import { ProgressBar } from '../ui/bits';

const GoalCard = ({ goal, transactions = [] }) => {
    const { t } = useTranslation();
    const progress = goalProgress(goal);
    const color = getGoalColor(goal.color_theme).hex;
    const forecast = forecastGoal(goal, transactions);
    const daysLeft = goal.deadline ? differenceInCalendarDays(parseISO(goal.deadline), new Date()) : null;

    let status = null;
    if (goal.is_completed) status = { text: t('goals.completed'), cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' };
    else if (forecast.status === 'behind') status = { text: t('goals.statusBehind'), cls: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' };
    else if (forecast.status === 'on_track') status = { text: t('goals.statusOnTrack', { date: formatDate(forecast.eta) }), cls: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' };

    return (
        <Link to={`/goals/${goal.id}`} className="block group">
            <div className="card overflow-hidden hover:shadow-md transition-shadow h-full">
                <div className="h-1.5" style={{ backgroundColor: color }} />
                <div className="p-5">
                    <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate">{goal.name}</h3>
                            <p className="text-sm muted">{t('goals.target', { amount: formatMoney(goal.target_amount) })}</p>
                        </div>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl shrink-0 pet-avatar" style={{ backgroundColor: `${color}1f` }}>
                            {goal.is_completed ? <CircleCheck className="w-6 h-6 text-emerald-500" /> : getPet(goal.pet_avatar).icon}
                        </div>
                    </div>

                    <ProgressBar value={progress} color={color} className="h-2.5 mb-2" />

                    <div className="flex justify-between text-xs font-medium muted">
                        <span>{t('goals.saved', { amount: formatMoney(goal.current_amount) })}</span>
                        <span>{Math.round(progress * 100)}%</span>
                    </div>

                    {(status || daysLeft !== null) && (
                        <div className="flex items-center justify-between gap-2 mt-3">
                            {status ? <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${status.cls}`}>{status.text}</span> : <span />}
                            {!goal.is_completed && daysLeft !== null && (
                                <span className={`text-[11px] ${daysLeft < 0 ? 'text-red-500' : 'muted'}`}>
                                    {daysLeft < 0 ? t('goals.overdue') : t('goals.daysLeft', { count: daysLeft })}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export const AddGoalCard = () => {
    const { t } = useTranslation();
    return (
        <Link to="/goals/new" className="block h-full min-h-[10rem]">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl h-full flex flex-col items-center justify-center p-6 text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">{t('goals.createGoal')}</span>
            </div>
        </Link>
    );
};

export default GoalCard;
