import { db } from './db';
import { createRecord, updateRecord } from './repo';
import { todayISO } from './format';

// Stores today's net worth so the history chart grows as assets change.
export const recordNetWorthSnapshot = async (uid) => {
    const [assets, liabilities] = await Promise.all([
        db.assets.where('user_id').equals(uid).toArray(),
        db.liabilities.where('user_id').equals(uid).toArray(),
    ]);
    const total = (rows) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const netWorth = total(assets) - total(liabilities);
    const today = todayISO();

    const existing = await db.netWorthHistory.where('[user_id+date]').equals([uid, today]).first();
    if (existing) {
        await updateRecord('netWorthHistory', existing.id, { net_worth: netWorth });
    } else {
        // One snapshot per user per day, with a stable id across devices
        await createRecord('netWorthHistory', uid, { date: today, net_worth: netWorth }, `${uid}-${today}`);
    }
};
