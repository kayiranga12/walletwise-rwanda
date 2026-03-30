import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const useStore = create((set) => ({
    user: null,
    session: null,
    isLoading: true,

    // Actions
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (isLoading) => set({ isLoading }),

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

export default useStore;
