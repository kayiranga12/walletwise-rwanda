import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import useStore from '../store/useStore';
import { DEFAULT_SPLIT } from './categories';

const EMPTY = [];

// All of the signed-in user's rows in a table, live. `undefined` while loading.
export const useUserTable = (table) => {
    const uid = useStore(s => s.user?.id);
    return useLiveQuery(
        () => (uid ? db[table].where('user_id').equals(uid).toArray() : EMPTY),
        [uid, table]
    );
};

export const useSettings = () => {
    const uid = useStore(s => s.user?.id);
    const row = useLiveQuery(() => (uid ? db.settings.get(uid) : null), [uid]);
    return {
        loaded: row !== undefined,
        split: row?.split || DEFAULT_SPLIT,
        raw: row,
    };
};
