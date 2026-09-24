import { format, subDays, addDays, parseISO, getDay, differenceInCalendarDays } from 'date-fns';
import { monthKey, entryMonth, entryDay, shiftMonth, daysInMonthKey } from './format';
import { summarizeMonth } from './insights';
import { averageMonthlyNeeds, salaryForMonth } from './salary';
import { plannedContribution, paidThisPayday } from './goals';
import { DEFAULT_SPLIT } from './categories';

const num = (n) => Number(n) || 0;
const sum = (rows) => rows.reduce((s, r) => s + num(r.amount), 0);
const dayKey = (d) => format(d, 'yyyy-MM-dd');

// Day-to-day spending the user controls: not savings, not goal deposits,
// not automatic recurring bills (rent, school fees…)
export const isFlexible = (e) => e.bucket !== 'Savings' && !e.recurring_id && !e.goal_id;

// Flexible spending per day, 'yyyy-MM-dd' -> RWF
const spendByDay = (expenses) => {
    const map = new Map();
    for (const e of expenses) {
        if (!isFlexible(e)) continue;
        const d = entryDay(e);
        map.set(d, (map.get(d) || 0) + num(e.amount));
    }
    return map;
};

const averageIncome = (incomes, today) => {
    const totals = [];
    for (let i = 0; i < 4 && totals.length < 3; i++) {
        const m = shiftMonth(monthKey(today), -i);
        const s = sum(incomes.filter(x => entryMonth(x) === m));
        if (s > 0) totals.push(s);
    }
    return totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
};

/* ------------------------------------------------------------------ */
/* 1. Financial health score (0–100)                                   */
/* ------------------------------------------------------------------ */

export const HEALTH_PARTS = [
    { id: 'savings', max: 30 },
    { id: 'budget', max: 25 },
    { id: 'emergency', max: 25 },
    { id: 'debt', max: 20 },
];

export const healthGrade = (score) =>
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'weak';

export const GRADE_COLORS = { excellent: '#10b981', good: '#22c55e', fair: '#f59e0b', weak: '#ef4444' };

export const healthScore = ({ month, incomes = [], expenses = [], goals = [], liabilities = [], split = DEFAULT_SPLIT, today = new Date() }) => {
    const s = summarizeMonth(month, { incomes, expenses, split });
    const hasData = s.income > 0 || s.spent > 0;

    // Saving: reaching your Savings share of income earns full points
    const savingsTarget = (split.Savings || 20) / 100;
    const savingsRatio = s.income > 0 ? Math.min(s.savingsRate / savingsTarget, 1) : 0;

    // Budget: Needs + Wants stayed within their share of income; 50% over scores 0
    const allocated = s.buckets.Needs.allocated + s.buckets.Wants.allocated;
    const used = s.buckets.Needs.spent + s.buckets.Wants.spent;
    const budgetRatio = s.income > 0
        ? (used <= allocated ? 1 : Math.max(0, 1 - (used - allocated) / (allocated * 0.5)))
        : 0;

    // Safety net: 3 months of essential spending set aside
    const avgNeeds = averageMonthlyNeeds(expenses, today);
    const fund = goals.filter(g => g.is_emergency).reduce((a, g) => a + num(g.current_amount), 0);
    const monthsCovered = avgNeeds > 0 ? fund / avgNeeds : 0;
    const emergencyRatio = Math.min(monthsCovered / 3, 1);

    // Debt: no debt is best; debt worth half a year's income or more scores 0
    const debt = sum(liabilities);
    const yearlyIncome = averageIncome(incomes, today) * 12;
    const debtLoad = yearlyIncome > 0 ? debt / yearlyIncome : (debt > 0 ? 1 : 0);
    const debtRatio = Math.max(0, 1 - debtLoad / 0.5);

    const ratios = { savings: savingsRatio, budget: budgetRatio, emergency: emergencyRatio, debt: debtRatio };
    const parts = HEALTH_PARTS.map(p => ({ ...p, ratio: ratios[p.id], points: Math.round(ratios[p.id] * p.max) }));
    const score = parts.reduce((a, p) => a + p.points, 0);
    // The weakest area (relative to its max) is where the tip comes from
    const weakest = [...parts].sort((a, b) => a.ratio - b.ratio)[0];

    return {
        score, grade: healthGrade(score), parts, weakest: weakest.id, hasData,
        details: { savingsRate: s.savingsRate, used, allocated, monthsCovered, debt, debtLoad },
    };
};

