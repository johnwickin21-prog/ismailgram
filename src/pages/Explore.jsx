import { useState, useMemo } from 'react';
import { Search, X, Video } from 'lucide-react';
import { EXPLORE_POSTS, USERS, formatNumber } from '../data/mockData';
import { Heart, MessageCircle } from 'lucide-react';

const TABS = ['Posts', 'Accounts', 'Reels', 'Tags'];

export default function Explore() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('Posts');

  const filteredUsers = useMemo(() =>
    USERS.filter(u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.name.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  const filteredPosts = useMemo(() =>
    EXPLORE_POSTS.filter(() => !query || Math.random() > 0.3), [query]);

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
        <div className="explore-grid">
          {EXPLORE_POSTS.map((item, idx) => (
            <div key={item.id} className="explore-grid-item" style={idx === 3 ? { gridColumn: 'span 1', gridRow: 'span 2', aspectRatio: '1 / 2' } : {}}>
              <img src={item.image} alt="Explore" loading="lazy" />
              {item.isReel && (
                <div className="reel-play-icon"><Video size={18} /></div>
              )}
              <div className="overlay">
                <div className="overlay-stat"><Heart size={16} fill="white" /> {formatNumber(item.likes)}</div>
                <div className="overlay-stat"><MessageCircle size={16} fill="white" /> {formatNumber(item.comments)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Accounts' && (
        <div className="accounts-list">
          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No accounts found
            </div>
          ) : (
            filteredUsers.map(u => (
              <AccountItem key={u.id} user={u} />
            ))
          )}
        </div>
      )}

      {tab === 'Reels' && (
        <div className="explore-grid">
          {EXPLORE_POSTS.filter(p => p.isReel).map(item => (
            <div key={item.id} className="explore-grid-item">
              <img src={item.image} alt="Reel" loading="lazy" />
              <div className="reel-play-icon"><Video size={18} /></div>
              <div className="overlay">
                <div className="overlay-stat"><Heart size={16} fill="white" /> {formatNumber(item.likes)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Tags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['#photography', '#travel', '#food', '#sunset', '#nature', '#music', '#fitness', '#art'].map(tag => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }} className="account-item">
              <div style={{ width: 44, height: 44, background: 'var(--gradient-btn)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                #
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{tag}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatNumber(Math.floor(Math.random() * 1000000) + 10000)} posts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountItem({ user: u }) {
  const [following, setFollowing] = useState(u.isFollowing);

  return (
    <div className="account-item">
      <div className="avatar-ring" style={{ width: 52, height: 52, padding: 2.5 }}>
        <img src={u.avatar} alt={u.username} className="avatar" style={{ width: 43, height: 43, border: '2px solid var(--bg-primary)' }} />
      </div>
      <div className="account-info">
        <div className="account-name">{u.username} {u.verified && <span style={{ color: 'var(--accent-3)', fontSize: 12 }}>✓</span>}</div>
        <div className="account-bio">{u.bio || u.name}</div>
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
