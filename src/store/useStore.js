import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const readTheme = () => {
    try { return localStorage.getItem('theme') || 'system'; } catch { return 'system'; }
};

export const applyTheme = (theme) => {
    const dark = theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
};

let toastId = 0;

const useStore = create((set, get) => ({
    user: null,
    session: null,
    isLoading: true,

    // Sync status shown in the sidebar
    sync: { pending: 0, syncing: false, lastSyncedAt: null, error: null, online: navigator.onLine },

    // Toast notifications
    toasts: [],

    // Global "add transaction" sheet: null when closed, else { kind, entry? }
    quickAdd: null,

    // Goal milestone celebration: null or { goal, milestone }
    celebration: null,

    theme: readTheme(),

    // Actions
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (isLoading) => set({ isLoading }),
    setSync: (patch) => set({ sync: { ...get().sync, ...patch } }),

    toast: (message, type = 'success') => {
        const id = ++toastId;
        set({ toasts: [...get().toasts, { id, message, type }] });
        setTimeout(() => set({ toasts: get().toasts.filter(t => t.id !== id) }), 4000);
    },
    dismissToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),

    openQuickAdd: (kind = 'expense', entry = null) => set({ quickAdd: { kind, entry } }),
    closeQuickAdd: () => set({ quickAdd: null }),

    celebrate: (goal, milestone) => set({ celebration: { goal, milestone } }),
    closeCelebration: () => set({ celebration: null }),

    setTheme: (theme) => {
        try { localStorage.setItem('theme', theme); } catch { /* private mode */ }
        applyTheme(theme);
        set({ theme });
    },

    // Auth
    initializeAuth: () => {
        // Listen to Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdToken();
                const mappedUser = {
                    id: user.uid,
                    email: user.email,
                    user_metadata: {
                        username: user.displayName || 'Saver'
                    }
                };
                set({ user: mappedUser, session: { access_token: token }, isLoading: false });
            } else {
                set({ user: null, session: null, isLoading: false });
            }
        });

        return unsubscribe;
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null, session: null });
    }
}));

// Lets the dev server be exercised from the browser console
if (import.meta.env.DEV) window.__walletwiseStore = useStore;

export default useStore;
