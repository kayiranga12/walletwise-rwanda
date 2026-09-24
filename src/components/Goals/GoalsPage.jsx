import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Target, ShieldCheck } from 'lucide-react';
import { averageMonthlyNeeds, EMERGENCY_MONTHS } from '../../lib/salary';
import { useUserTable } from '../../lib/hooks';
import { formatMoney } from '../../lib/format';
import GoalCard, { AddGoalCard } from '../Dashboard/GoalCard';
import { PageHeader, Spinner, EmptyState, ProgressBar } from '../ui/bits';

// 3 months of essential spending set aside for surprises (sickness, job loss…)
const EmergencyFundCard = ({ goals, expenses }) => {
    const { t } = useTranslation();
    const avgNeeds = averageMonthlyNeeds(expenses);
    const target = avgNeeds * EMERGENCY_MONTHS;
    const fund = goals.find(g => g.is_emergency);

    return (
        <div className="card-pad mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h2 className="font-semibold">{t('goals.emergencyTitle')}</h2>
                {fund ? (
                    <>
                        <p className="text-sm muted">
                            {avgNeeds > 0
                                ? t('goals.emergencyCovered', { months: ((fund.current_amount || 0) / avgNeeds).toFixed(1), amount: formatMoney(fund.current_amount) })
                                : t('goals.saved', { amount: formatMoney(fund.current_amount) })}
                        </p>
                        {avgNeeds > 0 && <ProgressBar value={(fund.current_amount || 0) / target} color="#06b6d4" className="h-2 mt-2" />}
                    </>
                ) : (
                    <p className="text-sm muted">
                        {avgNeeds > 0 ? t('goals.emergencyRecommend', { amount: formatMoney(target), months: EMERGENCY_MONTHS }) : t('goals.emergencyNoData')}
                    </p>
                )}
            </div>
            {fund
                ? <Link to={`/goals/${fund.id}`} className="btn-secondary">{t('common.viewAll')}</Link>
                : <Link to={`/goals/new?type=emergency&target=${Math.round(target)}`} className="btn-primary"><Plus className="w-4 h-4" /> {t('goals.emergencyStart')}</Link>}
        </div>
    );
};

const GoalsPage = () => {
    const { t } = useTranslation();
    const goals = useUserTable('goals');
    const transactions = useUserTable('transactions');
    const expenses = useUserTable('expenses');

    if (!goals || !transactions || !expenses) return <Spinner />;

    const byNewest = (a, b) => (b.created_at || '').localeCompare(a.created_at || '');
    const active = goals.filter(g => !g.is_completed).sort(byNewest);
    const done = goals.filter(g => g.is_completed).sort(byNewest);
    const totalSaved = goals.reduce((s, g) => s + (g.current_amount || 0), 0);
    const totalTarget = active.reduce((s, g) => s + (g.target_amount || 0), 0);

    return (
        <div className="animate-fade-in-up">
            <PageHeader title={t('goals.title')} subtitle={t('goals.subtitle')}>
                <Link to="/goals/new" className="btn-primary"><Plus className="w-4 h-4" /> {t('goals.createGoal')}</Link>
            </PageHeader>

            <EmergencyFundCard goals={goals} expenses={expenses} />

            {goals.length === 0 ? (
                <div className="card">
                    <EmptyState icon={Target} text={t('goals.noGoals')}
                        action={<Link to="/goals/new" className="btn-primary"><Plus className="w-4 h-4" /> {t('goals.createGoal')}</Link>} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="card-pad">
                            <p className="text-sm muted">{t('dashboard.totalSavings')}</p>
                            <p className="text-xl sm:text-2xl font-bold mt-1">{formatMoney(totalSaved)}</p>
                        </div>
                        <div className="card-pad">
                            <p className="text-sm muted">{t('dashboard.activeGoals')}</p>
                            <p className="text-xl sm:text-2xl font-bold mt-1">{active.length}</p>
                            {totalTarget > 0 && <p className="text-xs muted mt-0.5">{t('goals.target', { amount: formatMoney(totalTarget) })}</p>}
                        </div>
                    </div>

                    <h2 className="section-title mb-3">{t('goals.active')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {active.map(goal => <GoalCard key={goal.id} goal={goal} transactions={transactions} />)}
                        <AddGoalCard />
                    </div>

                    {done.length > 0 && (
                        <>
                            <h2 className="section-title mt-10 mb-3">{t('goals.completed')}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {done.map(goal => <GoalCard key={goal.id} goal={goal} transactions={transactions} />)}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default GoalsPage;
