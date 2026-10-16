import { useState, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Music, Volume2, VolumeX } from 'lucide-react';
import { REELS, formatNumber } from '../data/mockData';
import { useApp } from '../context/AppContext';

export default function Reels() {
  const [reels, setReels] = useState(REELS);
  const [muted, setMuted] = useState(true);

  const toggleLike = (id) => {
    setReels(prev => prev.map(r =>
      r.id === id ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
    ));
  };

  return (
    <div className="reels-page">
      <button
        onClick={() => setMuted(m => !m)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 50,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: 10,
          borderRadius: '50%',
          backdropFilter: 'blur(4px)',
        }}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className="reels-container">
        {reels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} muted={muted} onLike={() => toggleLike(reel.id)} />
        ))}
      </div>
    </div>
  );
}

function ReelItem({ reel, muted, onLike }) {
  const { showToast } = useApp();
  const [saved, setSaved] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  const handleLike = () => {
    onLike();
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleSave = () => {
    setSaved(s => !s);
    showToast(saved ? 'Removed from saved' : 'Saved to collection ✨');
  };

  return (
    <div className="reel-item">
      {/* Real looping video player for Reels */}
      <video
        src={reel.video}
        poster={reel.thumbnail}
        className="reel-video-bg"
        autoPlay
        loop
        muted={muted}
        playsInline
        style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
      />
      <div className="reel-gradient" />

      {/* Sidebar actions */}
      <div className="reel-sidebar">
        <div
          className={`reel-action ${reel.liked ? 'liked' : ''}`}
          onClick={handleLike}
          style={isLikeAnimating ? { animation: 'likeBounce 0.3s ease' } : {}}
        >
          <Heart size={28} fill={reel.liked ? 'currentColor' : 'none'} />
          <span className="reel-action-count">{formatNumber(reel.likes)}</span>
        </div>
        <div className="reel-action">
          <MessageCircle size={28} />
          <span className="reel-action-count">{formatNumber(reel.comments)}</span>
        </div>
        <div className="reel-action" onClick={() => showToast('Link copied! 🔗')}>
          <Send size={26} />
          <span className="reel-action-count">{formatNumber(reel.shares)}</span>
        </div>
        <div className={`reel-action ${saved ? '' : ''}`} onClick={handleSave}>
          <Bookmark size={26} fill={saved ? 'white' : 'none'} />
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '2px solid white', cursor: 'pointer' }}>
          <img src={reel.user.avatar} alt={reel.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Bottom info */}
      <div className="reel-info">
        <div className="reel-user">
          <img src={reel.user.avatar} alt={reel.user.username} className="avatar" style={{ width: 36, height: 36, border: '2px solid white' }} />
          <span className="reel-username">@{reel.user.username}</span>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 12px', fontSize: 12, borderRadius: 6 }}
          >
            Follow
          </button>
        </div>
        <p className="reel-caption">{reel.caption}</p>
        <div className="reel-audio">
          <Music size={12} /> {reel.audio}
        </div>
      </div>
    </div>
  );
}
