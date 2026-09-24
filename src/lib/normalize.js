// Records can arrive from Firestore (or older app versions) with dates stored as
// Timestamps and amounts stored as text. Everything in the app expects ISO date
// strings and numbers, so rows are cleaned here before anything else sees them.

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SOURCES } from './categories';

const CATEGORY_IDS = new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => c.id));
const SOURCE_IDS = new Set(SOURCES.map(s => s.id));

const DATE_FIELDS = ['date', 'transaction_date', 'created_at', 'updated_at', 'deadline', 'completed_at'];
const DAY_FIELDS = new Set(['date', 'deadline']); // stored as 'yyyy-MM-dd'
const NUMBER_FIELDS = ['amount', 'target_amount', 'current_amount', 'net_worth', 'day_of_month', 'monthly_contribution'];

export const toISO = (value) => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') return value;
    let d = null;
    if (value instanceof Date) d = value;
    else if (typeof value.toDate === 'function') d = value.toDate();
    else if (typeof value === 'object' && 'seconds' in value) d = new Date(value.seconds * 1000);
    else if (typeof value === 'number') d = new Date(value);
    return d && !isNaN(d) ? d.toISOString() : null;
};

// `labels: false` fixes types only (used before storing); the label defaults are for display.
export const normalizeRow = (row, { labels = true } = {}) => {
    if (!row || typeof row !== 'object') return row;
    let out = row;
    const set = (key, value) => {
        if (out === row) out = { ...row };
        out[key] = value;
    };
    for (const key of DATE_FIELDS) {
        const v = row[key];
        if (v !== undefined && v !== null && typeof v !== 'string') {
            const iso = toISO(v);
            set(key, iso && DAY_FIELDS.has(key) ? iso.slice(0, 10) : iso);
        }
    }
    for (const key of NUMBER_FIELDS) {
        const v = row[key];
        if (v !== undefined && v !== null && typeof v !== 'number') {
            const n = Number(v);
            set(key, Number.isFinite(n) ? n : 0);
        }
    }
    // Income/expense-like rows: unknown or missing labels show as "Other" / "Cash"
    if (labels && 'amount' in row) {
        if (!CATEGORY_IDS.has(row.category)) set('category', 'other');
        if (!SOURCE_IDS.has(row.source)) set('source', 'cash');
    }
    return out;
};

export const normalizeRows = (rows) => (Array.isArray(rows) ? rows.map(r => normalizeRow(r)) : rows);
