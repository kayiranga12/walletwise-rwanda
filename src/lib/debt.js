// Month-by-month payoff simulation for the user's loans.
// debts: [{ id, name, amount (balance), interest_rate (% per year), monthly_payment (minimum) }]
// strategy: 'avalanche' (highest interest first) or 'snowball' (smallest balance first)

const MAX_MONTHS = 600;

export const planDebtPayoff = (debts, extra = 0, strategy = 'avalanche') => {
    const list = debts
        .map(d => ({
            id: d.id, name: d.name,
            balance: Math.max(Number(d.amount) || 0, 0),
            rate: Math.max(Number(d.interest_rate) || 0, 0) / 100 / 12,
            minimum: Math.max(Number(d.monthly_payment) || 0, 0),
        }))
        .filter(d => d.balance > 0);

    if (list.length === 0) return { feasible: true, months: 0, totalInterest: 0, order: [] };

    const budget = list.reduce((s, d) => s + d.minimum, 0) + Math.max(Number(extra) || 0, 0);
    const priority = (a, b) => strategy === 'snowball'
        ? a.balance - b.balance || b.rate - a.rate
        : b.rate - a.rate || a.balance - b.balance;

    let month = 0, totalInterest = 0;
    const order = [];

    while (list.some(d => d.balance > 0.5) && month < MAX_MONTHS) {
        month++;
        for (const d of list) {
            if (d.balance <= 0) continue;
            const interest = d.balance * d.rate;
            d.balance += interest;
            totalInterest += interest;
        }
        // Minimums first, then everything left over goes to the priority debt
        let money = budget;
        for (const d of list) {
            if (d.balance <= 0) continue;
            const pay = Math.min(d.minimum, d.balance, money);
            d.balance -= pay;
            money -= pay;
        }
        for (const d of [...list].filter(x => x.balance > 0).sort(priority)) {
            if (money <= 0) break;
            const pay = Math.min(d.balance, money);
            d.balance -= pay;
            money -= pay;
        }
        for (const d of list) {
            if (d.balance <= 0.5 && !order.some(o => o.id === d.id)) {
                d.balance = 0;
                order.push({ id: d.id, name: d.name, month });
            }
        }
    }

    const feasible = !list.some(d => d.balance > 0.5);
    return { feasible, months: feasible ? month : null, totalInterest: Math.round(totalInterest), order, budget };
};
