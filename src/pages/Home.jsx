import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import StoriesBar from '../components/Stories/StoriesBar';
import PostCard from '../components/Post/PostCard';
import { USERS, formatNumber } from '../data/mockData';
import { useState } from 'react';

export default function Home() {
  const { posts, stories } = useApp();
  const { user } = useAuth();
  const [followStates, setFollowStates] = useState(
    Object.fromEntries(USERS.map(u => [u.id, u.isFollowing]))
  );

  const suggestions = USERS.filter(u => !followStates[u.id]).slice(0, 5);

  const toggleFollow = (uid) => {
    setFollowStates(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  return (
    <div className="home-layout" style={{ paddingTop: 20 }}>
      <div className="feed-column">
        <StoriesBar stories={stories} />
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          ✨ You're all caught up!
        </div>
      </div>

      {/* Suggestions sidebar */}
      <aside className="suggestions-sidebar">
        <div className="suggestions-user">
          <div className="avatar-ring" style={{ width: 46, height: 46, padding: 2 }}>
            <img src={user?.avatar} alt="me" className="avatar" style={{ width: 38, height: 38, border: '2px solid var(--bg-primary)' }} />
          </div>
          <div className="user-info">
            <div className="name">{user?.username}</div>
            <div className="handle">{user?.name}</div>
          </div>
          <button style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-3)' }}>Switch</button>
        </div>

        <div className="suggestions-title">
          <span>Suggested for you</span>
          <button style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>See All</button>
        </div>

        {USERS.slice(0, 5).map(u => (
          <div key={u.id} className="suggestion-item">
            <div className="avatar-ring" style={{ width: 38, height: 38, padding: 2 }}>
              <img src={u.avatar} alt={u.username} className="avatar" style={{ width: 30, height: 30, border: '2px solid var(--bg-primary)' }} />
            </div>
            <div className="suggestion-info">
              <div className="suggestion-name">{u.username}</div>
              <div className="suggestion-reason">
                {u.isFollowing ? 'Following' : `${formatNumber(u.followers)} followers`}
              </div>
            </div>
            <button
              className={followStates[u.id] ? 'btn-following' : 'btn-follow'}
              onClick={() => toggleFollow(u.id)}
            >
              {followStates[u.id] ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.8 }}>
          About · Help · Press · API · Jobs<br />
          Privacy · Terms · Locations<br /><br />
          © 2024 IsmailGram
        </div>
      </aside>
    </div>
  );
}
