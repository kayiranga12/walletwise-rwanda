import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import useStore from '../../store/useStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Wallet, ShoppingBag, PiggyBank } from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Red for Needs, Yellow for Wants, Green for Savings
const CATEGORIES = [
    { id: 'Needs', label: 'Needs (50%)', icon: Wallet, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'Wants', label: 'Wants (30%)', icon: ShoppingBag, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { id: 'Savings', label: 'Savings/Debt (20%)', icon: PiggyBank, color: 'text-green-500', bg: 'bg-green-100' }
];

const BudgetDashboard = () => {
    const { user } = useStore();
    const [incomeData, setIncomeData] = useState({ amount: '' });
    const [expenseData, setExpenseData] = useState({ amount: '', category: 'Needs', description: '' });

    // Fetch incomes and expenses for the current user
    const incomes = useLiveQuery(
        () => db.incomes.where('user_id').equals(user?.id || '').toArray(),
        [user?.id]
    ) || [];

    const expenses = useLiveQuery(
        () => db.expenses.where('user_id').equals(user?.id || '').toArray(),
        [user?.id]
    ) || [];

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    
    // Allocations based on 50/30/20 rule
    const allocated = {
        Needs: totalIncome * 0.5,
        Wants: totalIncome * 0.3,
        Savings: totalIncome * 0.2
    };

    // Calculate spent per category
    const spent = { Needs: 0, Wants: 0, Savings: 0 };
    expenses.forEach(ex => {
        if (spent[ex.category] !== undefined) {
            spent[ex.category] += Number(ex.amount);
        }
    });

    const handleAddIncome = async (e) => {
        e.preventDefault();
        if (!incomeData.amount || Number(incomeData.amount) <= 0) return;
        
        await db.incomes.add({
            id: uuidv4(),
            user_id: user.id,
            amount: Number(incomeData.amount),
            date: new Date().toISOString(),
            synced: true,
            created_at: new Date().toISOString()
        });
        setIncomeData({ amount: '' });
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseData.amount || Number(expenseData.amount) <= 0) return;

        await db.expenses.add({
            id: uuidv4(),
            user_id: user.id,
            amount: Number(expenseData.amount),
            category: expenseData.category,
            description: expenseData.description,
            date: new Date().toISOString(),
            synced: true,
            created_at: new Date().toISOString()
        });
        setExpenseData({ ...expenseData, amount: '', description: '' });
    };

    const pieData = [
        { name: 'Needs Spent', value: spent.Needs },
        { name: 'Wants Spent', value: spent.Wants },
        { name: 'Savings Spent', value: spent.Savings }
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center bg-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                <div>
                    <h2 className="text-2xl font-bold">50/30/20 Budgeting</h2>
                    <p className="text-indigo-200">Automatically guide your finances.</p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <p className="text-sm text-indigo-200 uppercase tracking-wide">Total Income</p>
                    <p className="text-3xl font-bold">{totalIncome.toLocaleString()} RWF</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Forms Section */}
                <div className="space-y-6">
                    {/* Add Income Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-indigo-600" />
                            Add Income
                        </h3>
                        <form onSubmit={handleAddIncome} className="flex gap-4">
                            <input
                                type="number"
                                placeholder="Amount (RWF)"
                                value={incomeData.amount}
                                onChange={(e) => setIncomeData({ amount: e.target.value })}
                                className="flex-1 w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                required
                            />
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-md">
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Add Expense Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-rose-500" />
                            Add Expense
                        </h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <input
                                    type="number"
                                    placeholder="Amount (RWF)"
                                    value={expenseData.amount}
                                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                    required
                                />
                                <select 
                                    value={expenseData.category}
                                    onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none bg-white transition-all"
                                >
                                    <option value="Needs">Needs (50%)</option>
                                    <option value="Wants">Wants (30%)</option>
                                    <option value="Savings">Savings (20%)</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Description (e.g., Groceries)"
                                value={expenseData.description}
                                onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                required
                            />
                            <button type="submit" className="w-full bg-rose-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-rose-600 transition shadow-md">
                                Record Expense
                            </button>
                        </form>
                    </div>
                </div>

                {/* Dashboard & Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Breakdown</h3>
                    
                    <div className="h-48 w-full mb-6 relative">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[CATEGORIES.findIndex(c => c.id === entry.name.split(' ')[0])]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value.toLocaleString()} RWF`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                No expenses yet. Start tracking!
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 flex-1">
                        {CATEGORIES.map(cat => {
                            const { id, label, icon: Icon, color, bg } = cat;
                            const budgetLimit = allocated[id] || 0;
                            const currentSpent = spent[id] || 0;
                            const percentSpent = budgetLimit > 0 ? Math.min((currentSpent / budgetLimit) * 100, 100) : 0;
                            const isOverBudget = currentSpent > budgetLimit && budgetLimit > 0;

                            return (
                                <div key={id} className={`p-4 rounded-xl border ${isOverBudget ? 'border-red-300 bg-red-50' : 'border-gray-50' } shadow-sm hover:shadow-md transition-all`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{label}</p>
                                                <p className="text-xs text-gray-500">Budget: {budgetLimit.toLocaleString()} RWF</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>{currentSpent.toLocaleString()} RWF</p>
                                            <p className="text-xs text-gray-500">Spent</p>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : cat.color.replace('text', 'bg')}`} 
                                            style={{ width: `${percentSpent}%` }} 
                                        />
                                    </div>
                                    {isOverBudget && (
                                        <p className="text-xs text-red-500 mt-2 font-medium bg-red-100 p-1 px-2 rounded-md inline-block">Over budget limits!</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetDashboard;
