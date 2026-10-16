import { NavLink } from 'react-router-dom';
import { Home, Search, Clapperboard, MessageCircle, Bell, PlusSquare, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BottomNav({ onCreatePost }) {
  const { unreadNotifCount, unreadMsgCount } = useApp();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/explore', icon: Search, label: 'Explore' },
    { to: '/reels', icon: Clapperboard, label: 'Reels' },
    { to: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadMsgCount },
    { to: '/notifications', icon: Bell, label: 'Notifications', badge: unreadNotifCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Icon size={22} />
          {badge > 0 && <span className="bottom-nav-badge">{badge > 9 ? '9+' : badge}</span>}
        </NavLink>
      ))}
      <button className="bottom-nav-item" onClick={onCreatePost}>
        <PlusSquare size={22} />
      </button>
    </nav>
  );
}
