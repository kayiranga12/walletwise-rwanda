import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable } from '../../lib/hooks';
import { createRecord, updateRecord, deleteRecord } from '../../lib/repo';
import { recordNetWorthSnapshot } from '../../lib/networth';
import { ASSET_TYPES, LIABILITY_TYPES, getAssetType, getLiabilityType } from '../../lib/categories';
import { formatMoney, formatCompact, formatDate } from '../../lib/format';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { PageHeader, Spinner, CategoryIcon } from '../ui/bits';

// Add or edit one asset/liability. `item` is { table, row? }
const ItemEditor = ({ item, onClose }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const isAsset = item.table === 'assets';
    const types = isAsset ? ASSET_TYPES : LIABILITY_TYPES;
    const [form, setForm] = useState({
        name: item.row?.name || '',
        type: item.row?.type || types[0].id,
        amount: item.row ? String(item.row.amount) : '',
    });
    const [confirm, setConfirm] = useState(false);

    const save = async (e) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!form.name.trim() || !(amount >= 0)) return;
        const fields = { name: form.name.trim(), type: form.type, amount };
        if (item.row) await updateRecord(item.table, item.row.id, fields);
        else await createRecord(item.table, user.id, fields);
        await recordNetWorthSnapshot(user.id);
        toast(t('common.saved'));
        onClose();
    };

    const remove = async () => {
        await deleteRecord(item.table, item.row.id);
        await recordNetWorthSnapshot(user.id);
        toast(t('common.deleted'));
        onClose();
    };

    const title = item.row
        ? t(isAsset ? 'netWorth.editAsset' : 'netWorth.editLiability')
        : t(isAsset ? 'netWorth.addAsset' : 'netWorth.addLiability');

    return (
        <>
            <Modal open onClose={onClose} title={title}>
                <form onSubmit={save} className="space-y-5">
                    <div>
                        <label className="label" htmlFor="nw-name">{t('netWorth.name')}</label>
                        <input id="nw-name" className="input" required maxLength={60} autoFocus value={form.name}
                            placeholder={t(isAsset ? 'netWorth.assetPlaceholder' : 'netWorth.liabilityPlaceholder')}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div>
                        <span className="label">{t('netWorth.type')}</span>
                        <div className="flex flex-wrap gap-2">
                            {types.map(({ id, icon: Icon }) => (
                                <button key={id} type="button" onClick={() => setForm(f => ({ ...f, type: id }))}
                                    className={`chip ${form.type === id ? 'chip-active' : ''}`}>
                                    <Icon className="w-3.5 h-3.5" /> {t(`netWorth.types.${id}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="label" htmlFor="nw-amount">{t(isAsset ? 'netWorth.value' : 'netWorth.owed')}</label>
                        <input id="nw-amount" type="number" inputMode="numeric" min="0" required className="input text-lg font-semibold"
                            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="flex gap-3">
                        {item.row && (
                            <button type="button" className="btn-ghost text-red-500" onClick={() => setConfirm(true)} aria-label={t('common.delete')}>
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button type="button" className="btn-secondary flex-1" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary flex-1">{t('common.save')}</button>
                    </div>
                </form>
            </Modal>
            <ConfirmDialog open={confirm} onConfirm={remove} onCancel={() => setConfirm(false)} />
        </>
    );
};

const ItemList = ({ title, rows, total, table, getType, tone, emptyText, onOpen }) => {
    const { t } = useTranslation();
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                    <h3 className="section-title">{title}</h3>
                    <p className={`text-sm font-semibold ${tone}`}>{formatMoney(total)}</p>
                </div>
                <button className="btn-secondary py-2" onClick={() => onOpen({ table })}><Plus className="w-4 h-4" /> {t('common.add')}</button>
            </div>
            {rows.length === 0 ? <p className="muted text-sm px-5 pb-5">{emptyText}</p> : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...rows].sort((a, b) => b.amount - a.amount).map(row => {
                        const type = getType(row.type);
                        return (
                            <button key={row.id} onClick={() => onOpen({ table, row })} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <CategoryIcon icon={type.icon} color={table === 'assets' ? '#10b981' : '#ef4444'} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{row.name}</p>
                                    <p className="text-xs muted">{t(`netWorth.types.${type.id}`)}</p>
                                </div>
                                <span className={`text-sm font-semibold ${tone}`}>{formatMoney(row.amount)}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const NetWorthDashboard = () => {
    const { t } = useTranslation();
    const assets = useUserTable('assets');
    const liabilities = useUserTable('liabilities');
    const history = useUserTable('netWorthHistory');
    const goals = useUserTable('goals');
    const [editing, setEditing] = useState(null);

    if (!assets || !liabilities || !history || !goals) return <Spinner />;

    const total = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalAssets = total(assets);
    const totalLiabilities = total(liabilities);
    const netWorth = totalAssets - totalLiabilities;
    const goalSavings = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

    const chartData = [...history].sort((a, b) => a.date.localeCompare(b.date))
        .map(h => ({ ...h, label: formatDate(h.date, { withYear: false }) }));
    const first = chartData[0];
    const change = chartData.length > 1 ? netWorth - first.net_worth : null;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader title={t('netWorth.title')} subtitle={t('netWorth.subtitle')} />

            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 sm:p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <TrendingUp className="absolute -top-8 -right-8 w-56 h-56 opacity-10" />
                <div className="relative flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div>
                        <p className="text-emerald-100 font-medium">{t('netWorth.total')}</p>
                        <p className="text-4xl sm:text-5xl font-extrabold mt-1">{formatMoney(netWorth)}</p>
                        {change !== null && (
                            <p className="mt-3 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                                {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {t('netWorth.change', { amount: `${change >= 0 ? '+' : '−'}${formatMoney(Math.abs(change))}`, date: formatDate(first.date) })}
                            </p>
                        )}
                        {goalSavings > 0 && <p className="text-emerald-100 text-sm mt-2">{t('netWorth.goalSavings', { amount: formatMoney(goalSavings) })}</p>}
                    </div>
                    <div className="flex bg-white/10 rounded-xl p-4 gap-6 border border-white/20">
                        <div>
                            <p className="text-emerald-100 text-sm">{t('netWorth.assets')}</p>
                            <p className="text-lg font-bold">{formatMoney(totalAssets)}</p>
                        </div>
                        <div className="w-px bg-white/30" />
                        <div>
                            <p className="text-emerald-100 text-sm">{t('netWorth.liabilities')}</p>
                            <p className="text-lg font-bold">{formatMoney(totalLiabilities)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-pad">
                <h3 className="section-title mb-4">{t('netWorth.growth')}</h3>
                <div className="h-64">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#9ca3af33" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={formatCompact} width={48} />
                                <Tooltip formatter={(v) => [formatMoney(v), t('netWorth.total')]} contentStyle={{ borderRadius: 12, border: 'none' }} />
                                <Area type="monotone" dataKey="net_worth" stroke="#10b981" strokeWidth={3} fill="url(#nwFill)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center muted text-sm">
                            <TrendingUp className="w-10 h-10 mb-2 text-gray-300" />
                            {t('netWorth.chartEmpty')}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <ItemList title={t('netWorth.assets')} rows={assets} total={totalAssets} table="assets" getType={getAssetType}
                    tone="text-emerald-600 dark:text-emerald-400" emptyText={t('netWorth.noAssets')} onOpen={setEditing} />
                <ItemList title={t('netWorth.liabilities')} rows={liabilities} total={totalLiabilities} table="liabilities" getType={getLiabilityType}
                    tone="text-rose-600 dark:text-rose-400" emptyText={t('netWorth.noLiabilities')} onOpen={setEditing} />
            </div>

            {editing && <ItemEditor item={editing} onClose={() => setEditing(null)} />}
        </div>
    );
};

export default NetWorthDashboard;
