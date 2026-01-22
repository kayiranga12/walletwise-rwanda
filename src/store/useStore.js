import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useStore = create((set, get) => ({
    user: null,
    session: null,
    isLoading: true,

    // Actions
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (isLoading) => set({ isLoading }),

    // Auth
    initializeAuth: async () => {
        set({ isLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ session, user: session?.user ?? null });

            supabase.auth.onAuthStateChange((_event, session) => {
                set({ session, user: session?.user ?? null });
            });
        } catch (error) {
            console.error('Error initializing auth:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
}));

export default useStore;
