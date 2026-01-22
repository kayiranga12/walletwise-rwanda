import React from 'react';
import { PiggyBank, Target, TrendingUp } from 'lucide-react';

const StatsOverview = ({ totalSavings = 0, activeGoalsCount = 0 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mr-4">
                    <PiggyBank className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Savings</p>
                    <p className="text-2xl font-bold text-gray-900">{totalSavings.toLocaleString()} RWF</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="p-3 rounded-full bg-secondary/10 text-secondary mr-4">
                    <Target className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Active Goals</p>
                    <p className="text-2xl font-bold text-gray-900">{activeGoalsCount}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="p-3 rounded-full bg-success/10 text-success mr-4">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Monthly Savings</p>
                    <p className="text-2xl font-bold text-gray-900">0 RWF</p> {/* Placeholder for now */}
                </div>
            </div>
        </div>
    );
};

export default StatsOverview;
