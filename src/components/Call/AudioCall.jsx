import { useState, useEffect, useRef } from 'react';
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  PhoneCall, PhoneIncoming
} from 'lucide-react';

export default function AudioCall({ contact, onClose }) {
  const [callState, setCallState] = useState('calling'); // calling | connected | ended
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [onHold, setOnHold] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const connectRef = useRef(null);

  useEffect(() => {
    // Simulate call being picked up after 3s
    connectRef.current = setTimeout(() => {
      setCallState('connected');
    }, 3000);

    return () => {
      clearTimeout(connectRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const formatDuration = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    setCallState('ended');
    clearInterval(timerRef.current);
    clearTimeout(connectRef.current);
    setTimeout(onClose, 1200);
  };

  return (
    <div className="call-overlay audio-call-overlay">
      {/* Blurred background */}
      <div className="call-bg" style={{ backgroundImage: `url(${contact.avatar})` }} />
      <div className="call-bg-blur" />

      <div className="call-modal">
        {/* Avatar */}
        <div className={`call-avatar-wrap ${callState === 'calling' ? 'pulsing' : ''}`}>
          <div className="call-avatar-ring" />
          <div className="call-avatar-ring ring2" />
          <img src={contact.avatar} alt={contact.username} className="call-avatar-img" />
        </div>

        {/* Info */}
        <div className="call-info">
          <div className="call-name">{contact.username}</div>
          <div className="call-status">
            {callState === 'calling' && (
              <span className="call-status-calling">
                <span className="dot-blink" />
                Calling…
              </span>
            )}
            {callState === 'connected' && (
              <span className="call-status-connected">
                {onHold ? '⏸ On Hold' : formatDuration(duration)}
              </span>
            )}
            {callState === 'ended' && (
              <span className="call-status-ended">Call Ended</span>
            )}
          </div>
        </div>

        {/* Controls */}
        {callState !== 'ended' && (
          <div className="call-controls">
            <div className="call-controls-row">
              <button
                id="audio-mute-btn"
                className={`call-ctrl-btn ${muted ? 'active' : ''}`}
                onClick={() => setMuted(m => !m)}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff size={22} /> : <Mic size={22} />}
                <span>{muted ? 'Unmute' : 'Mute'}</span>
              </button>

              <button
                id="audio-hold-btn"
                className={`call-ctrl-btn ${onHold ? 'active' : ''}`}
                onClick={() => setOnHold(h => !h)}
                aria-label={onHold ? 'Resume' : 'Hold'}
              >
                <PhoneIncoming size={22} />
                <span>{onHold ? 'Resume' : 'Hold'}</span>
              </button>

              <button
                id="audio-speaker-btn"
                className={`call-ctrl-btn ${speakerOn ? 'active' : ''}`}
                onClick={() => setSpeakerOn(s => !s)}
                aria-label={speakerOn ? 'Speaker Off' : 'Speaker On'}
              >
                {speakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
                <span>Speaker</span>
              </button>
            </div>

            <button
              id="audio-end-call-btn"
              className="call-end-btn"
              onClick={handleEndCall}
              aria-label="End Call"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        )}

        {callState === 'ended' && (
          <div className="call-ended-msg">
            <PhoneCall size={40} style={{ opacity: 0.4 }} />
          </div>
        )}
      </div>
    </div>
  );
}
