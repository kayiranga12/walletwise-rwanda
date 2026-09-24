import Dexie from 'dexie';

export const db = new Dexie('WalletWiseDB');

db.version(1).stores({
    users: 'id, email',
    goals: 'id, user_id, name, created_at, synced', // Added synced for local tracking
    transactions: 'id, goal_id, synced, created_at',
    syncQueue: '++id, table, action, data, timestamp'
});

db.version(2).stores({
    users: 'id, email',
    goals: 'id, user_id, name, created_at, synced',
    transactions: 'id, goal_id, synced, created_at',
    syncQueue: '++id, table, action, data, timestamp',
    incomes: 'id, user_id, amount, date, synced, created_at',
    expenses: 'id, user_id, amount, category, date, synced, created_at',
    assets: 'id, user_id, name, type, amount, synced, created_at',
    liabilities: 'id, user_id, name, type, amount, synced, created_at',
    netWorthHistory: 'id, user_id, date, net_worth'
});

// v3: every table is synced to Firestore, expenses gain a spending category
// separate from their 50/30/20 bucket, and recurring items + settings exist.
db.version(3).stores({
    users: 'id, email',
    goals: 'id, user_id, created_at',
    transactions: 'id, goal_id, user_id, created_at',
    syncQueue: '++id, table, doc_id, [table+doc_id], user_id, timestamp',
    incomes: 'id, user_id, date',
    expenses: 'id, user_id, date, category',
    assets: 'id, user_id',
    liabilities: 'id, user_id',
    netWorthHistory: 'id, user_id, date, [user_id+date]',
    recurring: 'id, user_id',
    settings: 'id, user_id'
}).upgrade(async (tx) => {
    const now = new Date().toISOString();
    const queue = tx.table('syncQueue');

    // Legacy queue items only carried partial updates; the local rows are the
    // latest state, so re-queue whole rows instead. Pending deletes are kept.
    const legacy = await queue.toArray();
    await queue.clear();
    for (const item of legacy) {
        if (item.action === 'DELETE') {
            await queue.add({
                table: item.table, action: 'DELETE', doc_id: item.data?.id,
                user_id: null, data: null, timestamp: item.timestamp
            });
        }
    }

    const goalOwner = {};
    await tx.table('goals').toCollection().each(g => { goalOwner[g.id] = g.user_id; });

    // Goal transactions had no owner; give them one so they can be queried per user.
    await tx.table('transactions').toCollection().modify(t => {
        if (!t.user_id) t.user_id = goalOwner[t.goal_id] || null;
    });

    // Expenses stored the 50/30/20 bucket in `category`; move it to `bucket`.
    await tx.table('expenses').toCollection().modify(e => {
        if (!e.bucket) {
            e.bucket = ['Needs', 'Wants', 'Savings'].includes(e.category) ? e.category : 'Needs';
            e.category = 'other';
        }
        if (!e.source) e.source = 'cash';
    });
    await tx.table('incomes').toCollection().modify(i => {
        if (!i.category) i.category = 'other';
        if (!i.source) i.source = 'cash';
    });

    // Incomes, expenses, assets, liabilities and history were marked "synced"
    // but never uploaded. Queue every row so it finally reaches the cloud.
    for (const table of ['goals', 'transactions', 'incomes', 'expenses', 'assets', 'liabilities', 'netWorthHistory']) {
        const rows = await tx.table(table).toArray();
        for (const row of rows) {
            if (!row.user_id) continue;
            const data = { ...row, updated_at: row.updated_at || now };
            delete data.synced;
            await tx.table(table).put(data);
            await queue.add({
                table, action: 'UPSERT', doc_id: row.id,
                user_id: row.user_id, data, timestamp: now
            });
        }
    }
});
