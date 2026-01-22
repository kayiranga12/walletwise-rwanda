import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToSyncQueue } from '../../lib/db';
import { ArrowLeft, Trash2, Plus, Minus, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const GoalDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const goal = useLiveQuery(() => db.goals.get(id), [id]);
    const transactions = useLiveQuery(
        () => db.transactions.where('goal_id').equals(id).reverse().toArray(),
        [id]
    );

    if (!goal) return <div className="p-4">Loading goal...</div>;

    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this goal?')) {
            await db.goals.delete(id);
            await addToSyncQueue('goals', 'DELETE', { id });
            navigate('/');
        }
    };

    const handleTransaction = async (type) => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;

        const txAmount = parseFloat(amount);
        const newAmount = type === 'deposit'
            ? goal.current_amount + txAmount
            : goal.current_amount - txAmount;

        // Prevent negative balance
        if (newAmount < 0) {
            alert("You cannot withdraw more than you have saved!");
            return;
        }

        const transaction = {
            id: crypto.randomUUID(),
            goal_id: id,
            amount: txAmount,
            type,
            note,
            transaction_date: new Date().toISOString(),
            synced: false,
            created_at: new Date().toISOString()
        };

        // Update Goal
        await db.goals.update(id, { current_amount: newAmount });
        await addToSyncQueue('goals', 'UPDATE', { id, current_amount: newAmount });

        // Add Transaction
        await db.transactions.add(transaction);
        await addToSyncQueue('transactions', 'INSERT', transaction);

        setAmount('');
        setNote('');
    };

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </button>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className={`h-4 bg-${goal.color_theme}-500 bg-primary`}></div> {/* Fallback color logic handled in Dashboard used here similarly if mapped */}
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{goal.name}</h1>
                            <p className="text-gray-500">Target: {goal.target_amount.toLocaleString()} RWF</p>
                            {goal.deadline && (
                                <p className="text-sm text-gray-400 mt-1">Deadline: {format(new Date(goal.deadline), 'PPP')}</p>
                            )}
                        </div>
                        <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-2">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-8 mb-4">
                        <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-4">
                            <div
                                className="h-4 rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center py-8">
                        {/* Pet Animation Placeholder */}
                        <div className="text-6xl animate-bounce-short">
                            {/* Map pet ID to emoji or image */}
                            🦁
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Transaction</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="number"
                        placeholder="Amount (RWF)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="Note (Optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                </div>
                <div className="flex space-x-4 mt-4">
                    <button
                        onClick={() => handleTransaction('deposit')}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md font-medium hover:bg-green-600 flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Deposit
                    </button>
                    <button
                        onClick={() => handleTransaction('withdrawal')}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:bg-red-600 flex items-center justify-center"
                    >
                        <Minus className="w-4 h-4 mr-2" /> Withdraw
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">History</h3>
                <div className="space-y-4">
                    {transactions?.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <div>
                                <p className="font-medium text-gray-900">{tx.note || (tx.type === 'deposit' ? 'Deposit' : 'Withdrawal')}</p>
                                <p className="text-xs text-gray-500">{format(new Date(tx.created_at), 'PP p')}</p>
                            </div>
                            <span className={`font-bold ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {transactions?.length === 0 && <p className="text-gray-400 text-center py-4">No transactions yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default GoalDetail;
