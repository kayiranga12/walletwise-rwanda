import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

const RecentActivity = ({ transactions = [] }) => {
    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-500">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            </div>
            <ul className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                    <li key={tx.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-4 ${tx.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {tx.type === 'deposit' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{tx.goalName || 'Savings Goal'}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(tx.created_at), 'PPP')}</p>
                                </div>
                            </div>
                            <span className={`text-sm font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()} RWF
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RecentActivity;
