import { useState, useEffect, useMemo } from 'react';
import { Search, X, Video } from 'lucide-react';
import { Heart, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchProfiles } from '../lib/db';
import { formatNumber } from '../lib/utils';

const TABS = ['Posts', 'Accounts', 'Tags'];

export default function Explore() {
  const { posts } = useApp();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('Posts');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // All posts for explore grid (shuffle-like display)
  const explorePosts = useMemo(() => {
    return [...posts].reverse(); // show oldest first for variety
  }, [posts]);

  // Debounced search for accounts
  useEffect(() => {
    if (tab !== 'Accounts') return;
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchProfiles(query.trim());
        setSearchResults(results);
      } catch (err) {
        console.error('searchProfiles error:', err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, tab]);

  return (
    <div className="explore-page">
      {/* Search bar */}
      <div className="explore-search">
        <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          id="explore-search-input"
          type="text"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="explore-tabs">
        {TABS.map(t => (
          <button key={t} className={`explore-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'Posts' && (
        explorePosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>No posts to explore yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Share posts to see them here!</div>
          </div>
        ) : (
          <div className="explore-grid">
            {explorePosts.map((item, idx) => (
              <div
                key={item.id}
                className="explore-grid-item"
                style={idx === 3 ? { gridColumn: 'span 1', gridRow: 'span 2', aspectRatio: '1 / 2' } : {}}
              >
                <img src={item.image} alt="Explore" loading="lazy" />
                {item.isVideo && (
                  <div className="reel-play-icon"><Video size={18} /></div>
                )}
                <div className="overlay">
                  <div className="overlay-stat"><Heart size={16} fill="white" /> {formatNumber(item.likes)}</div>
                  <div className="overlay-stat"><MessageCircle size={16} fill="white" /> {formatNumber(item.comments?.length || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'Accounts' && (
        <div className="accounts-list">
          {searching ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
            </div>
          ) : query.trim().length >= 2 && searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No accounts found for "{query}"
            </div>
          ) : query.trim().length < 2 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Type at least 2 characters to search for accounts
            </div>
          ) : (
            searchResults.map(u => (
              <AccountItem key={u.id} user={u} />
            ))
          )}
        </div>
      )}

      {tab === 'Tags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['#photography', '#travel', '#food', '#sunset', '#nature', '#music', '#fitness', '#art'].map(tag => (
            <div
              key={tag}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}
              className="account-item"
            >
              <div style={{ width: 44, height: 44, background: 'var(--gradient-btn)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                #
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tag}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatNumber(posts.filter(p => p.caption?.includes(tag)).length)} posts
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountItem({ user: u }) {
  const [following, setFollowing] = useState(false);

  return (
    <div className="account-item">
      <div className="avatar-ring" style={{ width: 52, height: 52, padding: 2.5 }}>
        <img src={u.avatar} alt={u.username} className="avatar" style={{ width: 43, height: 43, border: '2px solid var(--bg-primary)' }} />
      </div>
      <div className="account-info">
        <div className="account-name">{u.username} {u.verified && <span style={{ color: 'var(--accent-3)', fontSize: 12 }}>✓</span>}</div>
        <div className="account-bio">{u.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {formatNumber(u.followers)} followers
        </div>
      </div>
      <button
        className={following ? 'btn-following' : 'btn-follow'}
        onClick={() => setFollowing(f => !f)}
      >
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
