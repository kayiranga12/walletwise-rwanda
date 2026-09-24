import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import useStore from '../store/useStore';
import { useMemo } from 'react';
import { DEFAULT_SPLIT } from './categories';
import { upcomingBills } from './salary';
import { normalizeRows } from './normalize';

const EMPTY = [];

// All of the signed-in user's rows in a table, live. `undefined` while loading.
export const useUserTable = (table) => {
    const uid = useStore(s => s.user?.id);
    return useLiveQuery(
        () => (uid ? db[table].where('user_id').equals(uid).toArray().then(normalizeRows) : EMPTY),
        [uid, table]
    );
};

// Recurring expenses still due later this month
export const useUpcomingBills = () => {
    const rules = useUserTable('recurring');
    return useMemo(() => (rules ? upcomingBills(rules) : []), [rules]);
};

export const useSettings = () => {
    const uid = useStore(s => s.user?.id);
    const row = useLiveQuery(() => (uid ? db.settings.get(uid) : null), [uid]);
    return useMemo(() => {
        // Only trust a saved split that is complete and adds up to 100%
        const saved = row?.split;
        const parts = saved && ['Needs', 'Wants', 'Savings'].map(k => Number(saved[k]));
        const split = parts && parts.every(Number.isFinite) && parts.reduce((a, b) => a + b, 0) === 100
            ? { Needs: parts[0], Wants: parts[1], Savings: parts[2] }
            : DEFAULT_SPLIT;
        const limits = {};
        for (const [k, v] of Object.entries(row?.category_limits || {})) {
            const n = Number(v);
            if (n > 0) limits[k] = n;
        }
        return { loaded: row !== undefined, split, limits, raw: row };
    }, [row]);
};
