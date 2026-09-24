import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Repeat, Pause, Play, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { useUserTable } from '../../lib/hooks';
import { createRecord, updateRecord, deleteRecord } from '../../lib/repo';
import { runRecurring } from '../../lib/recurring';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SOURCES, BUCKETS, getExpenseCategory, getIncomeCategory } from '../../lib/categories';
import { formatMoney, monthKey } from '../../lib/format';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { PageHeader, Spinner, EmptyState, CategoryIcon } from '../ui/bits';

const RuleEditor = ({ rule, onClose }) => {
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const [form, setForm] = useState({
        kind: rule?.kind || 'income',
        amount: rule ? String(rule.amount) : '',
        category: rule?.category || 'salary',
        bucket: rule?.bucket || 'Needs',
        source: rule?.source || 'bank',
        description: rule?.description || '',
        day_of_month: rule?.day_of_month || 1,
    });
    const [confirm, setConfirm] = useState(false);
    const set = (patch) => setForm(f => ({ ...f, ...patch }));
    const categories = form.kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const save = async (e) => {
        e.preventDefault();
        const amount = Number(form.amount);
        if (!amount || amount <= 0) return;
        const fields = {
            kind: form.kind, amount, category: form.category, source: form.source,
            description: form.description.trim(), day_of_month: Number(form.day_of_month),
            ...(form.kind === 'expense' ? { bucket: form.bucket } : {}),
        };
        if (rule) {
            await updateRecord('recurring', rule.id, fields);
        } else {
            // Starts this month; if the day has already passed it is added right away
            await createRecord('recurring', user.id, { ...fields, start_month: monthKey(), last_generated: null, active: true });
        }
        await runRecurring(user.id);
        toast(t('recurring.created'));
        onClose();
    };

    const remove = async () => {
        await deleteRecord('recurring', rule.id);
        toast(t('common.deleted'));
        onClose();
    };

    return (
        <>
            <Modal open onClose={onClose} title={rule ? t('recurring.edit') : t('recurring.add')}>
                <form onSubmit={save} className="space-y-5">
                    {!rule && (
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
                            {['income', 'expense'].map(k => (
                                <button key={k} type="button"
                                    onClick={() => set({ kind: k, category: k === 'income' ? 'salary' : 'rent', bucket: 'Needs' })}
                                    className={`py-2 rounded-lg text-sm font-semibold ${form.kind === k ? 'bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-500'}`}>
                                    {t(k === 'income' ? 'money.income' : 'money.expense')}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label" htmlFor="rule-amount">{t('common.amount')}</label>
                            <input id="rule-amount" type="number" inputMode="numeric" min="1" required className="input font-semibold"
                                value={form.amount} onChange={e => set({ amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label" htmlFor="rule-day">{t('recurring.dayOfMonth')}</label>
                            <select id="rule-day" className="input" value={form.day_of_month} onChange={e => set({ day_of_month: e.target.value })}>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label" htmlFor="rule-cat">{t('common.category')}</label>
                        <select id="rule-cat" className="input" value={form.category}
                            onChange={e => set({ category: e.target.value, ...(form.kind === 'expense' ? { bucket: getExpenseCategory(e.target.value).bucket } : {}) })}>
                            {categories.map(c => <option key={c.id} value={c.id}>{t(`categories.${c.id}`)}</option>)}
                        </select>
                    </div>
                    {form.kind === 'expense' && (
                        <div>
                            <label className="label" htmlFor="rule-bucket">{t('money.bucket')}</label>
                            <select id="rule-bucket" className="input" value={form.bucket} onChange={e => set({ bucket: e.target.value })}>
                                {BUCKETS.map(b => <option key={b.id} value={b.id}>{t(`buckets.${b.id}`)}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="label" htmlFor="rule-source">{t(form.kind === 'income' ? 'common.receivedVia' : 'common.source')}</label>
                        <select id="rule-source" className="input" value={form.source} onChange={e => set({ source: e.target.value })}>
                            {SOURCES.map(s => <option key={s.id} value={s.id}>{t(`sources.${s.id}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label" htmlFor="rule-note">{t('common.note')}</label>
                        <input id="rule-note" className="input" maxLength={120} value={form.description}
                            onChange={e => set({ description: e.target.value })} placeholder={t('common.notePlaceholder')} />
                    </div>
                    <div className="flex gap-3">
                        {rule && (
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

const RecurringPage = () => {
    const { t } = useTranslation();
    const rules = useUserTable('recurring');
    const user = useStore(s => s.user);
    const [editing, setEditing] = useState(null); // null | 'new' | rule

    if (!rules) return <Spinner />;

    const active = rules.filter(r => r.active);
    const monthlyIn = active.filter(r => r.kind === 'income').reduce((s, r) => s + r.amount, 0);
    const monthlyOut = active.filter(r => r.kind === 'expense').reduce((s, r) => s + r.amount, 0);

    const toggle = async (rule) => {
        // Resuming skips the months it was paused rather than back-filling them
        await updateRecord('recurring', rule.id, rule.active
            ? { active: false }
            : { active: true, start_month: monthKey(), last_generated: null });
        if (!rule.active) await runRecurring(user.id);
    };

    return (
        <div className="animate-fade-in-up">
            <PageHeader title={t('recurring.title')} subtitle={t('recurring.subtitle')}>
                <button className="btn-primary" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> {t('recurring.add')}</button>
            </PageHeader>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card-pad">
                    <p className="text-sm muted">{t('recurring.monthlyIn')}</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(monthlyIn)}</p>
                </div>
                <div className="card-pad">
                    <p className="text-sm muted">{t('recurring.monthlyOut')}</p>
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatMoney(monthlyOut)}</p>
                </div>
            </div>

            <div className="card overflow-hidden">
                {rules.length === 0 ? (
                    <EmptyState icon={Repeat} text={t('recurring.empty')}
                        action={<button className="btn-primary" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> {t('recurring.add')}</button>} />
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[...rules].sort((a, b) => a.day_of_month - b.day_of_month).map(rule => {
                            const cat = rule.kind === 'income' ? getIncomeCategory(rule.category) : getExpenseCategory(rule.category);
                            return (
                                <div key={rule.id} className={`flex items-center gap-3 px-5 py-3.5 ${rule.active ? '' : 'opacity-50'}`}>
                                    <button onClick={() => setEditing(rule)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                        <CategoryIcon icon={cat.icon} color={cat.color} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{rule.description || t(`categories.${cat.id}`)}</p>
                                            <p className="text-xs muted">
                                                {rule.active ? t('recurring.everyMonthOn', { day: rule.day_of_month }) : t('recurring.paused')}
                                                {' · '}{t(`sources.${rule.source}`)}
                                            </p>
                                        </div>
                                    </button>
                                    <span className={`text-sm font-semibold whitespace-nowrap ${rule.kind === 'income' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                        {rule.kind === 'income' ? '+' : '−'}{formatMoney(rule.amount)}
                                    </span>
                                    <button onClick={() => toggle(rule)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        title={rule.active ? t('recurring.pause') : t('recurring.resume')} aria-label={rule.active ? t('recurring.pause') : t('recurring.resume')}>
                                        {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {editing && <RuleEditor rule={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
        </div>
    );
};

export default RecurringPage;
