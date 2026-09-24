import { useMemo, useEffect } from 'react';
import useStore from '../store/useStore';
import { saveSettings } from './settings';
import { useUserTable, useSettings, useUpcomingBills } from './hooks';
import { monthKey, shiftMonth } from './format';
import {
    healthScore, healthHistory, dailyAllowance, spendingStreak, monthCalendar,
    spendingHabits, evaluateCommitment, monthlyReview, evaluateChallenge, earnedBadges,
} from './discipline';

// Everything the discipline features need, computed once from the user's data.
// Returns null while the data is loading.
export const useDiscipline = () => {
    const incomes = useUserTable('incomes');
    const expenses = useUserTable('expenses');
    const goals = useUserTable('goals');
    const transactions = useUserTable('transactions');
    const liabilities = useUserTable('liabilities');
    const bills = useUpcomingBills();
    const settings = useSettings();

    const uid = useStore(s => s.user?.id);
    const result = useMemo(() => {
        if (!incomes || !expenses || !goals || !transactions || !liabilities || !settings.loaded) return null;
        const today = new Date();
        const month = monthKey(today);
        const { split } = settings;
        const data = { incomes, expenses, goals, transactions, liabilities, split, today };

        const health = healthScore({ ...data, month });
        const streak = spendingStreak(data);
        const calendar = monthCalendar(data);
        const challenges = settings.challenges
            .map(c => ({ ...c, result: evaluateChallenge(c, data) }))
            .sort((a, b) => (b.start || '').localeCompare(a.start || ''));
        const challengesWon = challenges.filter(c => c.result.status === 'won').length;

        // Records are remembered in settings so badges stay earned after a streak ends
        const bestStreak = Math.max(streak, Number(settings.raw?.best_streak) || 0);
        const noSpendDaysEver = Math.max(calendar.noSpendDays, Number(settings.raw?.no_spend_days_ever) || 0);

        return {
            data, month, settings,
            health,
            history: healthHistory({ incomes, expenses, goals, liabilities, split }, 6, today),
            allowance: dailyAllowance({ ...data, bills }),
            streak, bestStreak, noSpendDaysEver,
            calendar,
            habits: spendingHabits(data),
            commitment: settings.commitments[month] || null,
            commitmentResult: evaluateCommitment(settings.commitments[month], data, month),
            review: monthlyReview(data, today),
            lastCommitment: settings.commitments[shiftMonth(month, -1)] || null,
            lastCommitmentResult: evaluateCommitment(settings.commitments[shiftMonth(month, -1)], data, shiftMonth(month, -1)),
            challenges,
            badges: earnedBadges({
                bestStreak, noSpendDaysEver, score: health.score,
                monthsCovered: health.details.monthsCovered, challengesWon, skippedTotal: settings.skippedTotal,
            }),
            wishlist: settings.wishlist,
            skippedTotal: settings.skippedTotal,
        };
    }, [incomes, expenses, goals, transactions, liabilities, bills, settings]);

    // Save new personal records (best streak, no-spend days) as they happen
    const bestStreak = result?.bestStreak;
    const noSpend = result?.noSpendDaysEver;
    const raw = settings.raw;
    useEffect(() => {
        if (!uid || bestStreak == null) return;
        const changes = {};
        if (bestStreak > (Number(raw?.best_streak) || 0)) changes.best_streak = bestStreak;
        if (noSpend > (Number(raw?.no_spend_days_ever) || 0)) changes.no_spend_days_ever = noSpend;
        if (Object.keys(changes).length) saveSettings(uid, changes);
    }, [uid, bestStreak, noSpend, raw]);

    return result;
};
