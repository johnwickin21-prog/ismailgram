import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';

import Sidebar from './components/Layout/Sidebar';
import BottomNav from './components/Layout/BottomNav';
import CreatePost from './components/Post/CreatePost';

import Login from './pages/Login';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedLayout() {
  const [showCreate, setShowCreate] = useState(false);
  const { toasts } = useApp();

  return (
    <div className="app-layout">
      <Sidebar onCreatePost={() => setShowCreate(true)} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav onCreatePost={() => setShowCreate(true)} />

      {showCreate && <CreatePost onClose={() => setShowCreate(false)} />}

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.message}</div>
        ))}
      </div>
    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();
  const { initData, clearData } = useApp();

  // Initialize data when user logs in, clear when logs out
  useEffect(() => {
    if (user?.id) {
      initData(user.id);
    } else if (!loading) {
      clearData();
    }
  }, [user?.id, loading]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      </div>
    );
  }

  return user ? <ProtectedLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<AuthGuard />} />
    </Routes>
  );
}
