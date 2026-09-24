import { db } from './db';
import { updateRecord } from './repo';
import { v4 as uuidv4 } from 'uuid';
import { monthKey, shiftMonth, daysInMonthKey } from './format';

const now = () => new Date().toISOString();

// Creates the income/expense entries for every recurring rule that has come
// due since it last ran. Generated ids are derived from the rule and month, so
// two devices catching up at the same time produce the same document.
export const runRecurring = async (uid, today = new Date()) => {
    if (!uid) return 0;
    const rules = await db.recurring.where('user_id').equals(uid).toArray();
    const current = monthKey(today);
    let created = 0;

    for (const rule of rules) {
        if (!rule.active) continue;
        let month = rule.last_generated ? shiftMonth(rule.last_generated, 1) : rule.start_month;
        let lastDone = rule.last_generated;

        while (month <= current) {
            const day = Math.min(rule.day_of_month || 1, daysInMonthKey(month));
            if (month === current && today.getDate() < day) break;

            const table = rule.kind === 'income' ? 'incomes' : 'expenses';
            const id = `${rule.id}-${month}`;
            if (!(await db[table].get(id))) {
                const entry = {
                    id, user_id: uid, amount: rule.amount,
                    date: `${month}-${String(day).padStart(2, '0')}`,
                    category: rule.category, source: rule.source,
                    description: rule.description, recurring_id: rule.id,
                    created_at: now(), updated_at: now(),
                    ...(rule.kind === 'expense' ? { bucket: rule.bucket } : {}),
                };
                await db.transaction('rw', db[table], db.syncQueue, async () => {
                    await db[table].put(entry);
                    await db.syncQueue.add({
                        table, action: 'UPSERT', doc_id: id, user_id: uid, data: entry, timestamp: now()
                    });
                });
                created++;
            }
            lastDone = month;
            month = shiftMonth(month, 1);
        }

        if (lastDone !== rule.last_generated) {
            await updateRecord('recurring', rule.id, { last_generated: lastDone });
        }
    }
    return created;
};

export const newRuleId = () => uuidv4();
