import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function StoriesBar({ stories }) {
  const { user } = useAuth();
  const [viewingIdx, setViewingIdx] = useState(null);
  const { markStorySeen, addStory, showToast } = useApp();
  const storyFileInputRef = useRef(null);

  const openStory = (idx) => {
    setViewingIdx(idx);
    markStorySeen(stories[idx].id);
  };

  const closeViewer = () => setViewingIdx(null);

  const goNext = () => {
    if (viewingIdx < stories.length - 1) {
      setViewingIdx(v => v + 1);
      markStorySeen(stories[viewingIdx + 1].id);
    } else {
      closeViewer();
    }
  };

  const goPrev = () => {
    if (viewingIdx > 0) setViewingIdx(v => v - 1);
  };

  const handleAddStoryClick = () => {
    storyFileInputRef.current?.click();
  };

  const handleStoryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const newStory = {
        id: 'story_' + Date.now(),
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        image: event.target.result,
        seen: false,
        timestamp: 'Just now'
      };
      addStory(newStory);
      showToast('Story shared! ✨');
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="stories-bar">
        {/* Own story / add */}
        <div className="story-item own-story" onClick={handleAddStoryClick}>
          <div className="story-avatar-wrap">
            <div className="avatar-ring" style={{ background: 'var(--border-light)' }}>
              <img src={user?.avatar || "https://i.pravatar.cc/150?img=11"} alt="Add story" className="avatar" style={{ width: 57, height: 57 }} />
            </div>
            <span className="story-add-btn">+</span>
          </div>
          <span className="story-label">Your Story</span>
          <input
            type="file"
            ref={storyFileInputRef}
            onChange={handleStoryFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>

        {stories.map((story, idx) => (
          <div key={story.id} className="story-item" onClick={() => openStory(idx)}>
            <div className="story-avatar-wrap">
              <div className={`avatar-ring ${story.seen ? 'seen' : ''}`}>
                <img src={story.user.avatar} alt={story.user.username} className="avatar" style={{ width: 57, height: 57 }} />
              </div>
            </div>
            <span className="story-label">{story.user.username}</span>
          </div>
        ))}
      </div>

      {viewingIdx !== null && (
        <StoryViewer
          stories={stories}
          currentIdx={viewingIdx}
          onClose={closeViewer}
          onNext={goNext}
          onPrev={goPrev}
          onNavigate={setViewingIdx}
        />
      )}
    </>
  );
}

function StoryViewer({ stories, currentIdx, onClose, onNext, onPrev, onNavigate }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const DURATION = 5000; // 5 seconds per story
  const INTERVAL = 100;

  const story = stories[currentIdx];

  useEffect(() => {
    setProgress(0);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (INTERVAL / DURATION) * 100;
        if (next >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => onNext(), 100);
          return 100;
        }
        return next;
      });
    }, INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [currentIdx]);

  const handleTapLeft = () => {
    setProgress(0);
    clearInterval(intervalRef.current);
    onPrev();
  };

  const handleTapRight = () => {
    setProgress(0);
    clearInterval(intervalRef.current);
    onNext();
  };

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer" onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="story-progress-bar">
          {stories.map((s, idx) => (
            <div key={s.id} className="story-progress-segment">
              <div
                className={`story-progress-fill ${idx < currentIdx ? 'completed' : idx > currentIdx ? 'empty' : ''}`}
                style={idx === currentIdx ? { width: `${progress}%` } : undefined}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="user-info">
            <img src={story.user.avatar} alt={story.user.username} className="avatar" style={{ width: 36, height: 36, border: '2px solid white' }} />
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>{story.user.username}</div>
              <div className="story-time">{story.timestamp}</div>
            </div>
          </div>
          <button className="story-close-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {/* Image */}
        <div className="story-image-container">
          <img src={story.image} alt="Story" className="story-image" />
          <div className="story-gradient-overlay" />
          <div className="story-tap-left" onClick={handleTapLeft} />
          <div className="story-tap-right" onClick={handleTapRight} />
        </div>
      </div>
    </div>
  );
}