// Score for each of the last `n` months (oldest first) for the trend line
export const healthHistory = (data, n = 6, today = new Date()) =>
    Array.from({ length: n }, (_, i) => {
        const month = shiftMonth(monthKey(today), i - (n - 1));
        const h = healthScore({ ...data, month, today });
        return { month, score: h.hasData ? h.score : null };
    });

/* ------------------------------------------------------------------ */
/* 4. Daily spending allowance + streaks + no-spend days               */
/* ------------------------------------------------------------------ */

// How much can be spent today, after bills and this month's planned savings
export const dailyAllowance = ({ incomes = [], expenses = [], goals = [], transactions = [], bills = [], split = DEFAULT_SPLIT, today = new Date() }) => {
    const month = monthKey(today);
    const s = summarizeMonth(month, { incomes, expenses, split });
    const todayStr = dayKey(today);
    const spentToday = sum(s.expenses.filter(e => entryDay(e) === todayStr && isFlexible(e)));
    const billsDue = sum(bills);
    const pendingSavings = salaryForMonth(incomes, month) > 0
        ? goals.filter(g => !paidThisPayday(g, transactions, month)).reduce((a, g) => a + plannedContribution(g, today), 0)
        : 0;

    const daysLeft = daysInMonthKey(month) - today.getDate() + 1;
    const availableAtStartOfDay = s.left + spentToday - billsDue - pendingSavings;
    const allowance = Math.max(availableAtStartOfDay / daysLeft, 0);

    return {
        hasIncome: s.income > 0, allowance, spentToday,
        remaining: allowance - spentToday, billsDue, pendingSavings, daysLeft,
    };
};

// A day's fair share of a month's flexible budget (Needs + Wants minus recurring bills)
const flexibleDailyBudget = (month, incomes, expenses, split) => {
    const income = sum(incomes.filter(i => entryMonth(i) === month));
    const bills = sum(expenses.filter(e => entryMonth(e) === month && e.recurring_id && e.bucket !== 'Savings'));
    const pool = income * ((split.Needs + split.Wants) / 100) - bills;
    return pool > 0 ? pool / daysInMonthKey(month) : 0;
};

// Consecutive days (up to today) that stayed within the daily budget
export const spendingStreak = ({ incomes = [], expenses = [], split = DEFAULT_SPLIT, today = new Date() }) => {
    const byDay = spendByDay(expenses);
    const budgets = new Map();
    const budgetFor = (m) => {
        if (!budgets.has(m)) budgets.set(m, flexibleDailyBudget(m, incomes, expenses, split));
        return budgets.get(m);
    };
    let streak = 0;
    for (let i = 0; i < 366; i++) {
        const d = subDays(today, i);
        const budget = budgetFor(monthKey(d));
        if (budget <= 0) break;
        if ((byDay.get(dayKey(d)) || 0) <= budget) streak++;
        else if (i === 0) continue; // today isn't over yet – judge from yesterday
        else break;
    }
    return streak;
};

// Every day of the month so far: 'none' (no-spend), 'under' or 'over' the daily budget
export const monthCalendar = ({ incomes = [], expenses = [], split = DEFAULT_SPLIT, today = new Date() }) => {
    const month = monthKey(today);
    const byDay = spendByDay(expenses);
    const budget = flexibleDailyBudget(month, incomes, expenses, split);
    const days = [];
    for (let d = 1; d <= daysInMonthKey(month); d++) {
        const date = parseISO(`${month}-${String(d).padStart(2, '0')}`);
        const spent = byDay.get(dayKey(date)) || 0;
        let status = 'future';
        if (date <= today) status = spent === 0 ? 'none' : budget > 0 && spent > budget ? 'over' : 'under';
        days.push({ day: d, weekday: getDay(date), spent, status });
    }
    return { days, budget, noSpendDays: days.filter(d => d.status === 'none').length };
};

/* ------------------------------------------------------------------ */
/* 3. Spending habits report                                           */
/* ------------------------------------------------------------------ */

