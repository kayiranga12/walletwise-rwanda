import { db } from './db';
import { dbRemote } from './firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { setChangeListener } from './repo';
import useStore from '../store/useStore';

// Local Dexie table -> Firestore collection
export const COLLECTIONS = {
    goals: 'savings_goals',
    transactions: 'transactions',
    incomes: 'incomes',
    expenses: 'expenses',
    assets: 'assets',
    liabilities: 'liabilities',
    netWorthHistory: 'net_worth_history',
    recurring: 'recurring',
    settings: 'user_settings',
};

// Firestore rejects `undefined` fields
const clean = (data) => {
    const out = {};
    for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'synced') out[k] = v;
    }
    return out;
};

// Firestore writes wait for the server indefinitely on a flaky connection;
// give up after a while so one stuck write can't block the whole queue.
const TIMEOUT_MS = 20000;
const withTimeout = (promise) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'timeout' })), TIMEOUT_MS)),
]);

const refreshPending = async () => {
    useStore.getState().setSync({ pending: await db.syncQueue.count() });
};

let pushing = false;

// Upload queued local changes for the signed-in user.
export const pushChanges = async (uid) => {
    if (!uid || !navigator.onLine || pushing) return;
    pushing = true;
    let failed = 0;
    try {
        const queue = await db.syncQueue.orderBy('id').toArray();
        for (const item of queue) {
            // Changes made by another account on this device wait for that account.
            if (item.user_id && item.user_id !== uid) continue;
            const collectionName = COLLECTIONS[item.table] || item.table;
            if (!item.doc_id) {
                await db.syncQueue.delete(item.id);
                continue;
            }
            const ref = doc(dbRemote, collectionName, item.doc_id);
            try {
                if (item.action === 'DELETE') {
                    await withTimeout(deleteDoc(ref));
                } else {
                    await withTimeout(setDoc(ref, clean(item.data), { merge: true }));
                }
                await db.syncQueue.delete(item.id);
            } catch (err) {
                failed++;
                console.error(`Sync failed for ${item.table}/${item.doc_id}:`, err);
                useStore.getState().setSync({ error: err.code || err.message });
                // The server isn't answering; the rest would stall too, so retry later
                if (err.code === 'timeout' || err.code === 'unavailable') break;
            }
        }
        if (!failed) useStore.getState().setSync({ error: null });
    } finally {
        pushing = false;
        await refreshPending();
    }
};

// Download the user's data from Firestore and merge it into the local database.
// A local change still waiting in the queue always wins over the server copy.
export const pullChanges = async (uid) => {
    if (!uid || !navigator.onLine) return;
    const pendingKeys = new Set(
        (await db.syncQueue.toArray()).map(q => `${q.table}/${q.doc_id}`)
    );

    for (const [table, collectionName] of Object.entries(COLLECTIONS)) {
        let snapshot;
        try {
            snapshot = await withTimeout(getDocs(query(collection(dbRemote, collectionName), where('user_id', '==', uid))));
        } catch (err) {
            // Skip this table rather than risk deleting local rows on a failed read
            console.error(`Pull failed for ${collectionName}:`, err);
            useStore.getState().setSync({ error: err.code || err.message });
            continue;
        }

        const remoteIds = new Set();
        const local = await db[table].where('user_id').equals(uid).toArray();
        const localById = new Map(local.map(r => [r.id, r]));
        const puts = [];

        snapshot.forEach(d => {
            remoteIds.add(d.id);
            if (pendingKeys.has(`${table}/${d.id}`)) return;
            const remote = { ...d.data(), id: d.id };
            const mine = localById.get(d.id);
            if (!mine || (remote.updated_at || '') >= (mine.updated_at || '')) puts.push(remote);
        });

        // Rows removed on another device disappear here too
        const deletions = local
            .filter(r => !remoteIds.has(r.id) && !pendingKeys.has(`${table}/${r.id}`))
            .map(r => r.id);

        if (puts.length) await db[table].bulkPut(puts);
        if (deletions.length) await db[table].bulkDelete(deletions);
    }
};

export const fullSync = async (uid) => {
    const { setSync } = useStore.getState();
    setSync({ syncing: true });
    try {
        await pushChanges(uid);
        await pullChanges(uid);
        setSync({ lastSyncedAt: new Date().toISOString() });
    } finally {
        setSync({ syncing: false });
        await refreshPending();
    }
};

// Keeps local and cloud data in step for the signed-in user.
export const startAutoSync = (uid, { onPulled } = {}) => {
    const { setSync } = useStore.getState();

    // Dev only: localStorage 'walletwise:noSync' = '1' keeps test data off the real Firebase project
    if (import.meta.env.DEV && localStorage.getItem('walletwise:noSync') === '1') {
        console.warn('WalletWise sync disabled (walletwise:noSync)');
        refreshPending();
        return () => {};
    }
    let pushTimer;

    const runFull = async () => {
        await fullSync(uid);
        await onPulled?.();
    };

    // Push shortly after each local change instead of waiting for the interval
    setChangeListener(() => {
        refreshPending();
        clearTimeout(pushTimer);
        pushTimer = setTimeout(() => pushChanges(uid), 1500);
    });

    runFull();
    const pushInterval = setInterval(() => pushChanges(uid), 15000);
    const pullInterval = setInterval(runFull, 5 * 60 * 1000);

    const handleOnline = () => { setSync({ online: true }); runFull(); };
    const handleOffline = () => setSync({ online: false });
    const handleVisible = () => { if (document.visibilityState === 'visible') runFull(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
        clearTimeout(pushTimer);
        clearInterval(pushInterval);
        clearInterval(pullInterval);
        setChangeListener(() => {});
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisible);
    };
};
