import React, { useState } from 'react';
import { useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { db } from '../../lib/db';
import { normalizeRow } from '../../lib/normalize';
import { createRecord, updateRecord } from '../../lib/repo';
import { requiredPerMonth } from '../../lib/goals';
import { GOAL_COLORS } from '../../lib/categories';
import { formatMoney, todayISO } from '../../lib/format';
import useStore from '../../store/useStore';
import PetSelector from './PetSelector';
import { Spinner } from '../ui/bits';

const GoalForm = ({ goal, preset }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, toast } = useStore();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: goal?.name || preset?.name || '',
        target_amount: goal ? String(goal.target_amount) : (preset?.target ? String(Math.round(preset.target)) : ''),
        deadline: goal?.deadline || '',
        pet_avatar: goal?.pet_avatar || (preset ? 'turtle' : 'lion'),
        color_theme: goal?.color_theme || (preset ? 'cyan' : 'purple'),
        monthly_contribution: goal?.monthly_contribution != null ? String(goal.monthly_contribution) : '',
        is_emergency: goal?.is_emergency || !!preset,
    });

    const set = (patch) => setFormData(f => ({ ...f, ...patch }));
    const target = parseFloat(formData.target_amount) || 0;
    const perMonth = formData.deadline && target > 0
        ? requiredPerMonth({ target_amount: target, current_amount: goal?.current_amount || 0, deadline: formData.deadline })
        : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || target <= 0) return;
        setSaving(true);
        const fields = {
            name: formData.name.trim(),
            target_amount: target,
            deadline: formData.deadline || null,
            pet_avatar: formData.pet_avatar,
            color_theme: formData.color_theme,
            monthly_contribution: formData.monthly_contribution === '' ? null : Number(formData.monthly_contribution),
            is_emergency: formData.is_emergency,
        };

        try {
            if (goal) {
                const completed = (goal.current_amount || 0) >= target;
                await updateRecord('goals', goal.id, { ...fields, is_completed: completed, completed_at: completed ? (goal.completed_at || new Date().toISOString()) : null });
                toast(t('common.saved'));
                navigate(`/goals/${goal.id}`);
            } else {
                const created = await createRecord('goals', user.id, { ...fields, current_amount: 0, is_completed: false });
                toast(t('goals.created'));
                navigate(`/goals/${created.id}`);
            }
        } catch (error) {
            console.error('Failed to save goal:', error);
            toast(t('common.somethingWrong'), 'error');
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={() => navigate(-1)} className="btn-ghost -ml-3 mb-3"><ArrowLeft className="w-4 h-4" /> {t('common.back')}</button>
            <h1 className="page-title mb-6">{goal ? t('goals.editGoal') : t('goals.createGoal')}</h1>

            <form onSubmit={handleSubmit} className="card-pad space-y-7">
                <div>
                    <label className="label" htmlFor="goal-name">{t('goals.goalName')}</label>
                    <input id="goal-name" type="text" required maxLength={60} placeholder={t('goals.goalNamePlaceholder')}
                        value={formData.name} onChange={(e) => set({ name: e.target.value })} className="input" />
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                        <label className="label" htmlFor="goal-target">{t('goals.targetAmount')}</label>
                        <input id="goal-target" type="number" inputMode="numeric" required min="1" placeholder="50000"
                            value={formData.target_amount} onChange={(e) => set({ target_amount: e.target.value })} className="input" />
                    </div>
                    <div>
                        <label className="label" htmlFor="goal-deadline">{t('goals.deadline')} <span className="muted font-normal">({t('common.optional')})</span></label>
                        <input id="goal-deadline" type="date" min={todayISO()} value={formData.deadline}
                            onChange={(e) => set({ deadline: e.target.value })} className="input" />
                    </div>
                </div>

                {perMonth > 0 && (
                    <p className="text-sm rounded-xl bg-primary/10 text-primary px-4 py-3 font-medium">
                        {t('goals.needPerMonth', { amount: formatMoney(perMonth) })}
                    </p>
                )}

                <div>
                    <label className="label" htmlFor="goal-auto">{t('goals.autoSave')} <span className="muted font-normal">({t('common.optional')})</span></label>
                    <input id="goal-auto" type="number" inputMode="numeric" min="0"
                        placeholder={perMonth > 0 ? String(Math.round(perMonth)) : '20000'}
                        value={formData.monthly_contribution} onChange={(e) => set({ monthly_contribution: e.target.value })} className="input" />
                    <p className="text-xs muted mt-1.5">{t('goals.autoSaveHint')}</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 p-3.5">
                    <input type="checkbox" checked={formData.is_emergency} onChange={e => set({ is_emergency: e.target.checked })} className="mt-0.5 w-4 h-4 accent-primary" />
                    <span>
                        <span className="text-sm font-medium flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-cyan-500" /> {t('goals.emergencyFlag')}</span>
                        <span className="block text-xs muted mt-0.5">{t('goals.emergencyFlagHint')}</span>
                    </span>
                </label>

                <div>
                    <span className="label">{t('goals.colorTheme')}</span>
                    <div className="flex gap-4">
                        {GOAL_COLORS.map((color) => (
                            <button
                                key={color.id} type="button" aria-label={color.id}
                                onClick={() => set({ color_theme: color.id })}
                                className={`w-10 h-10 rounded-full transition ${formData.color_theme === color.id ? 'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600 dark:ring-offset-gray-900 scale-110' : ''}`}
                                style={{ backgroundColor: color.hex }}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <span className="label">{t('goals.choosePet')}</span>
                    <PetSelector selectedPet={formData.pet_avatar} onSelect={(pet) => set({ pet_avatar: pet })} />
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={() => navigate(-1)} className="btn-ghost">{t('common.cancel')}</button>
                    <button type="submit" disabled={saving} className="btn-primary px-6">
                        {goal ? t('common.save') : t('goals.createGoal')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export const EditGoal = () => {
    const { id } = useParams();
    const goal = useLiveQuery(() => db.goals.get(id).then(g => (g ? normalizeRow(g) : null)), [id]);
    if (goal === undefined) return <Spinner />;
    if (!goal) return <Navigate to="/goals" replace />;
    return <GoalForm goal={goal} />;
};

const CreateGoal = () => {
    const [params] = useSearchParams();
    const { t } = useTranslation();
    const preset = params.get('type') === 'emergency'
        ? { name: t('goals.emergencyName'), target: Number(params.get('target')) || 0 }
        : null;
    return <GoalForm preset={preset} />;
};

export default CreateGoal;
