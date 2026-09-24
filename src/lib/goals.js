import { differenceInCalendarMonths, addMonths, parseISO, subDays, differenceInDays } from 'date-fns';
import { db } from './db';
import { createRecord, updateRecord, deleteRecord } from './repo';
import { todayISO } from './format';

export const MILESTONES = [25, 50, 75, 100];

export const goalProgress = (goal) =>
    goal.target_amount > 0 ? Math.min((goal.current_amount || 0) / goal.target_amount, 1) : 0;

// Records a deposit or withdrawal against a goal. Deposits can also be counted
// as "Savings" spending in the month's 50/30/20 budget.
// Returns the milestone (25/50/75/100) newly crossed, if any.
export const addGoalTransaction = async (goal, { type, amount, note, date, countInBudget }) => {
    const before = goal.current_amount || 0;
    const after = type === 'deposit' ? before + amount : before - amount;
    if (after < 0) throw new Error('insufficient');

    let expenseId = null;
    if (type === 'deposit' && countInBudget) {
        const expense = await createRecord('expenses', goal.user_id, {
            amount, date: date || todayISO(), category: 'savings', bucket: 'Savings',
            source: 'momo', description: goal.name, goal_id: goal.id,
        });
        expenseId = expense.id;
    }

    await createRecord('transactions', goal.user_id, {
        goal_id: goal.id, amount, type, note: note || '',
        transaction_date: date || todayISO(), expense_id: expenseId,
    });

    const completed = after >= goal.target_amount;
    await updateRecord('goals', goal.id, {
        current_amount: after,
        is_completed: completed,
        completed_at: completed ? (goal.completed_at || new Date().toISOString()) : null,
    });

    const pctBefore = (before / goal.target_amount) * 100;
    const pctAfter = (after / goal.target_amount) * 100;
    return [...MILESTONES].reverse().find(m => pctBefore < m && pctAfter >= m) || null;
};

// Undo a goal transaction, including its linked budget entry
export const deleteGoalTransaction = async (goal, tx) => {
    const after = tx.type === 'deposit'
        ? (goal.current_amount || 0) - tx.amount
        : (goal.current_amount || 0) + tx.amount;
    await deleteRecord('transactions', tx.id);
    if (tx.expense_id) await deleteRecord('expenses', tx.expense_id);
    const completed = after >= goal.target_amount;
    await updateRecord('goals', goal.id, {
        current_amount: Math.max(after, 0),
        is_completed: completed,
        completed_at: completed ? goal.completed_at : null,
    });
};

// Editing the budget entry of a goal deposit keeps the deposit and the goal
// balance in step with it.
export const updateGoalDepositExpense = async (expense, { amount, date, source, description }) => {
    const tx = await db.transactions.filter(t => t.expense_id === expense.id).first();
    const goal = expense.goal_id ? await db.goals.get(expense.goal_id) : null;

    await updateRecord('expenses', expense.id, { amount, date, source, description });
    if (!tx || !goal) return;

    await updateRecord('transactions', tx.id, { amount, transaction_date: date, note: description || tx.note });
    const balance = Math.max((goal.current_amount || 0) + (amount - tx.amount), 0);
    const completed = balance >= goal.target_amount;
    await updateRecord('goals', goal.id, {
        current_amount: balance,
        is_completed: completed,
        completed_at: completed ? (goal.completed_at || new Date().toISOString()) : null,
    });
};

// Deleting the budget entry of a goal deposit removes the deposit too
export const deleteGoalDepositExpense = async (expense) => {
    const tx = await db.transactions.filter(t => t.expense_id === expense.id).first();
    const goal = expense.goal_id ? await db.goals.get(expense.goal_id) : null;
    if (tx && goal) await deleteGoalTransaction(goal, tx);
    else await deleteRecord('expenses', expense.id);
};

export const deleteGoal = async (goal) => {
    const txs = await db.transactions.where('goal_id').equals(goal.id).toArray();
    for (const tx of txs) await deleteRecord('transactions', tx.id);
    await deleteRecord('goals', goal.id);
};

// Monthly amount needed to hit the target by the deadline
export const requiredPerMonth = (goal, today = new Date()) => {
    if (!goal.deadline) return null;
    const remaining = goal.target_amount - (goal.current_amount || 0);
    if (remaining <= 0) return 0;
    const months = Math.max(differenceInCalendarMonths(parseISO(goal.deadline), today), 1);
    return remaining / months;
};

// Projects when a goal will be reached from the last 90 days of saving.
// status: 'done' | 'on_track' | 'behind' | 'no_data'
export const forecastGoal = (goal, transactions, today = new Date()) => {
    const remaining = goal.target_amount - (goal.current_amount || 0);
    const perMonthNeeded = requiredPerMonth(goal, today);
    if (remaining <= 0) return { status: 'done', eta: null, ratePerMonth: 0, perMonthNeeded: 0 };

    const created = goal.created_at ? parseISO(goal.created_at) : subDays(today, 90);
    const windowStart = created > subDays(today, 90) ? created : subDays(today, 90);
    const windowDays = Math.max(differenceInDays(today, windowStart), 30);
    const since = windowStart.toISOString().slice(0, 10);

    const net = transactions
        .filter(t => t.goal_id === goal.id && (t.transaction_date || t.created_at || '').slice(0, 10) >= since)
        .reduce((sum, t) => sum + (t.type === 'deposit' ? t.amount : -t.amount), 0);
    const ratePerMonth = (net / windowDays) * 30;

    if (ratePerMonth <= 0) return { status: 'no_data', eta: null, ratePerMonth: 0, perMonthNeeded };

    const eta = addMonths(today, Math.ceil(remaining / ratePerMonth));
    const onTrack = !goal.deadline || eta <= parseISO(goal.deadline);
    return { status: onTrack ? 'on_track' : 'behind', eta, ratePerMonth, perMonthNeeded };
};
