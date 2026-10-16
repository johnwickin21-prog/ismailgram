import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Search, Clapperboard, MessageCircle, Bell,
  PlusSquare, User, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ onCreatePost }) {
  const { user, logout } = useAuth();
  const { unreadNotifCount, unreadMsgCount } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/explore', icon: Search, label: 'Explore' },
    { to: '/reels', icon: Clapperboard, label: 'Reels' },
    { to: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadMsgCount },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src="/ismailgram_logo.jpg"
          alt="IsmailGram Logo"
          style={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <span className="logo-text">IsmailGram</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><Icon size={22} /></span>
            {label}
            {badge > 0 && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}

        <button className="nav-item" onClick={onCreatePost} style={{ width: '100%', textAlign: 'left' }}>
          <span className="nav-icon"><PlusSquare size={22} /></span>
          Create
        </button>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="sidebar-user">
          <img
            src={user?.avatar}
            alt={user?.username}
            className="avatar"
            style={{ width: 32, height: 32 }}
          />
          <div>
            <div className="user-name">{user?.username}</div>
            <div className="user-handle">{user?.name}</div>
          </div>
        </NavLink>

        {/* Settings link */}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon"><Settings size={22} /></span>
          Settings
        </NavLink>

        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon"><LogOut size={22} /></span>
          Log out
        </button>
      </div>
    </aside>
  );
}
