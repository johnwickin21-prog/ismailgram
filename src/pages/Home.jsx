import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import StoriesBar from '../components/Stories/StoriesBar';
import PostCard from '../components/Post/PostCard';
import { fetchAllProfiles, fetchFollowing, toggleFollow as dbToggleFollow } from '../lib/db';
import { formatNumber } from '../lib/utils';

export default function Home() {
  const { posts, stories, postsLoading } = useApp();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [followStates, setFollowStates] = useState({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Load suggestions (users not followed)
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setSuggestionsLoading(true);
      try {
        const [allProfiles, followingIds] = await Promise.all([
          fetchAllProfiles(user.id),
          fetchFollowing(user.id),
        ]);
        const followingSet = new Set(followingIds);
        const states = {};
        allProfiles.forEach(p => { states[p.id] = followingSet.has(p.id); });
        setFollowStates(states);
        // Show up to 5 users not followed
        const notFollowed = allProfiles.filter(p => !followingSet.has(p.id)).slice(0, 5);
        setSuggestions(notFollowed.map(p => ({
          id: p.id,
          username: p.username,
          name: p.name,
          avatar: p.avatar_url,
          followers: p.followers,
          verified: p.verified,
        })));
      } catch (err) {
        console.error('load suggestions error:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleToggleFollow = async (uid) => {
    if (!user?.id) return;
    const current = followStates[uid] || false;
    setFollowStates(prev => ({ ...prev, [uid]: !current }));
    try {
      await dbToggleFollow(user.id, uid);
    } catch (err) {
      setFollowStates(prev => ({ ...prev, [uid]: current }));
      console.error('toggleFollow error:', err);
    }
  };

  return (
    <div className="home-layout" style={{ paddingTop: 20 }}>
      <div className="feed-column">
        <StoriesBar stories={stories} />

        {postsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 36, height: 36 }} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>No posts yet</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Follow people or be the first to share a post!</div>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              ✨ You're all caught up!
            </div>
          </>
        )}
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

        {suggestionsLoading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div className="spinner" style={{ margin: '0 auto', width: 20, height: 20 }} />
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
            No suggestions yet. Invite your friends!
          </div>
        ) : (
          suggestions.map(u => (
            <div key={u.id} className="suggestion-item">
              <div className="avatar-ring" style={{ width: 38, height: 38, padding: 2 }}>
                <img src={u.avatar} alt={u.username} className="avatar" style={{ width: 30, height: 30, border: '2px solid var(--bg-primary)' }} />
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{u.username}</div>
                <div className="suggestion-reason">
                  {formatNumber(u.followers)} followers
                </div>
              </div>
              <button
                className={followStates[u.id] ? 'btn-following' : 'btn-follow'}
                onClick={() => handleToggleFollow(u.id)}
              >
                {followStates[u.id] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))
        )}

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.8 }}>
          About · Help · Press · API · Jobs<br />
          Privacy · Terms · Locations<br /><br />
          © 2024 IsmailGram
        </div>
      </aside>
    </div>
  );
}
