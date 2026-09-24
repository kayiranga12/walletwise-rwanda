import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

// Every write goes through here: it saves locally first (so the app works
// offline) and queues the change for upload to Firestore.

const now = () => new Date().toISOString();

let onChange = () => {};
export const setChangeListener = (fn) => { onChange = fn; };

const queueTables = (table) => [db[table], db.syncQueue];

// Only the latest state of a document needs uploading, so older queued
// changes for the same document are replaced.
const queue = async (table, action, docId, userId, data) => {
    await db.syncQueue.where('[table+doc_id]').equals([table, docId]).delete();
    await db.syncQueue.add({ table, action, doc_id: docId, user_id: userId, data, timestamp: now() });
};

export const createRecord = async (table, userId, fields, id = uuidv4()) => {
    const record = { ...fields, id, user_id: userId, created_at: now(), updated_at: now() };
    await db.transaction('rw', queueTables(table), async () => {
        await db[table].put(record);
        await queue(table, 'UPSERT', id, userId, record);
    });
    onChange();
    return record;
};

export const updateRecord = async (table, id, changes) => {
    let record;
    await db.transaction('rw', queueTables(table), async () => {
        const existing = await db[table].get(id);
        if (!existing) throw new Error(`${table}/${id} not found`);
        record = { ...existing, ...changes, updated_at: now() };
        await db[table].put(record);
        await queue(table, 'UPSERT', id, record.user_id, record);
    });
    onChange();
    return record;
};

export const deleteRecord = async (table, id) => {
    await db.transaction('rw', queueTables(table), async () => {
        const existing = await db[table].get(id);
        if (!existing) return;
        await db[table].delete(id);
        await queue(table, 'DELETE', id, existing.user_id, null);
    });
    onChange();
};
