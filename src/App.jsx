import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import useStore from './store/useStore';
import { startAutoSync } from './lib/sync';
import Header from './components/Shared/Header';
import Dashboard from './components/Dashboard/Dashboard';
import CreateGoal from './components/Goals/CreateGoal';
import GoalDetail from './components/Goals/GoalDetail';
import ProfileSettings from './components/Profile/ProfileSettings';

// Placeholder Components


const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useStore();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (accessible only if NOT logged in, e.g. Login/Signup)
const PublicRoute = ({ children }) => {
  const { user, isLoading } = useStore();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { initializeAuth } = useStore();

  useEffect(() => {
    initializeAuth();
    const cleanupSync = startAutoSync();
    return () => cleanupSync();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/goals/new" element={
              <ProtectedRoute>
                <CreateGoal />
              </ProtectedRoute>
            } />
            <Route path="/goals/:id" element={
              <ProtectedRoute>
                <GoalDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
