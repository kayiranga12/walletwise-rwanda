import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useStore, { applyTheme } from './store/useStore';
import { startAutoSync } from './lib/sync';
import { runRecurring } from './lib/recurring';
import AppLayout from './components/Shared/AppLayout';
import Toasts from './components/ui/Toasts';
import { Spinner } from './components/ui/bits';

// Each screen loads on demand so the first paint stays fast on slow connections
const Login = lazy(() => import('./components/Auth/Login'));
const Signup = lazy(() => import('./components/Auth/Signup'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const MoneyPage = lazy(() => import('./components/Money/MoneyPage'));
const BudgetDashboard = lazy(() => import('./components/Budget/BudgetDashboard'));
const GoalsPage = lazy(() => import('./components/Goals/GoalsPage'));
const CreateGoal = lazy(() => import('./components/Goals/CreateGoal'));
const EditGoal = lazy(() => import('./components/Goals/CreateGoal').then(m => ({ default: m.EditGoal })));
const GoalDetail = lazy(() => import('./components/Goals/GoalDetail'));
const NetWorthDashboard = lazy(() => import('./components/NetWorth/NetWorthDashboard'));
const RecurringPage = lazy(() => import('./components/Recurring/RecurringPage'));
const ReportsPage = lazy(() => import('./components/Reports/ReportsPage'));
const ProfileSettings = lazy(() => import('./components/Profile/ProfileSettings'));
const MorePage = lazy(() => import('./components/Shared/MorePage'));

const FullScreenLoader = () => (
    <div className="flex justify-center items-center h-screen"><Spinner /></div>
);

const ProtectedRoute = ({ children }) => {
    const { user, isLoading } = useStore();
    if (isLoading) return <FullScreenLoader />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

// Public Route (accessible only if NOT logged in, e.g. Login/Signup)
const PublicRoute = ({ children }) => {
    const { user, isLoading } = useStore();
    if (isLoading) return <FullScreenLoader />;
    if (user) return <Navigate to="/" replace />;
    return children;
};

function App() {
    const initializeAuth = useStore(s => s.initializeAuth);
    const uid = useStore(s => s.user?.id);
    const theme = useStore(s => s.theme);

    useEffect(() => initializeAuth(), [initializeAuth]);

    // Sync (and catch up recurring items) for whoever is signed in
    useEffect(() => {
        if (!uid) return;
        runRecurring(uid);
        return startAutoSync(uid, { onPulled: () => runRecurring(uid) });
    }, [uid]);

    // Follow the OS setting live when the theme is "system"
    useEffect(() => {
        applyTheme(theme);
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyTheme('system');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [theme]);

    return (
        <Router>
            <Toasts />
            <Suspense fallback={<FullScreenLoader />}>
                <Routes>
                    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
                        <Route path="/money" element={<Suspense fallback={<Spinner />}><MoneyPage /></Suspense>} />
                        <Route path="/budget" element={<Suspense fallback={<Spinner />}><BudgetDashboard /></Suspense>} />
                        <Route path="/goals" element={<Suspense fallback={<Spinner />}><GoalsPage /></Suspense>} />
                        <Route path="/goals/new" element={<Suspense fallback={<Spinner />}><CreateGoal /></Suspense>} />
                        <Route path="/goals/:id" element={<Suspense fallback={<Spinner />}><GoalDetail /></Suspense>} />
                        <Route path="/goals/:id/edit" element={<Suspense fallback={<Spinner />}><EditGoal /></Suspense>} />
                        <Route path="/net-worth" element={<Suspense fallback={<Spinner />}><NetWorthDashboard /></Suspense>} />
                        <Route path="/recurring" element={<Suspense fallback={<Spinner />}><RecurringPage /></Suspense>} />
                        <Route path="/reports" element={<Suspense fallback={<Spinner />}><ReportsPage /></Suspense>} />
                        <Route path="/profile" element={<Suspense fallback={<Spinner />}><ProfileSettings /></Suspense>} />
                        <Route path="/more" element={<Suspense fallback={<Spinner />}><MorePage /></Suspense>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