export const spendingHabits = ({ incomes = [], expenses = [], today = new Date() }) => {
    const since = dayKey(subDays(today, 89));
    const recent = expenses.filter(e => isFlexible(e) && entryDay(e) >= since && entryDay(e) <= dayKey(today));

    // Average spending on each weekday (Sunday = 0) over the last 90 days
    const weekdayTotals = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);
    for (let i = 0; i < 90; i++) weekdayCounts[getDay(subDays(today, i))]++;
    for (const e of recent) weekdayTotals[getDay(parseISO(entryDay(e)))] += num(e.amount);
    const weekdays = weekdayTotals.map((t, i) => ({ weekday: i, average: weekdayCounts[i] ? t / weekdayCounts[i] : 0 }));
    const overallDaily = weekdayTotals.reduce((a, b) => a + b, 0) / 90;
    const peak = [...weekdays].sort((a, b) => b.average - a.average)[0];

    // Small purchases that add up (last 30 days, under 10,000 RWF each)
    const since30 = dayKey(subDays(today, 29));
    const small = {};
    for (const e of recent) {
        if (entryDay(e) < since30 || num(e.amount) >= 10000) continue;
        small[e.category] = small[e.category] || { category: e.category, count: 0, total: 0 };
        small[e.category].count++;
        small[e.category].total += num(e.amount);
    }
    const leaks = Object.values(small).filter(x => x.count >= 4).sort((a, b) => b.total - a.total).slice(0, 3);

    // Payday effect: share of Wants spent in the 7 days after salary arrives
    const shares = [];
    for (let i = 0; i < 3; i++) {
        const m = shiftMonth(monthKey(today), -i);
        const salary = incomes.filter(x => entryMonth(x) === m && x.category === 'salary').map(entryDay).sort()[0];
        const wants = expenses.filter(e => entryMonth(e) === m && e.bucket === 'Wants' && isFlexible(e));
        const total = sum(wants);
        if (!salary || total <= 0) continue;
        const end = dayKey(addDays(parseISO(salary), 6));
        const after = sum(wants.filter(e => entryDay(e) >= salary && entryDay(e) <= end));
        shares.push(after / total);
    }
    const paydayShare = shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : null;

    // This month vs the average of the 3 months before, per category
    const month = monthKey(today);
    const monthFraction = today.getDate() / daysInMonthKey(month);
    const cats = new Set(expenses.filter(isFlexible).map(e => e.category));
    const changes = [];
    for (const c of cats) {
        const prev = [1, 2, 3].map(i => sum(expenses.filter(e => isFlexible(e) && e.category === c && entryMonth(e) === shiftMonth(month, -i))));
        const monthsWithData = prev.filter(v => v > 0).length;
        if (!monthsWithData) continue;
        const avg = prev.reduce((a, b) => a + b, 0) / monthsWithData;
        const current = sum(expenses.filter(e => isFlexible(e) && e.category === c && entryMonth(e) === month));
        // Compare against the average scaled to how far into the month we are
        const expected = avg * monthFraction;
        if (avg < 5000 || expected <= 0) continue;
        const change = (current - expected) / expected;
        if (Math.abs(change) >= 0.25) changes.push({ category: c, current, average: avg, change });
    }
    changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return { weekdays, peak: peak.average > overallDaily * 1.3 ? peak : null, overallDaily, leaks, paydayShare, changes: changes.slice(0, 5), hasData: recent.length >= 5 };
};

/* ------------------------------------------------------------------ */
/* 5. Monthly commitments & review                                     */
/* ------------------------------------------------------------------ */

export const COMMITMENT_TYPES = ['category_cap', 'wants_cap', 'save_min', 'no_spend_days'];

