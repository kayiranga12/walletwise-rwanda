import { monthKey, entryMonth, shiftMonth, daysInMonthKey } from './format';

// Rwanda monthly PAYE (Law 027/2022 as amended by Law 051/2023)
export const PAYE_BRACKETS = [
    { upTo: 60000, rate: 0 },
    { upTo: 100000, rate: 0.10 },
    { upTo: 200000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 },
];
// Employee shares of RSSB pension and maternity, and community health (mutuelle)
export const RATES = { pension: 0.06, maternity: 0.003, cbhi: 0.005 };

export const calculatePaye = (taxable) => {
    let tax = 0, lower = 0;
    for (const { upTo, rate } of PAYE_BRACKETS) {
        if (taxable <= lower) break;
        tax += (Math.min(taxable, upTo) - lower) * rate;
        lower = upTo;
    }
    return tax;
};

// Estimated take-home pay for an employee earning `gross` RWF per month
export const calculateNetSalary = (gross) => {
    const g = Math.max(Number(gross) || 0, 0);
    const paye = calculatePaye(g);
    const pension = g * RATES.pension;
    const maternity = g * RATES.maternity;
    const beforeCbhi = g - paye - pension - maternity;
    const cbhi = Math.max(beforeCbhi, 0) * RATES.cbhi;
    return { gross: g, paye, pension, maternity, cbhi, net: beforeCbhi - cbhi };
};

// Recurring expenses still to come this month (their day hasn't arrived yet)
export const upcomingBills = (rules = [], today = new Date()) => {
    const month = monthKey(today);
    return rules
        .filter(r => r.active && r.kind === 'expense' && r.start_month <= month)
        .filter(r => !r.last_generated || r.last_generated < month)
        .map(r => ({ ...r, due_day: Math.min(r.day_of_month || 1, daysInMonthKey(month)) }))
        .filter(r => r.due_day >= today.getDate())
        .sort((a, b) => a.due_day - b.due_day);
};

// Average monthly "Needs" spending over the last 3 months that have any, for the emergency fund target
export const averageMonthlyNeeds = (expenses = [], today = new Date()) => {
    const totals = [];
    for (let i = 1; i <= 6 && totals.length < 3; i++) {
        const m = shiftMonth(monthKey(today), -i);
        const sum = expenses.filter(e => e.bucket === 'Needs' && entryMonth(e) === m).reduce((s, e) => s + Number(e.amount), 0);
        if (sum > 0) totals.push(sum);
    }
    if (totals.length === 0) {
        const sum = expenses.filter(e => e.bucket === 'Needs' && entryMonth(e) === monthKey(today)).reduce((s, e) => s + Number(e.amount), 0);
        return sum;
    }
    return totals.reduce((a, b) => a + b, 0) / totals.length;
};

export const EMERGENCY_MONTHS = 3;

// Salary received in a month: entries in the salary category, or all income if none are labelled
export const salaryForMonth = (incomes = [], month) => {
    const inMonth = incomes.filter(i => entryMonth(i) === month);
    const salary = inMonth.filter(i => i.category === 'salary');
    return (salary.length ? salary : inMonth).reduce((s, i) => s + Number(i.amount), 0);
};
