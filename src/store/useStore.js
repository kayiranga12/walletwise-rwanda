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
        // Bypass login with a mock user
        set({
            isLoading: false,
            user: { id: 'mock-user-123', email: 'bypass@example.com', user_metadata: { username: 'Bypass User' } },
            session: { access_token: 'mock-token' }
        });
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null });
    }
}));

export default useStore;
