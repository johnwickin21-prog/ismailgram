import { useState, useEffect } from 'react';
import { Grid3X3, Bookmark, Video, Heart, MessageCircle, BadgeCheck, Link, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { fetchUserPosts, fetchSavedPosts } from '../lib/db';
import { formatNumber } from '../lib/utils';
import EditProfile from '../components/Profile/EditProfile';

const TABS = [
  { id: 'posts', icon: Grid3X3, label: 'Posts' },
  { id: 'reels', icon: Video, label: 'Reels' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
];

export default function Profile() {
  const { user } = useAuth();
  const { posts } = useApp();
  const [activeTab, setActiveTab] = useState('posts');
  const [showEdit, setShowEdit] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Load user's own posts
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setTabLoading(true);
      try {
        const data = await fetchUserPosts(user.id);
        setMyPosts(data);
      } catch (err) {
        console.error('fetchUserPosts error:', err);
      } finally {
        setTabLoading(false);
      }
    };
    load();
  }, [user?.id, posts]); // re-run when posts change (new post added)

  // Load saved posts
  useEffect(() => {
    if (!user?.id || activeTab !== 'saved') return;
    const load = async () => {
      setTabLoading(true);
      try {
        const data = await fetchSavedPosts(user.id);
        setSavedPosts(data);
      } catch (err) {
        console.error('fetchSavedPosts error:', err);
      } finally {
        setTabLoading(false);
      }
    };
    load();
  }, [user?.id, activeTab]);

  const reelPosts = myPosts.filter(p => p.isVideo);

  const getTabContent = () => {
    if (activeTab === 'posts') return myPosts.filter(p => !p.isVideo);
    if (activeTab === 'reels') return reelPosts;
    if (activeTab === 'saved') return savedPosts;
    return [];
  };

  const tabContent = getTabContent();

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="avatar-ring" style={{ width: 150, height: 150, padding: 4 }}>
            <img
              src={user?.avatar}
              alt={user?.username}
              className="avatar"
              style={{ width: 138, height: 138, border: '3px solid var(--bg-primary)' }}
            />
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
              <span className="stat-number">{formatNumber(myPosts.length)}</span>
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
        {tabLoading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
          </div>
        ) : tabContent.length === 0 ? (
          <div className="profile-empty-tab">
            <div style={{ fontSize: 48 }}>
              {activeTab === 'saved' ? '🔖' : activeTab === 'reels' ? '🎬' : '📸'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {activeTab === 'saved' ? 'No saved posts' : activeTab === 'reels' ? 'No reels yet' : 'Share your first photo'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              {activeTab === 'posts' ? 'Your posts will appear here after you share them.' : ''}
            </div>
          </div>
        ) : (
          tabContent.map(item => (
            <div key={item.id} className="profile-grid-item">
              <img src={item.image} alt="Post" loading="lazy" />
              <div className="overlay">
                <div className="overlay-stat">
                  <Heart size={16} fill="white" />
                  {formatNumber(item.likes || 0)}
                </div>
                <div className="overlay-stat">
                  <MessageCircle size={16} fill="white" />
                  {formatNumber(item.comments?.length || 0)}
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
