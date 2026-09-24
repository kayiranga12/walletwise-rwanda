import { entryMonth, monthKey, shiftMonth, daysInMonthKey } from './format';
import { BUCKETS, DEFAULT_SPLIT } from './categories';
import { forecastGoal } from './goals';

const sum = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);

// Totals for one month: income, spending per 50/30/20 bucket and per category.
export const summarizeMonth = (month, { incomes = [], expenses = [], split = DEFAULT_SPLIT }) => {
    const monthIncomes = incomes.filter(i => entryMonth(i) === month);
    const monthExpenses = expenses.filter(e => entryMonth(e) === month);
    const income = sum(monthIncomes);

    const buckets = {};
    for (const b of BUCKETS) {
        const spent = sum(monthExpenses.filter(e => e.bucket === b.id));
        const allocated = income * (split[b.id] ?? DEFAULT_SPLIT[b.id]) / 100;
        buckets[b.id] = { spent, allocated, ratio: allocated > 0 ? spent / allocated : 0 };
    }

    const byCategory = {};
    for (const e of monthExpenses) {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
    }

    // Money put aside (Savings bucket) is not "spent" when working out what's left
    const spent = sum(monthExpenses);
    const consumption = spent - buckets.Savings.spent;

    return {
        month, income, spent, consumption,
        saved: buckets.Savings.spent,
        left: income - spent,
        savingsRate: income > 0 ? buckets.Savings.spent / income : 0,
        buckets, byCategory,
        incomes: monthIncomes, expenses: monthExpenses,
    };
};

// Plain-language observations about a month, most urgent first.
// Each: { id, level: 'danger'|'warning'|'good'|'info', key, params }
export const buildInsights = ({ month, incomes, expenses, goals = [], goalTransactions = [], split, today = new Date() }) => {
    const out = [];
    const cur = summarizeMonth(month, { incomes, expenses, split });
    const prev = summarizeMonth(shiftMonth(month, -1), { incomes, expenses, split });
    const isCurrent = month === monthKey(today);

    for (const b of ['Needs', 'Wants']) {
        const { ratio, spent, allocated } = cur.buckets[b];
        if (allocated <= 0) continue;
        if (ratio >= 1) {
            out.push({ id: `over-${b}`, level: 'danger', key: 'insights.overBudget', params: { bucket: b, amount: spent - allocated } });
        } else if (ratio >= 0.8) {
            out.push({ id: `near-${b}`, level: 'warning', key: 'insights.nearBudget', params: { bucket: b, percent: Math.round(ratio * 100) } });
        }
    }

    if (isCurrent && cur.income > 0) {
        const daysInMonth = daysInMonthKey(month);
        const day = today.getDate();
        const daysLeft = daysInMonth - day + 1;

        if (day >= 5 && cur.consumption > 0) {
            const projected = (cur.consumption / day) * daysInMonth;
            const budgetForSpending = cur.buckets.Needs.allocated + cur.buckets.Wants.allocated;
            if (projected > budgetForSpending * 1.05) {
                out.push({ id: 'projected', level: 'warning', key: 'insights.projectedOverspend', params: { amount: projected } });
            }
        }
        if (cur.left > 0) {
            out.push({ id: 'safe', level: 'info', key: 'insights.safeToSpend', params: { amount: cur.left / daysLeft } });
        }
    }

    if (cur.income === 0 && (isCurrent || cur.spent > 0)) {
        out.push({ id: 'no-income', level: 'info', key: 'insights.noIncome', params: {} });
    }

    const wantsNow = cur.buckets.Wants.spent;
    const wantsBefore = prev.buckets.Wants.spent;
    if (wantsBefore > 0 && wantsNow > 0) {
        const change = (wantsNow - wantsBefore) / wantsBefore;
        if (change >= 0.2) out.push({ id: 'wants-up', level: 'warning', key: 'insights.wantsUp', params: { percent: Math.round(change * 100) } });
        else if (change <= -0.2 && !isCurrent) out.push({ id: 'wants-down', level: 'good', key: 'insights.wantsDown', params: { percent: Math.round(-change * 100) } });
    }

    if (cur.income > 0 && cur.savingsRate >= (split?.Savings ?? 20) / 100) {
        out.push({ id: 'saver', level: 'good', key: 'insights.savingsRateGood', params: { percent: Math.round(cur.savingsRate * 100) } });
    }

    const top = Object.entries(cur.byCategory).sort((a, b) => b[1] - a[1])[0];
    if (top && cur.spent > 0 && top[1] / cur.spent >= 0.3) {
        out.push({ id: 'top-cat', level: 'info', key: 'insights.topCategory', params: { category: top[0], percent: Math.round((top[1] / cur.spent) * 100) } });
    }

    if (isCurrent) {
        for (const goal of goals.filter(g => !g.is_completed)) {
            const f = forecastGoal(goal, goalTransactions, today);
            if (f.status === 'behind' && f.perMonthNeeded) {
                out.push({ id: `goal-${goal.id}`, level: 'warning', key: 'insights.goalBehind', params: { name: goal.name, amount: f.perMonthNeeded } });
            } else if (f.status === 'on_track' && f.eta) {
                out.push({ id: `goal-${goal.id}`, level: 'good', key: 'insights.goalEta', params: { name: goal.name, date: f.eta } });
            }
        }
    }

    const rank = { danger: 0, warning: 1, good: 2, info: 3 };
    return out.sort((a, b) => rank[a.level] - rank[b.level]);
};

// Which budget thresholds (80% / 100%) a new expense pushes a bucket across
export const budgetCrossing = (summaryBefore, bucket, amount) => {
    const b = summaryBefore.buckets[bucket];
    if (!b || b.allocated <= 0) return null;
    const before = b.spent / b.allocated;
    const after = (b.spent + amount) / b.allocated;
    if (before < 1 && after >= 1) return 'over';
    if (before < 0.8 && after >= 0.8) return 'near';
    return null;
};
