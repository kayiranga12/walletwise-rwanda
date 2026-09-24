import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { createRecord, updateRecord } from './repo';

// One settings row per user, keyed by their uid
export const saveSettings = async (uid, changes) => {
    if (await db.settings.get(uid)) await updateRecord('settings', uid, changes);
    else await createRecord('settings', uid, changes, uid);
};

// Read-modify-write of one settings field
const updateField = async (uid, field, fn) => {
    const row = await db.settings.get(uid);
    await saveSettings(uid, { [field]: fn(row?.[field]) });
};

/* Waiting list: purchases paused by "think before you buy" */
export const addToWishlist = (uid, item) =>
    updateField(uid, 'wishlist', (list = []) => [...list, { ...item, id: uuidv4(), created_at: new Date().toISOString() }]);

export const removeFromWishlist = async (uid, id, { skipped = false } = {}) => {
    const row = await db.settings.get(uid);
    const item = (row?.wishlist || []).find(w => w.id === id);
    const changes = { wishlist: (row?.wishlist || []).filter(w => w.id !== id) };
    // Money not spent on a skipped purchase counts towards the "wise skip" total
    if (skipped && item) changes.skipped_total = (Number(row?.skipped_total) || 0) + Number(item.amount || 0);
    await saveSettings(uid, changes);
};

/* Monthly commitments, keyed by 'yyyy-MM' */
export const setCommitment = (uid, month, commitment) =>
    updateField(uid, 'commitments', (all = {}) => {
        const next = { ...all };
        if (commitment) next[month] = commitment; else delete next[month];
        return next;
    });

/* Challenges */
export const startChallenge = (uid, type, start) =>
    updateField(uid, 'challenges', (list = []) => [...list, { id: uuidv4(), type, start }]);

export const removeChallenge = (uid, id) =>
    updateField(uid, 'challenges', (list = []) => list.filter(c => c.id !== id));
