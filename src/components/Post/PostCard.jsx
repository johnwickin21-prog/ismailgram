import { useState, useRef, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin, SmilePlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { formatNumber } from '../../data/mockData';

export default function PostCard({ post }) {
  const { toggleLike, toggleSave, addComment, showToast } = useApp();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const lastTapRef = useRef(0);
  const commentInputRef = useRef(null);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (!post.liked) {
        toggleLike(post.id);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
      }
    }
    lastTapRef.current = now;
  }, [post.id, post.liked, toggleLike]);

  const handleLikeBtn = () => {
    toggleLike(post.id);
    setIsLikeAnimating(true);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleSave = () => {
    toggleSave(post.id);
    showToast(post.saved ? 'Removed from saved' : 'Saved to collection ✨');
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, user, commentText.trim());
    setCommentText('');
    setShowComments(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Check this on IsmailGram!', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied! 🔗');
    }
  };

  const focusComment = () => {
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const renderCaption = (caption) => {
    return caption.split(' ').map((word, i) => {
      if (word.startsWith('#')) {
        return <span key={i} className="caption-hashtag">{word} </span>;
      }
      return word + ' ';
    });
  };

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="avatar-ring" style={{ width: 40, height: 40, padding: 2 }}>
          <img src={post.user.avatar} alt={post.user.username} className="avatar" style={{ width: 32, height: 32, border: '2px solid var(--bg-primary)' }} />
        </div>
        <div className="post-user-info">
          <div className="post-username">{post.user.username}</div>
          {post.location && (
            <div className="post-location">
              <MapPin size={10} /> {post.location}
            </div>
          )}
        </div>
        <button className="post-menu-btn"><MoreHorizontal size={20} /></button>
      </div>

      {/* Image */}
      <div className="post-image-container" onClick={handleDoubleTap}>
        <img src={post.image} alt="Post" className="post-image" loading="lazy" />
        <div className={`heart-animation ${showHeart ? 'show' : ''}`}>❤️</div>
      </div>

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`post-action-btn ${post.liked ? 'liked' : ''} ${isLikeAnimating ? 'like-animation' : ''}`}
          onClick={handleLikeBtn}
          aria-label={post.liked ? 'Unlike' : 'Like'}
        >
          <Heart size={24} fill={post.liked ? 'currentColor' : 'none'} />
        </button>
        <button className="post-action-btn" onClick={focusComment} aria-label="Comment">
          <MessageCircle size={24} />
        </button>
        <button className="post-action-btn" onClick={handleShare} aria-label="Share">
          <Send size={24} />
        </button>
        <button
          className={`post-action-btn post-save-btn ${post.saved ? 'saved' : ''}`}
          onClick={handleSave}
          aria-label={post.saved ? 'Unsave' : 'Save'}
        >
          <Bookmark size={24} fill={post.saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Likes */}
      <div className="post-likes">{formatNumber(post.likes)} likes</div>

      {/* Caption */}
      <p className="post-caption">
        <span className="caption-username">{post.user.username}</span>
        {renderCaption(post.caption)}
      </p>

      {/* View comments */}
      {post.comments.length > 0 && !showComments && (
        <button className="view-comments-btn" onClick={() => setShowComments(true)}>
          View all {post.comments.length} comments
        </button>
      )}

      {/* Comments list */}
      {showComments && (
        <div className="post-comments-section">
          <div className="comments-list">
            {post.comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <img src={comment.user.avatar} alt={comment.user.username} className="avatar" style={{ width: 26, height: 26 }} />
                <div className="comment-content">
                  <span className="comment-username">{comment.user.username}</span>
                  {comment.text}
                  <div className="comment-time">{comment.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="post-timestamp">{post.timestamp}</div>

      {/* Comment input */}
      <form className="comment-input-row" onSubmit={handleComment}>
        <img src={user?.avatar} alt="me" className="avatar" style={{ width: 28, height: 28 }} />
        <input
          ref={commentInputRef}
          className="comment-input"
          placeholder="Add a comment..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          maxLength={300}
        />
        <button
          type="submit"
          className={`comment-submit-btn ${commentText.trim() ? 'active' : ''}`}
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </form>
    </article>
  );
}
