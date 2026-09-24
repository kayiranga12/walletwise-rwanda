// Local reminders shown as system notifications while the app is open or
// running in a background tab. (Reminders while the app is fully closed would
// need a push server, which WalletWise doesn't have.)

const KEY = 'walletwise:reminders';

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export const remindersEnabled = () => {
    try {
        return notificationsSupported() && Notification.permission === 'granted' && localStorage.getItem(KEY) === 'on';
    } catch { return false; }
};

export const enableReminders = async () => {
    if (!notificationsSupported()) return 'unsupported';
    const permission = await Notification.requestPermission();
    try { localStorage.setItem(KEY, permission === 'granted' ? 'on' : 'off'); } catch { /* private mode */ }
    return permission;
};

export const disableReminders = () => {
    try { localStorage.setItem(KEY, 'off'); } catch { /* private mode */ }
};

// Each reminder fires at most once per key (e.g. once per day)
const firstTime = (key) => {
    try {
        const k = `walletwise:notified:${key}`;
        if (localStorage.getItem(k)) return false;
        localStorage.setItem(k, '1');
        return true;
    } catch { return false; }
};

const notify = async (tag, title, body) => {
    const options = { body, tag, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' };
    const reg = await navigator.serviceWorker?.getRegistration?.().catch(() => null);
    if (reg?.showNotification) await reg.showNotification(title, options);
    else new Notification(title, options);
};

// reminders: [{ key, title, body }] already worked out from the user's data
export const sendReminders = async (reminders) => {
    if (!remindersEnabled()) return;
    for (const r of reminders) {
        if (firstTime(r.key)) await notify(r.key, r.title, r.body).catch(() => {});
    }
};
