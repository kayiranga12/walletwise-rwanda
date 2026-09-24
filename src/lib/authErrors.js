// Turns Firebase auth error codes into a friendly, translated message
export const authErrorKey = (code) => {
    if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(code)) return 'auth.errors.invalid';
    if (code === 'auth/email-already-in-use') return 'auth.errors.exists';
    if (code === 'auth/weak-password') return 'auth.errors.weak';
    if (code === 'auth/network-request-failed') return 'auth.errors.network';
    return 'auth.errors.generic';
};
