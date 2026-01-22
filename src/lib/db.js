import Dexie from 'dexie';

export const db = new Dexie('WalletWiseDB');

db.version(1).stores({
    users: 'id, email',
    goals: 'id, user_id, name, created_at, synced', // Added synced for local tracking
    transactions: 'id, goal_id, synced, created_at',
    syncQueue: '++id, table, action, data, timestamp'
});

// Helper to add to sync queue
export const addToSyncQueue = async (table, action, data) => {
    await db.syncQueue.add({
        table,
        action,
        data,
        timestamp: new Date().toISOString()
    });
};