// Progress on the commitment made for `month`.
// status: 'on_track' | 'at_risk' | 'broken' | 'kept' | 'missed'
export const evaluateCommitment = (commitment, { incomes = [], expenses = [], split = DEFAULT_SPLIT, today = new Date() }, month) => {
    if (!commitment) return null;
    const s = summarizeMonth(month, { incomes, expenses, split });
    const finished = month < monthKey(today);
    const fraction = finished ? 1 : today.getDate() / daysInMonthKey(month);
    const target = num(commitment.amount);
    let current = 0;
    let isCap = true;

    if (commitment.type === 'category_cap') current = s.byCategory[commitment.category] || 0;
    else if (commitment.type === 'wants_cap') current = s.buckets.Wants.spent;
    else if (commitment.type === 'save_min') { current = s.saved; isCap = false; }
    else if (commitment.type === 'no_spend_days') {
        isCap = false;
        const byDay = spendByDay(expenses);
        const last = finished ? daysInMonthKey(month) : today.getDate();
        for (let d = 1; d <= last; d++) if (!byDay.get(`${month}-${String(d).padStart(2, '0')}`)) current++;
    }

    let status;
    if (isCap) {
        if (current > target) status = 'broken';
        else if (finished) status = 'kept';
        else status = current > target * Math.min(fraction + 0.1, 1) ? 'at_risk' : 'on_track';
    } else if (current >= target) {
        status = 'kept';
    } else if (finished) {
        status = 'missed';
    } else {
        status = current >= target * fraction * 0.8 ? 'on_track' : 'at_risk';
    }
    return { current, target, status, progress: target > 0 ? current / target : 0, isCap };
};

// Last month in numbers, compared with the month before
export const monthlyReview = (data, today = new Date()) => {
    const month = shiftMonth(monthKey(today), -1);
    const before = shiftMonth(month, -1);
    const s = summarizeMonth(month, data);
    if (s.income === 0 && s.spent === 0) return null;
    const p = summarizeMonth(before, data);
    const h = healthScore({ ...data, month, today });
    const hPrev = healthScore({ ...data, month: before, today });

    const cats = new Set([...Object.keys(s.byCategory), ...Object.keys(p.byCategory)]);
    const deltas = [...cats]
        .filter(c => c !== 'savings')
        .map(c => ({ category: c, change: (s.byCategory[c] || 0) - (p.byCategory[c] || 0) }))
        .filter(d => Math.abs(d.change) >= 2000);
    const improved = [...deltas].sort((a, b) => a.change - b.change).filter(d => d.change < 0).slice(0, 2);
    const worsened = [...deltas].sort((a, b) => b.change - a.change).filter(d => d.change > 0).slice(0, 2);

    return {
        month, income: s.income, spent: s.spent, saved: s.saved, savingsRate: s.savingsRate,
        score: h.score, scoreChange: hPrev.hasData ? h.score - hPrev.score : null,
        improved, worsened,
    };
};

/* ------------------------------------------------------------------ */
/* 6. Challenges & badges                                              */
/* ------------------------------------------------------------------ */

export const CHALLENGES = [
    { id: 'no_spend_weekend', icon: 'Ban' },
    { id: 'no_eating_out_week', icon: 'Coffee' },
    { id: 'cut_wants_20', icon: 'TrendingDown' },
    { id: 'save_10_percent', icon: 'Mountain' },
];

// Date range a challenge covers when started on `start`
export const challengeWindow = (type, start) => {
    const d = parseISO(start);
    if (type === 'no_spend_weekend') {
        const toSat = (6 - getDay(d) + 7) % 7;
        const sat = getDay(d) === 0 ? subDays(d, 1) : addDays(d, toSat); // started on Sunday: this weekend
        return { from: dayKey(sat), to: dayKey(addDays(sat, 1)) };
    }
    if (type === 'no_eating_out_week') return { from: start, to: dayKey(addDays(d, 6)) };
    const m = start.slice(0, 7);
    return { from: `${m}-01`, to: `${m}-${String(daysInMonthKey(m)).padStart(2, '0')}` };
};

