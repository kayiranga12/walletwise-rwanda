import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Target } from 'lucide-react';
import { useUserTable } from '../../lib/hooks';
import { formatMoney } from '../../lib/format';
import GoalCard, { AddGoalCard } from '../Dashboard/GoalCard';
import { PageHeader, Spinner, EmptyState } from '../ui/bits';

const GoalsPage = () => {
    const { t } = useTranslation();
    const goals = useUserTable('goals');
    const transactions = useUserTable('transactions');

    if (!goals || !transactions) return <Spinner />;

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
