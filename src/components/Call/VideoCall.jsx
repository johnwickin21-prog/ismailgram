import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PhoneOff, Mic, MicOff, Video, VideoOff,
  RotateCcw, Maximize2, Minimize2, Sparkles, Volume2, VolumeX
} from 'lucide-react';

const VIDEO_FILTERS = [
  { id: 'none',       label: 'Normal',    style: 'none' },
  { id: 'warm',       label: 'Warm',      style: 'sepia(0.4) saturate(1.3) hue-rotate(-15deg)' },
  { id: 'cool',       label: 'Cool',      style: 'saturate(1.2) hue-rotate(20deg) brightness(1.05)' },
  { id: 'vivid',      label: 'Vivid',     style: 'saturate(1.8) contrast(1.1)' },
  { id: 'mono',       label: 'Mono',      style: 'grayscale(1)' },
  { id: 'fade',       label: 'Fade',      style: 'opacity(0.85) saturate(0.7) brightness(1.1)' },
  { id: 'noir',       label: 'Noir',      style: 'grayscale(1) contrast(1.4) brightness(0.85)' },
  { id: 'vintage',    label: 'Vintage',   style: 'sepia(0.6) contrast(1.1) brightness(0.95) saturate(0.9)' },
];

export default function VideoCall({ contact, onClose }) {
  const [callState, setCallState] = useState('calling'); // calling | connected | ended
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [showFilters, setShowFilters] = useState(false);
  const [pip, setPip] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  const localVideoRef = useRef(null);
  const timerRef = useRef(null);
  const connectRef = useRef(null);

  // Try to get camera
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError(true);
      }
    };
    startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Simulate connection after 3s
  useEffect(() => {
    connectRef.current = setTimeout(() => setCallState('connected'), 3000);
    return () => clearTimeout(connectRef.current);
  }, []);

  // Duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const formatDuration = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = useCallback(() => {
    setCallState('ended');
    clearInterval(timerRef.current);
    clearTimeout(connectRef.current);
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    setTimeout(onClose, 1200);
  }, [localStream, onClose]);

  const toggleMute = () => {
    setMuted(m => {
      if (localStream) {
        localStream.getAudioTracks().forEach(t => (t.enabled = m));
      }
      return !m;
    });
  };

  const toggleVideo = () => {
    setVideoOff(v => {
      if (localStream) {
        localStream.getVideoTracks().forEach(t => (t.enabled = v));
      }
      return !v;
    });
  };

  const currentFilter = VIDEO_FILTERS.find(f => f.id === activeFilter);

  return (
    <div className={`call-overlay video-call-overlay ${pip ? 'pip-mode' : ''}`}>
      {/* Remote video / avatar */}
      <div className="vcall-remote">
        {callState === 'connected' ? (
          <>
            {/* Simulated remote video — show animated gradient */}
            <div className="vcall-remote-bg" />
            <img
              src={contact.avatar}
              alt={contact.username}
              className="vcall-remote-avatar"
            />
            <div className="vcall-remote-name-badge">{contact.username}</div>
          </>
        ) : (
          <div className="vcall-waiting">
            <div className={`call-avatar-wrap ${callState === 'calling' ? 'pulsing' : ''}`}>
              <div className="call-avatar-ring" />
              <div className="call-avatar-ring ring2" />
              <img src={contact.avatar} alt={contact.username} className="call-avatar-img" />
            </div>
            <div className="call-name" style={{ marginTop: 16 }}>{contact.username}</div>
            <div className="call-status">
              {callState === 'calling' && (
                <span className="call-status-calling">
                  <span className="dot-blink" />
                  Video Calling…
                </span>
              )}
              {callState === 'ended' && (
                <span className="call-status-ended">Call Ended</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local video (PiP) */}
      <div className="vcall-local-pip">
        {!cameraError && !videoOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="vcall-local-video"
            style={{ filter: currentFilter ? currentFilter.style : 'none' }}
          />
        ) : (
          <div className="vcall-local-placeholder">
            {videoOff ? <VideoOff size={28} color="white" /> : '📷'}
          </div>
        )}
      </div>

      {/* Duration / status */}
      <div className="vcall-status-badge">
        {callState === 'connected'
          ? formatDuration(duration)
          : callState === 'calling'
          ? 'Calling…'
          : 'Ended'}
      </div>

      {/* Minimize/Maximize */}
      <button
        id="vcall-pip-btn"
        className="vcall-pip-btn"
        onClick={() => setPip(p => !p)}
        aria-label={pip ? 'Maximize' : 'Minimize'}
      >
        {pip ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
      </button>

      {/* Filter panel */}
      {showFilters && (
        <div className="vcall-filter-panel">
          {VIDEO_FILTERS.map(f => (
            <button
              key={f.id}
              id={`vcall-filter-${f.id}`}
              className={`vcall-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              <div
                className="vcall-filter-thumb"
                style={{
                  backgroundImage: `url(${contact.avatar})`,
                  filter: f.style !== 'none' ? f.style : undefined,
                }}
              />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      {callState !== 'ended' && (
        <div className="vcall-controls">
          <button
            id="vcall-mute-btn"
            className={`vcall-ctrl-btn ${muted ? 'active' : ''}`}
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <MicOff size={22} /> : <Mic size={22} />}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            id="vcall-video-btn"
            className={`vcall-ctrl-btn ${videoOff ? 'active' : ''}`}
            onClick={toggleVideo}
            aria-label={videoOff ? 'Camera On' : 'Camera Off'}
          >
            {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
            <span>{videoOff ? 'Start Cam' : 'Stop Cam'}</span>
          </button>

          <button
            id="vcall-filter-toggle-btn"
            className={`vcall-ctrl-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(s => !s)}
            aria-label="Filters"
          >
            <Sparkles size={22} />
            <span>Filters</span>
          </button>

          <button
            id="vcall-speaker-btn"
            className={`vcall-ctrl-btn ${speakerMuted ? 'active' : ''}`}
            onClick={() => setSpeakerMuted(s => !s)}
            aria-label="Speaker"
          >
            {speakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
            <span>Speaker</span>
          </button>

          <button
            id="vcall-flip-btn"
            className="vcall-ctrl-btn"
            onClick={() => {}}
            aria-label="Flip Camera"
          >
            <RotateCcw size={22} />
            <span>Flip</span>
          </button>

          <button
            id="vcall-end-btn"
            className="call-end-btn"
            onClick={handleEndCall}
            aria-label="End Call"
          >
            <PhoneOff size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
