import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserPlus, AtSign, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatNumber } from '../data/mockData';

const ICON_MAP = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  mention: AtSign,
};

const COLOR_MAP = {
  like: '#ff6b6b',
  comment: '#4fc3f7',
  follow: '#a78bfa',
  mention: '#fbbf24',
};

export default function Notifications() {
  const { notifications, markNotificationsRead } = useApp();
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => markNotificationsRead(), 1500);
    return () => clearTimeout(timer);
  }, []);

  const today = notifications.filter(n => n.unread || n.timestamp.includes('m ago') || n.timestamp.includes('h ago'));
  const earlier = notifications.filter(n => n.timestamp.includes('d ago'));

  return (
    <div className="notifications-page">
      <h1 className="notifications-header">Notifications</h1>

      {today.length > 0 && (
        <div className="notifications-section">
          <div className="notifications-section-title">Recent</div>
          {today.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              followState={followStates[n.user.id]}
              onFollow={() => setFollowStates(prev => ({ ...prev, [n.user.id]: !prev[n.user.id] }))}
            />
          ))}
        </div>
      )}

      {earlier.length > 0 && (
        <div className="notifications-section">
          <div className="notifications-section-title">Earlier</div>
          {earlier.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              followState={followStates[n.user.id]}
              onFollow={() => setFollowStates(prev => ({ ...prev, [n.user.id]: !prev[n.user.id] }))}
            />
          ))}
        </div>
      )}

      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>No notifications yet</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>When someone likes or comments, you'll see it here.</div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, followState, onFollow }) {
  const Icon = ICON_MAP[n.type] || Heart;
  const iconColor = COLOR_MAP[n.type] || 'var(--accent-2)';

  return (
    <div className={`notification-item ${n.unread ? 'unread' : ''}`}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={n.user.avatar} alt={n.user.username} className="avatar" style={{ width: 46, height: 46 }} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--bg-secondary)',
          border: '2px solid var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={11} style={{ color: iconColor }} fill={iconColor} />
        </div>
      </div>

      <div className="notification-content">
        <span className="username">{n.user.username}</span>
        <span className="action"> {n.text}</span>
        <div className="notification-time">{n.timestamp}</div>
      </div>

      {n.postImage && (
        <img src={n.postImage} alt="post" className="notification-thumb" />
      )}

      {n.type === 'follow' && (
        <button
          className={`notification-action-btn ${followState ? 'btn-following' : 'btn-follow'}`}
          onClick={onFollow}
        >
          {followState ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}