// status: 'upcoming' | 'active' | 'won' | 'lost'
export const evaluateChallenge = (challenge, { incomes = [], expenses = [], split = DEFAULT_SPLIT, today = new Date() }) => {
    const { from, to } = challengeWindow(challenge.type, challenge.start);
    const todayStr = dayKey(today);
    const over = todayStr > to;
    const inWindow = (e) => entryDay(e) >= from && entryDay(e) <= to;
    let progress = 0, failed = false, detail = {};

    if (challenge.type === 'no_spend_weekend') {
        failed = expenses.some(e => isFlexible(e) && inWindow(e));
        const total = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
        const done = Math.max(0, Math.min(differenceInCalendarDays(today, parseISO(from)) + 1, total));
        progress = done / total;
    } else if (challenge.type === 'no_eating_out_week') {
        failed = expenses.some(e => e.category === 'eating_out' && inWindow(e));
        progress = Math.max(0, Math.min((differenceInCalendarDays(today, parseISO(from)) + 1) / 7, 1));
    } else if (challenge.type === 'cut_wants_20') {
        const m = from.slice(0, 7);
        const cur = summarizeMonth(m, { incomes, expenses, split }).buckets.Wants.spent;
        const prev = summarizeMonth(shiftMonth(m, -1), { incomes, expenses, split }).buckets.Wants.spent;
        const limit = prev * 0.8;
        detail = { current: cur, limit };
        failed = prev > 0 && cur > limit;
        progress = limit > 0 ? Math.min(cur / limit, 1) : 0;
        if (prev === 0) return { status: over ? 'lost' : 'active', progress: 0, from, to, detail: { ...detail, noBaseline: true } };
    } else if (challenge.type === 'save_10_percent') {
        const m = from.slice(0, 7);
        const s = summarizeMonth(m, { incomes, expenses, split });
        const target = s.income * 0.1;
        detail = { current: s.saved, target };
        progress = target > 0 ? Math.min(s.saved / target, 1) : 0;
        const won = target > 0 && s.saved >= target;
        return { status: won ? 'won' : over ? 'lost' : 'active', progress, from, to, detail };
    }

    let status;
    if (failed) status = 'lost';
    else if (todayStr < from) status = 'upcoming';
    else status = over ? 'won' : 'active';
    return { status, progress, from, to, detail };
};

export const BADGES = [
    { id: 'first_no_spend', icon: 'BadgeCheck' },
    { id: 'streak_7', icon: 'Flame' },
    { id: 'streak_30', icon: 'Flame' },
    { id: 'score_80', icon: 'HeartPulse' },
    { id: 'safety_net', icon: 'ShieldCheck' },
    { id: 'challenge_won', icon: 'Trophy' },
    { id: 'three_challenges', icon: 'Medal' },
    { id: 'wise_skip', icon: 'Hourglass' },
];

export const earnedBadges = ({ bestStreak, noSpendDaysEver, score, monthsCovered, challengesWon, skippedTotal }) => {
    const earned = new Set();
    if (noSpendDaysEver > 0) earned.add('first_no_spend');
    if (bestStreak >= 7) earned.add('streak_7');
    if (bestStreak >= 30) earned.add('streak_30');
    if (score >= 80) earned.add('score_80');
    if (monthsCovered >= 3) earned.add('safety_net');
    if (challengesWon >= 1) earned.add('challenge_won');
    if (challengesWon >= 3) earned.add('three_challenges');
    if (skippedTotal > 0) earned.add('wise_skip');
    return earned;
};

/* ------------------------------------------------------------------ */
/* 2. Think before you buy                                             */
/* ------------------------------------------------------------------ */

const WORK_DAYS_PER_MONTH = 22;

// What a purchase really costs: days of work and delay to the main goal
export const purchaseImpact = ({ amount, incomes = [], goals = [], transactions = [], today = new Date() }) => {
    const salary = averageIncome(incomes, today);
    const workDays = salary > 0 ? amount / (salary / WORK_DAYS_PER_MONTH) : null;

    // Among goals with a monthly saving plan, the one saved into most recently is affected most
    const perMonth = (g) => num(g.monthly_contribution) || plannedContribution(g, today);
    const planned = goals.filter(g => !g.is_completed && num(g.target_amount) > num(g.current_amount) && perMonth(g) > 0);
    let goal = null, delayMonths = null;
    if (planned.length) {
        const lastDeposit = (g) => transactions.filter(t => t.goal_id === g.id).map(t => t.transaction_date || t.created_at || '').sort().pop() || '';
        goal = [...planned].sort((a, b) => lastDeposit(b).localeCompare(lastDeposit(a)))[0];
        delayMonths = amount / perMonth(goal);
    }
    return { workDays, goal, delayMonths };
};

// A purchase big enough to deserve a pause: a Wants expense ≥ 20,000 RWF or ≥ 10% of monthly income
export const deservesPause = ({ amount, bucket, incomes = [], today = new Date() }) => {
    if (bucket !== 'Wants' || !(amount > 0)) return false;
    const income = averageIncome(incomes, today);
    return amount >= 20000 || (income > 0 && amount >= income * 0.1);
};

export const WAIT_HOURS = 24;
