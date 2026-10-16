import { useState, useRef, useCallback } from 'react';
import {
  X, ImagePlus, Video, Camera, MapPin, ChevronRight,
  ChevronLeft, Sun, Contrast, Droplets, Scissors,
  Play, Pause, Volume2, VolumeX, FastForward, Tag,
  Users, Globe, Lock, Smile, AtSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

/* ─── Image filters ─────────────────────────────────────────── */
const IMAGE_FILTERS = [
  { id: 'none',     label: 'Original',  css: 'none' },
  { id: 'clarendon', label: 'Clarendon', css: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham',  label: 'Gingham',   css: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'moon',     label: 'Moon',      css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'lark',     label: 'Lark',      css: 'brightness(1.1) saturate(0.9) contrast(0.9)' },
  { id: 'reyes',    label: 'Reyes',     css: 'sepia(0.35) contrast(0.95) brightness(1.1) saturate(0.85)' },
  { id: 'juno',     label: 'Juno',      css: 'saturate(1.4) contrast(1.1) hue-rotate(-10deg)' },
  { id: 'slumber',  label: 'Slumber',   css: 'sepia(0.4) brightness(1.05) saturate(0.75)' },
  { id: 'crema',    label: 'Crema',     css: 'sepia(0.25) contrast(1.1) saturate(0.85) hue-rotate(-2deg)' },
  { id: 'ludwig',   label: 'Ludwig',    css: 'sepia(0.2) contrast(1.05) brightness(1.05) saturate(1.1)' },
  { id: 'aden',     label: 'Aden',      css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { id: 'perpetua', label: 'Perpetua',  css: 'contrast(1.1) saturate(1.1) brightness(1.05)' },
];

/* ─── Video speed options ────────────────────────────────────── */
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ─── Audience options ───────────────────────────────────────── */
const AUDIENCE_OPTIONS = [
  { id: 'everyone', label: 'Everyone', icon: Globe },
  { id: 'followers', label: 'Followers only', icon: Users },
  { id: 'private', label: 'Only me', icon: Lock },
];

export default function CreatePost({ onClose }) {
  const { addPost, showToast } = useApp();
  const { user } = useAuth();

  // Steps: upload → media-type → edit → share
  const [step, setStep] = useState('upload');
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);

  // Image editing
  const [activeFilter, setActiveFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [editTab, setEditTab] = useState('filters'); // filters | adjust

  // Video editing
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoVolume, setVideoVolume] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100); // percentage
  const [videoFilter, setVideoFilter] = useState('none');

  // Share step
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [audience, setAudience] = useState('everyone');
  const [altText, setAltText] = useState('');
  const [loading, setLoading] = useState(false);

  const fileRef = useRef(null);
  const videoFileRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  /* ── File handlers ── */
  const processFile = (f) => {
    if (!f) return;
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) {
      showToast('Please select an image or video file');
      return;
    }
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setMediaType(isImage ? 'image' : 'video');
    setStep('edit');
  };

  const handleImageFile = (e) => processFile(e.target.files?.[0]);
  const handleVideoFile = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  /* ── Image filter CSS ── */
  const getImageFilterCSS = () => {
    const f = IMAGE_FILTERS.find(x => x.id === activeFilter);
    const base = f?.css !== 'none' ? f.css + ' ' : '';
    const adj = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return base + adj;
  };

  /* ── Video helpers ── */
  const handleVideoLoaded = () => {
    if (videoRef.current) setVideoDuration(videoRef.current.duration || 0);
  };
  const handleVideoTime = () => {
    if (videoRef.current) setVideoCurrentTime(videoRef.current.currentTime);
  };
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setVideoPlaying(p => !p);
  };
  const handleSpeedChange = (speed) => {
    setVideoSpeed(speed);
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };
  const handleVolumeChange = (val) => {
    setVideoVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
  };
  const handleScrub = (e) => {
    if (!videoRef.current || !videoDuration) return;
    const pct = parseFloat(e.target.value);
    const t = (pct / 100) * videoDuration;
    videoRef.current.currentTime = t;
    setVideoCurrentTime(t);
  };

  const currentVideoFilterCSS = IMAGE_FILTERS.find(f => f.id === videoFilter)?.css;

  /* ── Share ── */
  const handleShare = async () => {
    if (!previewUrl) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    addPost({
      id: 'p_' + Date.now(),
      user: { ...user },
      image: previewUrl,
      caption: caption.trim() || '📸',
      likes: 0, liked: false, saved: false, comments: [],
      location: location.trim() || null,
      timestamp: 'Just now',
      isVideo: mediaType === 'video',
    });
    setLoading(false);
    showToast(mediaType === 'video' ? 'Reel shared! 🎬' : 'Post shared! 🎉');
    onClose();
  };

  /* ── Step title ── */
  const stepTitle = {
    upload: 'Create New Post',
    edit: mediaType === 'video' ? 'Edit Video' : 'Edit Photo',
    share: 'Share',
  }[step];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-post-pro" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="modal-header">
          {step !== 'upload' && (
            <button className="btn btn-ghost" style={{ marginRight: 'auto' }}
              onClick={() => step === 'share' ? setStep('edit') : setStep('upload')}>
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <span className="modal-title">{stepTitle}</span>
          {step === 'edit' && (
            <button className="btn btn-ghost"
              style={{ color: 'var(--accent-3)', fontWeight: 700, marginLeft: 'auto' }}
              onClick={() => setStep('share')}>
              Next <ChevronRight size={16} />
            </button>
          )}
          {step === 'upload' && (
            <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
          )}
        </div>

        <div className="modal-body" style={{ padding: 0 }}>

          {/* ══════════ UPLOAD STEP ══════════ */}
          {step === 'upload' && (
            <div className="cp-upload-area">
              {/* Drop zone */}
              <div
                className="cp-drop-zone"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                <div className="cp-drop-icon">
                  <ImagePlus size={48} />
                </div>
                <div className="cp-drop-title">Drag photos or videos here</div>
                <div className="cp-drop-sub">Supports: JPG, PNG, HEIC, MP4, MOV, AVI</div>

                <div className="cp-upload-btns">
                  <button
                    id="cp-select-image-btn"
                    className="btn btn-primary"
                    onClick={() => fileRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                    Select Photo
                  </button>
                  <button
                    id="cp-select-video-btn"
                    className="btn btn-secondary"
                    onClick={() => videoFileRef.current?.click()}
                  >
                    <Video size={16} />
                    Select Video
                  </button>
                  <button
                    id="cp-camera-btn"
                    className="btn btn-secondary"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera size={16} />
                    Camera
                  </button>
                </div>

                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
                <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoFile} style={{ display: 'none' }} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleImageFile} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {/* ══════════ EDIT STEP ══════════ */}
          {step === 'edit' && previewUrl && (
            <div className="cp-edit-area">
              {/* ── IMAGE EDITOR ── */}
              {mediaType === 'image' && (
                <>
                  <div className="cp-preview-wrap">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="cp-preview-img"
                      style={{ filter: getImageFilterCSS() }}
                    />
                  </div>

                  {/* Edit tabs */}
                  <div className="cp-edit-tabs">
                    <button
                      id="cp-tab-filters"
                      className={`cp-edit-tab ${editTab === 'filters' ? 'active' : ''}`}
                      onClick={() => setEditTab('filters')}
                    >
                      Filters
                    </button>
                    <button
                      id="cp-tab-adjust"
                      className={`cp-edit-tab ${editTab === 'adjust' ? 'active' : ''}`}
                      onClick={() => setEditTab('adjust')}
                    >
                      Adjust
                    </button>
                  </div>

                  {editTab === 'filters' && (
                    <div className="cp-filter-strip">
                      {IMAGE_FILTERS.map(f => (
                        <button
                          key={f.id}
                          id={`cp-filter-${f.id}`}
                          className={`cp-filter-thumb ${activeFilter === f.id ? 'active' : ''}`}
                          onClick={() => setActiveFilter(f.id)}
                        >
                          <img
                            src={previewUrl}
                            alt={f.label}
                            className="cp-filter-img"
                            style={{ filter: f.css !== 'none' ? f.css : undefined }}
                          />
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {editTab === 'adjust' && (
                    <div className="cp-adjust-panel">
                      {[
                        { label: 'Brightness', icon: Sun, value: brightness, setter: setBrightness, min: 50, max: 150 },
                        { label: 'Contrast',   icon: Contrast, value: contrast,   setter: setContrast,   min: 50, max: 150 },
                        { label: 'Saturation', icon: Droplets, value: saturation, setter: setSaturation, min: 0,  max: 200 },
                      ].map(({ label, icon: Icon, value, setter, min, max }) => (
                        <div className="cp-adjust-row" key={label}>
                          <div className="cp-adjust-label">
                            <Icon size={16} />
                            <span>{label}</span>
                          </div>
                          <input
                            id={`cp-adjust-${label.toLowerCase()}`}
                            type="range"
                            className="cp-slider"
                            min={min}
                            max={max}
                            value={value}
                            onChange={e => setter(Number(e.target.value))}
                          />
                          <span className="cp-adjust-val">{value}%</span>
                        </div>
                      ))}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: 8, alignSelf: 'flex-end' }}
                        onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
                      >
                        Reset Adjustments
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── VIDEO EDITOR ── */}
              {mediaType === 'video' && (
                <div className="cp-video-editor">
                  {/* Video preview */}
                  <div className="cp-video-preview-wrap">
                    <video
                      ref={videoRef}
                      src={previewUrl}
                      className="cp-video-preview"
                      style={{ filter: currentVideoFilterCSS !== 'none' ? currentVideoFilterCSS : undefined }}
                      onLoadedMetadata={handleVideoLoaded}
                      onTimeUpdate={handleVideoTime}
                      onEnded={() => setVideoPlaying(false)}
                      playsInline
                    />
                    {/* Play overlay */}
                    <button
                      id="cp-video-play-btn"
                      className="cp-video-play-overlay"
                      onClick={togglePlay}
                      aria-label={videoPlaying ? 'Pause' : 'Play'}
                    >
                      {videoPlaying ? <Pause size={36} /> : <Play size={36} />}
                    </button>
                  </div>

                  {/* Timeline scrubber */}
                  <div className="cp-timeline">
                    <span className="cp-time-label">
                      {Math.floor(videoCurrentTime)}s
                    </span>
                    <input
                      id="cp-video-scrubber"
                      type="range"
                      className="cp-slider timeline-slider"
                      min={0}
                      max={100}
                      value={videoDuration ? (videoCurrentTime / videoDuration) * 100 : 0}
                      onChange={handleScrub}
                    />
                    <span className="cp-time-label">
                      {Math.floor(videoDuration)}s
                    </span>
                  </div>

                  {/* Trim bar */}
                  <div className="cp-trim-section">
                    <div className="cp-trim-label">
                      <Scissors size={14} /> Trim
                    </div>
                    <div className="cp-trim-bar">
                      <div className="cp-trim-fill" style={{ left: `${trimStart}%`, width: `${trimEnd - trimStart}%` }} />
                      <input
                        id="cp-trim-start"
                        type="range"
                        className="cp-trim-handle"
                        min={0} max={trimEnd - 5}
                        value={trimStart}
                        onChange={e => setTrimStart(Number(e.target.value))}
                      />
                      <input
                        id="cp-trim-end"
                        type="range"
                        className="cp-trim-handle"
                        min={trimStart + 5} max={100}
                        value={trimEnd}
                        onChange={e => setTrimEnd(Number(e.target.value))}
                      />
                    </div>
                    <span className="cp-trim-info">
                      {videoDuration ? `${((trimEnd - trimStart) / 100 * videoDuration).toFixed(1)}s selected` : '—'}
                    </span>
                  </div>

                  {/* Speed */}
                  <div className="cp-speed-section">
                    <div className="cp-speed-label">
                      <FastForward size={14} /> Speed
                    </div>
                    <div className="cp-speed-chips">
                      {SPEED_OPTIONS.map(s => (
                        <button
                          key={s}
                          id={`cp-speed-${String(s).replace('.', '_')}`}
                          className={`cp-speed-chip ${videoSpeed === s ? 'active' : ''}`}
                          onClick={() => handleSpeedChange(s)}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="cp-adjust-row">
                    <div className="cp-adjust-label">
                      {videoVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span>Volume</span>
                    </div>
                    <input
                      id="cp-video-volume"
                      type="range"
                      className="cp-slider"
                      min={0} max={1} step={0.05}
                      value={videoVolume}
                      onChange={e => handleVolumeChange(Number(e.target.value))}
                    />
                    <span className="cp-adjust-val">{Math.round(videoVolume * 100)}%</span>
                  </div>

                  {/* Video filters */}
                  <div className="cp-vid-filter-label">
                    <Sparkles size={14} /> Filters
                  </div>
                  <div className="cp-filter-strip">
                    {IMAGE_FILTERS.map(f => (
                      <button
                        key={f.id}
                        id={`cp-vfilter-${f.id}`}
                        className={`cp-filter-thumb ${videoFilter === f.id ? 'active' : ''}`}
                        onClick={() => setVideoFilter(f.id)}
                      >
                        <div
                          className="cp-filter-color-swatch"
                          style={{ background: f.id === 'mono' ? '#888' : f.id === 'warm' ? '#f97316' : f.id === 'cool' ? '#60a5fa' : f.id === 'vivid' ? '#a855f7' : f.id === 'noir' ? '#111' : f.id === 'fade' ? '#e5e7eb' : f.id === 'vintage' ? '#b45309' : 'var(--gradient-btn)' }}
                        />
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ SHARE STEP ══════════ */}
          {step === 'share' && (
            <div className="cp-share-area">
              {/* Preview thumbnail */}
              <div className="cp-share-preview">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="cp-share-thumb"
                    style={{ filter: getImageFilterCSS() }}
                  />
                ) : (
                  <video src={previewUrl} className="cp-share-thumb" muted playsInline />
                )}
              </div>

              {/* Caption */}
              <div className="cp-share-caption-wrap">
                <img src={user?.avatar} alt="me" className="avatar" style={{ width: 36, height: 36, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{user?.username}</div>
                  <textarea
                    id="cp-caption-input"
                    className="cp-caption-input"
                    placeholder="Write a caption, add hashtags... #photography"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    maxLength={2200}
                    rows={4}
                  />
                  <div className="cp-caption-meta">
                    <div className="cp-caption-actions">
                      <button className="cp-caption-action-btn" aria-label="Emoji"><Smile size={18} /></button>
                      <button className="cp-caption-action-btn" aria-label="Mention"><AtSign size={18} /></button>
                      <button className="cp-caption-action-btn" aria-label="Tag">#</button>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{caption.length}/2,200</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="cp-share-row">
                <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
                <input
                  id="cp-location-input"
                  type="text"
                  className="cp-share-field"
                  placeholder="Add location..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {/* Tag people */}
              <div className="cp-share-row">
                <Tag size={18} style={{ color: 'var(--text-muted)' }} />
                <span className="cp-share-field-label">Tag People</span>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>

              {/* Audience */}
              <div className="cp-share-section-label">Audience</div>
              <div className="cp-audience-selector">
                {AUDIENCE_OPTIONS.map(o => (
                  <button
                    key={o.id}
                    id={`cp-audience-${o.id}`}
                    className={`cp-audience-btn ${audience === o.id ? 'active' : ''}`}
                    onClick={() => setAudience(o.id)}
                  >
                    <o.icon size={16} />
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>

              {/* Alt text */}
              {mediaType === 'image' && (
                <>
                  <div className="cp-share-section-label">Accessibility</div>
                  <div className="cp-share-row">
                    <input
                      id="cp-alt-text-input"
                      type="text"
                      className="cp-share-field"
                      placeholder="Write alt text for this image..."
                      value={altText}
                      onChange={e => setAltText(e.target.value)}
                      maxLength={250}
                    />
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── Footer / Share button ── */}
        {step === 'share' && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setStep('edit')}>
              <ChevronLeft size={16} /> Back
            </button>
            <button
              id="cp-share-btn"
              className="btn btn-primary"
              onClick={handleShare}
              disabled={loading || !previewUrl}
            >
              {loading
                ? <>
                    <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    {mediaType === 'video' ? 'Uploading…' : 'Sharing…'}
                  </>
                : mediaType === 'video' ? '🎬 Share Reel' : '🚀 Share Post'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Need to export Sparkles separately since it's used inside
function Sparkles(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
