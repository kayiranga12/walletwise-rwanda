import { db } from './db';
import { createRecord, updateRecord } from './repo';

// One settings row per user, keyed by their uid
export const saveSettings = async (uid, changes) => {
    if (await db.settings.get(uid)) await updateRecord('settings', uid, changes);
    else await createRecord('settings', uid, changes, uid);
};
