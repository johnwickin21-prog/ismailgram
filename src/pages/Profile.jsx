import { useState } from 'react';
import { Grid3X3, Bookmark, Video, Heart, MessageCircle, BadgeCheck, Link, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { POSTS, EXPLORE_POSTS, formatNumber } from '../data/mockData';
import EditProfile from '../components/Profile/EditProfile';

const TABS = [
  { id: 'posts', icon: Grid3X3, label: 'Posts' },
  { id: 'reels', icon: Video, label: 'Reels' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
];

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [showEdit, setShowEdit] = useState(false);

  const myPosts = POSTS.slice(0, 9).map(p => ({ ...p, user }));
  const savedPosts = POSTS.filter(p => p.saved).map(p => ({ ...p }));
  const reelPosts = EXPLORE_POSTS.filter(p => p.isReel).slice(0, 6);

  const getTabContent = () => {
    if (activeTab === 'posts') return myPosts;
    if (activeTab === 'saved') return savedPosts;
    if (activeTab === 'reels') return reelPosts;
    return [];
  };

  const tabContent = getTabContent();

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-ring" style={{ width: 150, height: 150, padding: 4 }}>
            <img src={user?.avatar} alt={user?.username} className="avatar" style={{ width: 138, height: 138, border: '3px solid var(--bg-primary)' }} />
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-username-row">
            <span className="profile-username">{user?.username}</span>
            {user?.verified && (
              <BadgeCheck size={22} className="verified" style={{ color: 'var(--accent-3)' }} />
            )}
            <div className="profile-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
                Edit Profile
              </button>
              <button className="btn btn-secondary btn-sm">
                View Archive
              </button>
              <button className="btn btn-ghost" style={{ padding: '6px 8px' }}>
                <Settings size={20} />
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-number">{formatNumber(user?.posts || 0)}</span>
              <span className="stat-label"> posts</span>
            </div>
            <div className="profile-stat" style={{ cursor: 'pointer' }}>
              <span className="stat-number">{formatNumber(user?.followers || 0)}</span>
              <span className="stat-label"> followers</span>
            </div>
            <div className="profile-stat" style={{ cursor: 'pointer' }}>
              <span className="stat-number">{formatNumber(user?.following || 0)}</span>
              <span className="stat-label"> following</span>
            </div>
          </div>

          <div className="profile-bio">
            <strong className="bio-name">{user?.name}</strong>
            {user?.bio && (
              <span style={{ whiteSpace: 'pre-line' }}>{user.bio}</span>
            )}
            {user?.website && (
              <a href={user.website} className="profile-link" target="_blank" rel="noopener noreferrer">
                <Link size={13} /> {user.website.replace('https://', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="profile-grid" style={{ marginTop: 2 }}>
        {tabContent.length === 0 ? (
          <div className="profile-empty-tab">
            <div style={{ fontSize: 48 }}>
              {activeTab === 'saved' ? '🔖' : activeTab === 'reels' ? '🎬' : '📸'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {activeTab === 'saved' ? 'No saved posts' : activeTab === 'reels' ? 'No reels yet' : 'Share your first photo'}
            </div>
          </div>
        ) : (
          tabContent.map(item => (
            <div key={item.id} className="profile-grid-item">
              <img src={item.image || item.thumbnail} alt="Post" loading="lazy" />
              <div className="overlay">
                <div className="overlay-stat">
                  <Heart size={16} fill="white" />
                  {formatNumber(item.likes || 0)}
                </div>
                <div className="overlay-stat">
                  <MessageCircle size={16} fill="white" />
                  {formatNumber(item.comments?.length || item.comments || 0)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEdit && <EditProfile onClose={() => setShowEdit(false)} />}
    </div>
  );
}
