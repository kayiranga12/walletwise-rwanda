import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, Plus, ArrowLeftRight } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable } from '../../lib/hooks';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SOURCES } from '../../lib/categories';
import { monthKey, entryMonth, entryDay, formatMoney, formatDate } from '../../lib/format';
import { toCSV, downloadFile } from '../../lib/csv';
import MonthPicker from '../ui/MonthPicker';
import EntryRow from './EntryRow';
import { PageHeader, Spinner, EmptyState } from '../ui/bits';

const MoneyPage = () => {
    const { t } = useTranslation();
    const openQuickAdd = useStore(s => s.openQuickAdd);
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');

    const [month, setMonth] = useState(monthKey());
    const [kind, setKind] = useState('all');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [source, setSource] = useState('');

    const entries = useMemo(() => {
        if (!incomes || !expenses) return null;
        const all = [
            ...incomes.map(e => ({ ...e, kind: 'income' })),
            ...expenses.map(e => ({ ...e, kind: 'expense' })),
        ].filter(e => entryMonth(e) === month);

        const q = search.trim().toLowerCase();
        return all
            .filter(e => kind === 'all' || e.kind === kind)
            .filter(e => !category || e.category === category)
            .filter(e => !source || e.source === source)
            .filter(e => !q || [e.description, t(`categories.${e.category}`), t(`sources.${e.source}`), String(e.amount)]
                .some(s => (s || '').toLowerCase().includes(q)))
            .sort((a, b) => entryDay(b).localeCompare(entryDay(a)) || (b.created_at || '').localeCompare(a.created_at || ''));
    }, [incomes, expenses, month, kind, search, category, source, t]);

    if (!entries) return <Spinner />;

    const totalIn = entries.filter(e => e.kind === 'income').reduce((s, e) => s + Number(e.amount), 0);
    const totalOut = entries.filter(e => e.kind === 'expense').reduce((s, e) => s + Number(e.amount), 0);

    // Group by day, newest first
    const days = [];
    for (const e of entries) {
        const d = entryDay(e);
        if (days.length === 0 || days[days.length - 1].day !== d) days.push({ day: d, items: [] });
        days[days.length - 1].items.push(e);
    }

    const categoryOptions = kind === 'income' ? INCOME_CATEGORIES : kind === 'expense' ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES.filter(c => c.id !== 'other')];

    const exportCsv = () => {
        const csv = toCSV(entries, [
            { key: e => entryDay(e), label: t('common.date') },
            { key: e => t(e.kind === 'income' ? 'money.income' : 'money.expense'), label: 'Type' },
            { key: e => t(`categories.${e.category}`), label: t('common.category') },
            { key: e => (e.bucket ? t(`buckets.${e.bucket}`) : ''), label: t('money.bucket') },
            { key: e => t(`sources.${e.source}`), label: t('common.source') },
            { key: 'description', label: t('common.note') },
            { key: e => (e.kind === 'income' ? e.amount : -e.amount), label: 'Amount (RWF)' },
        ]);
        downloadFile(`walletwise-${month}.csv`, csv);
    };

    const tabCls = (k) => `px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${kind === k ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`;

    return (
        <div className="animate-fade-in-up">
            <PageHeader title={t('money.title')} subtitle={t('money.subtitle')}>
                <MonthPicker value={month} onChange={setMonth} />
            </PageHeader>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
                <div className="card p-4">
                    <p className="text-xs muted">{t('money.incomes')}</p>
                    <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatMoney(totalIn)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs muted">{t('money.expenses')}</p>
                    <p className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatMoney(totalOut)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs muted">{t('money.net')}</p>
                    <p className={`text-base sm:text-xl font-bold mt-0.5 ${totalIn - totalOut < 0 ? 'text-rose-600' : ''}`}>{formatMoney(totalIn - totalOut)}</p>
                </div>
            </div>

            <div className="card p-3 sm:p-4 mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800 self-start">
                        <button className={tabCls('all')} onClick={() => { setKind('all'); setCategory(''); }}>{t('common.all')}</button>
                        <button className={tabCls('income')} onClick={() => { setKind('income'); setCategory(''); }}>{t('money.incomes')}</button>
                        <button className={tabCls('expense')} onClick={() => { setKind('expense'); setCategory(''); }}>{t('money.expenses')}</button>
                    </div>
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={t('money.searchPlaceholder')} className="input pl-9" aria-label={t('common.search')} />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select value={category} onChange={e => setCategory(e.target.value)} className="input w-auto py-1.5" aria-label={t('common.category')}>
                        <option value="">{t('common.category')}: {t('common.all')}</option>
                        {categoryOptions.map(c => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
                    </select>
                    <select value={source} onChange={e => setSource(e.target.value)} className="input w-auto py-1.5" aria-label={t('common.source')}>
                        <option value="">{t('common.source')}: {t('common.all')}</option>
                        {SOURCES.map(s => <option key={s.id} value={s.id}>{t(`sources.${s.id}`)}</option>)}
                    </select>
                    <div className="flex-1" />
                    <button onClick={exportCsv} disabled={entries.length === 0} className="btn-secondary py-1.5">
                        <Download className="w-4 h-4" /> {t('common.exportCsv')}
                    </button>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="card">
                    <EmptyState
                        icon={ArrowLeftRight}
                        text={search || category || source ? t('money.noMatch') : t('money.empty')}
                        action={<button className="btn-primary" onClick={() => openQuickAdd('expense')}><Plus className="w-4 h-4" /> {t('money.addExpense')}</button>}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-xs muted px-1">{t('money.entries', { count: entries.length })}</p>
                    {days.map(({ day, items }) => {
                        const dayNet = items.reduce((s, e) => s + (e.kind === 'income' ? 1 : -1) * Number(e.amount), 0);
                        return (
                            <div key={day} className="card overflow-hidden">
                                <div className="flex justify-between px-4 sm:px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold muted">
                                    <span>{formatDate(day)}</span>
                                    <span>{dayNet >= 0 ? '+' : '−'}{formatMoney(Math.abs(dayNet))}</span>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {items.map(e => (
                                        <EntryRow key={e.id} entry={e} kind={e.kind} showDate={false} onClick={() => openQuickAdd(e.kind, e)} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MoneyPage;
