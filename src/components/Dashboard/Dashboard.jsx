import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import useStore from '../../store/useStore';
import StatsOverview from './StatsOverview';
import GoalCard, { AddGoalCard } from './GoalCard';
import RecentActivity from './RecentActivity';
import BudgetDashboard from '../Budget/BudgetDashboard';
import NetWorthDashboard from '../NetWorth/NetWorthDashboard';

const Dashboard = () => {
    const { user } = useStore();
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch Goals from Dexie (reactive)
    const goals = useLiveQuery(
        () => db.goals.where('user_id').equals(user?.id || '').toArray(),
        [user?.id]
    );

    // Fetch Recent Transactions
    const transactions = useLiveQuery(async () => {
        if (!user?.id) return [];
        // Join transactions with goals to get goal names
        // This is a bit complex in Dexie without relational support, so we do it manually or assume standard fetch
        // For prototype: fetch all transactions for user's goals
        const userGoals = await db.goals.where('user_id').equals(user.id).keys();
        if (userGoals.length === 0) return [];
        const txs = await db.transactions.where('goal_id').anyOf(userGoals).reverse().limit(5).toArray();

        // Enrich with goal name
        const enrichedTxs = await Promise.all(txs.map(async (tx) => {
            const goal = await db.goals.get(tx.goal_id);
            return { ...tx, goalName: goal?.name };
        }));

        return enrichedTxs;
    }, [user?.id]);

    if (!goals) return <div>Loading dashboard...</div>;

    const totalSavings = goals.reduce((acc, goal) => acc + (goal.current_amount || 0), 0);
    const activeGoalsCount = goals.filter(g => !g.is_completed).length;

    return (
        <div className="py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Mwaramutse, {user?.user_metadata?.username || 'Saver'}! 👋
                    </h1>
                    <p className="text-gray-500">Here's what's happening with your finances.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >Overview</button>
                <button 
                    onClick={() => setActiveTab('budget')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'budget' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >50/30/20 Budget</button>
                <button 
                    onClick={() => setActiveTab('networth')}
                    className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${activeTab === 'networth' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >Net Worth Tracking</button>
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in-up">
                    <StatsOverview totalSavings={totalSavings} activeGoalsCount={activeGoalsCount} />

                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Your Goals</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AddGoalCard />
                            {goals.map(goal => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    </div>

                    <RecentActivity transactions={transactions} />
                </div>
            )}

            {activeTab === 'budget' && <BudgetDashboard />}
            {activeTab === 'networth' && <NetWorthDashboard />}
        </div>
    );
};

export default Dashboard;
