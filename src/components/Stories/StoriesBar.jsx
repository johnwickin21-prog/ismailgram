import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { createStory } from '../../lib/db';

export default function StoriesBar({ stories }) {
  const { user } = useAuth();
  const [viewingIdx, setViewingIdx] = useState(null);
  const { markStorySeen, addStory, showToast } = useApp();
  const storyFileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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

  const handleStoryFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.');
      return;
    }

    if (!user) return;
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const ext = file.name?.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from('stories').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('stories').getPublicUrl(data.path);
      const imageUrl = urlData.publicUrl;

      // Save to stories table
      await createStory(user.id, imageUrl);

      // Reload stories
      await addStory({});
      showToast('Story shared! ✨');
    } catch (err) {
      console.error('Story upload error:', err);
      showToast('Failed to upload story. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="stories-bar">
        {/* Own story / add */}
        <div className={`story-item own-story ${uploading ? 'uploading' : ''}`} onClick={uploading ? undefined : handleAddStoryClick}>
          <div className="story-avatar-wrap">
            <div className="avatar-ring" style={{ background: 'var(--border-light)' }}>
              {uploading
                ? <div className="avatar" style={{ width: 57, height: 57, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                  </div>
                : <img src={user?.avatar || 'https://i.pravatar.cc/150?img=11'} alt="Add story" className="avatar" style={{ width: 57, height: 57 }} />
              }
            </div>
            {!uploading && <span className="story-add-btn">+</span>}
          </div>
          <span className="story-label">{uploading ? 'Uploading...' : 'Your Story'}</span>
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
  const DURATION = 5000;
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
