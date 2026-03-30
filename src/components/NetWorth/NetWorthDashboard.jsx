import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import useStore from '../../store/useStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { TrendingUp, Building2, CreditCard, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const EMPTY_ARRAY = [];

const NetWorthDashboard = () => {
    const { user } = useStore();
    const [assetData, setAssetData] = useState({ name: '', type: 'Cash', amount: '' });
    const [liabilityData, setLiabilityData] = useState({ name: '', type: 'Loan', amount: '' });

    // Fetch assets and liabilities
    const assetsData = useLiveQuery(
        () => db.assets.where('user_id').equals(user?.id || '').toArray(),
        [user?.id]
    );
    const assets = assetsData || EMPTY_ARRAY;

    const liabilitiesData = useLiveQuery(
        () => db.liabilities.where('user_id').equals(user?.id || '').toArray(),
        [user?.id]
    );
    const liabilities = liabilitiesData || EMPTY_ARRAY;

    const netWorthHistoryData = useLiveQuery(
        () => db.netWorthHistory.where('user_id').equals(user?.id || '').sortBy('date'),
        [user?.id]
    );
    const netWorthHistory = netWorthHistoryData || EMPTY_ARRAY;

    const totalAssets = assets.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + Number(item.amount), 0);
    const netWorth = totalAssets - totalLiabilities;

    // Track when Net Worth changes significantly
    const saveNetWorthSnapshot = async (newNetWorth) => {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Check if there's already a snapshot today
        const existing = await db.netWorthHistory.where({ user_id: user.id, date: today }).first();
        
        if (existing) {
            await db.netWorthHistory.update(existing.id, { net_worth: newNetWorth });
        } else {
            await db.netWorthHistory.add({
                id: uuidv4(),
                user_id: user.id,
                date: today,
                net_worth: newNetWorth
            });
        }
    };

    const handleAddAsset = async (e) => {
        e.preventDefault();
        if (!assetData.amount || !assetData.name) return;
        
        await db.assets.add({
            id: uuidv4(),
            user_id: user.id,
            name: assetData.name,
            type: assetData.type,
            amount: Number(assetData.amount),
            synced: true,
            created_at: new Date().toISOString()
        });
        setAssetData({ name: '', type: 'Cash', amount: '' });
        await saveNetWorthSnapshot(totalAssets + Number(assetData.amount) - totalLiabilities);
    };

    const handleAddLiability = async (e) => {
        e.preventDefault();
        if (!liabilityData.amount || !liabilityData.name) return;

        await db.liabilities.add({
            id: uuidv4(),
            user_id: user.id,
            name: liabilityData.name,
            type: liabilityData.type,
            amount: Number(liabilityData.amount),
            synced: true,
            created_at: new Date().toISOString()
        });
        setLiabilityData({ name: '', type: 'Loan', amount: '' });
        await saveNetWorthSnapshot(totalAssets - (totalLiabilities + Number(liabilityData.amount)));
    };

    // Calculate growth
    const growth = useMemo(() => {
        if (netWorthHistory.length < 2) return 0;
        const current = netWorthHistory[netWorthHistory.length - 1].net_worth;
        const previous = netWorthHistory[netWorthHistory.length - 2].net_worth;
        return current - previous;
    }, [netWorthHistory]);

    // Format chart date
    const chartData = netWorthHistory.map(h => ({
        ...h,
        displayDate: format(new Date(h.date), 'MMM d')
    }));

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Net Worth Summary */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute opacity-10 top-0 right-0 -m-10">
                    <TrendingUp className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-xl font-medium text-emerald-100 mb-1">Total Net Worth</h2>
                        <div className="text-5xl font-extrabold flex items-center gap-2">
                            {netWorth.toLocaleString()} <span className="text-2xl font-medium">RWF</span>
                        </div>
                        {netWorthHistory.length > 1 && (
                            <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                {growth >= 0 ? '+' : ''}{growth.toLocaleString()} RWF {growth >= 0 ? 'increase' : 'decrease'} this period
                            </div>
                        )}
                    </div>
                    
                    <div className="flex bg-white/10 rounded-xl p-4 gap-8 backdrop-blur-md border border-white/20">
                        <div>
                            <p className="text-emerald-200 text-sm font-medium mb-1">Assets</p>
                            <p className="text-xl font-bold">{totalAssets.toLocaleString()} RWF</p>
                        </div>
                        <div className="w-px bg-white/30"></div>
                        <div>
                            <p className="text-emerald-200 text-sm font-medium mb-1">Liabilities</p>
                            <p className="text-xl font-bold">{totalLiabilities.toLocaleString()} RWF</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tracker Forms */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Assets Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Building2 className="w-5 h-5"/></div>
                            <h3 className="text-lg font-semibold text-gray-900">Add Asset</h3>
                        </div>
                        <form onSubmit={handleAddAsset} className="space-y-4">
                            <input
                                type="text"
                                placeholder="E.g. Mobile Money, Bike"
                                value={assetData.name}
                                onChange={(e) => setAssetData({ ...assetData, name: e.target.value })}
                                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                                required
                            />
                            <div className="flex gap-4">
                                <select 
                                    value={assetData.type}
                                    onChange={(e) => setAssetData({ ...assetData, type: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 bg-white"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Savings">Savings</option>
                                    <option value="Investments">Investments</option>
                                    <option value="Property">Property</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={assetData.amount}
                                    onChange={(e) => setAssetData({ ...assetData, amount: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                                Save Asset <ArrowRight className="w-4 h-4"/>
                            </button>
                        </form>
                    </div>

                    {/* Liabilities Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600"><CreditCard className="w-5 h-5"/></div>
                            <h3 className="text-lg font-semibold text-gray-900">Add Liability</h3>
                        </div>
                        <form onSubmit={handleAddLiability} className="space-y-4">
                            <input
                                type="text"
                                placeholder="E.g. Bank Loan, Debt"
                                value={liabilityData.name}
                                onChange={(e) => setLiabilityData({ ...liabilityData, name: e.target.value })}
                                className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                                required
                            />
                            <div className="flex gap-4">
                                <select 
                                    value={liabilityData.type}
                                    onChange={(e) => setLiabilityData({ ...liabilityData, type: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 bg-white"
                                >
                                    <option value="Loan">Loan</option>
                                    <option value="Credit">Credit Card</option>
                                    <option value="Personal">Personal Debt</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={liabilityData.amount}
                                    onChange={(e) => setLiabilityData({ ...liabilityData, amount: e.target.value })}
                                    className="flex-1 rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition flex items-center justify-center gap-2">
                                Save Liability <ArrowRight className="w-4 h-4"/>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Net Worth Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex justify-between items-center">
                        Growth Over Time
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Automated snapshots</span>
                    </h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="displayDate" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`${value} RWF`, 'Net Worth']}
                                        labelStyle={{ color: '#374151' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="net_worth" 
                                        stroke="#10b981" 
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <TrendingUp className="w-12 h-12 mb-3 text-gray-200" />
                                <p>Add your first asset or liability to see the chart.</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Assets vs Liability List preview */}
                    <div className="mt-8 grid grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 border-b pb-2">Your Assets</h4>
                            {assets.length === 0 ? <p className="text-sm text-gray-400">No assets yet</p> : null}
                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {assets.map(a => (
                                    <li key={a.id} className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{a.name}</span>
                                        <span className="text-emerald-600">{a.amount.toLocaleString()} RWF</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 border-b pb-2">Your Liabilities</h4>
                            {liabilities.length === 0 ? <p className="text-sm text-gray-400">No liabilities yet</p> : null}
                            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {liabilities.map(l => (
                                    <li key={l.id} className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{l.name}</span>
                                        <span className="text-red-500">{l.amount.toLocaleString()} RWF</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NetWorthDashboard;
