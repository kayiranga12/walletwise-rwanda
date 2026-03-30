import { db } from './db';
import { dbRemote } from './firebase';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export const syncData = async () => {
    if (!navigator.onLine) return;

    const queue = await db.syncQueue.toArray();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} items to Firebase...`);

    for (const item of queue) {
        try {
            let hasError = false;

            // Map Dexie tables to Firestore collections
            let collectionName = item.table;
            if (item.table === 'goals') collectionName = 'savings_goals';

            const docRef = doc(dbRemote, collectionName, item.data.id);

            try {
                if (item.action === 'INSERT') {
                    await setDoc(docRef, item.data);
                } else if (item.action === 'UPDATE') {
                    const updates = { ...item.data };
                    delete updates.id;
                    await updateDoc(docRef, updates);
                } else if (item.action === 'DELETE') {
                    await deleteDoc(docRef);
                }
            } catch (err) {
                console.error('Firebase sync error:', err);
                hasError = true;
            }

            if (hasError) {
                console.error('Sync failed for item:', item);
                // Can retry manually later or handle specific edge cases here
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
