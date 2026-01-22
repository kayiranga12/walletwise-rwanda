import { db } from './db';
import { supabase } from './supabase';

export const syncData = async () => {
    if (!navigator.onLine) return;

    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items...`);

    for (const item of queue) {
        try {
            let error = null;

            // Handle different tables
            if (item.table === 'goals') {
                if (item.action === 'INSERT') {
                    const { error: err } = await supabase.from('savings_goals').insert(item.data);
                    error = err;
                } else if (item.action === 'UPDATE') {
                    const { id, ...updates } = item.data;
                    const { error: err } = await supabase.from('savings_goals').update(updates).eq('id', id);
                    error = err;
                } else if (item.action === 'DELETE') {
                    const { error: err } = await supabase.from('savings_goals').delete().eq('id', item.data.id);
                    error = err;
                }
            } else if (item.table === 'transactions') {
                if (item.action === 'INSERT') {
                    const { error: err } = await supabase.from('transactions').insert(item.data);
                    error = err;
                }
                // Add UPDATE/DELETE for transactions if needed
            }

            if (error) {
                console.error('Sync failed for item:', item, error);
                // If error is not retryable (e.g. duplicate key), maybe delete from queue?
                // For now, we keep it to retry later or handle manually
            } else {
                // Remove from queue on success
                await db.syncQueue.delete(item.id);
            }

        } catch (e) {
            console.error('Sync execution error:', e);
        }
    }
};

// Auto-sync hook or function to run periodically
export const startAutoSync = (intervalMs = 15000) => {
    // Initial sync
    syncData();

    // Periodic sync
    const interval = setInterval(() => {
        syncData();
    }, intervalMs);

    // Sync when coming online
    window.addEventListener('online', syncData);

    return () => {
        clearInterval(interval);
        window.removeEventListener('online', syncData);
    };
};
