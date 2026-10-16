import { useState } from 'react';
import { Search, Send, Phone, Video, Info, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import AudioCall from '../components/Call/AudioCall';
import VideoCall from '../components/Call/VideoCall';

export default function Messages() {
  const { conversations, sendMessage } = useApp();
  const { user } = useAuth();
  const [activeConv, setActiveConv] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  // Call states
  const [audioCall, setAudioCall] = useState(null);  // contact object or null
  const [videoCall, setVideoCall] = useState(null);  // contact object or null

  const filtered = conversations.filter(c =>
    c.user.username.toLowerCase().includes(search.toLowerCase()) ||
    c.user.name.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (conv) => {
    setActiveConv(conv);
    setChatOpen(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    sendMessage(activeConv.id, user, messageText.trim());
    setMessageText('');
    setActiveConv(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: 'm_' + Date.now(),
        from: user.id,
        text: messageText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }],
    }));
  };

  return (
    <>
      <div className={`messages-page ${chatOpen ? 'chat-open' : ''}`}>
        {/* Sidebar */}
        <div className="messages-sidebar">
          <div className="messages-header">
            <h2>{user?.username}</h2>
            <div className="messages-search">
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                id="messages-search-input"
                placeholder="Search messages..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-list">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
                onClick={() => openChat(conv)}
              >
                <div style={{ position: 'relative' }}>
                  <img src={conv.user.avatar} alt={conv.user.username} className="avatar" style={{ width: 52, height: 52 }} />
                  {conv.online && <div className="online-dot" />}
                </div>
                <div className="conversation-info">
                  <div className="conversation-name">
                    {conv.user.username}
                    <span className="conversation-time">{conv.timestamp}</span>
                  </div>
                  <div className={`conversation-preview ${conv.unread ? 'unread' : ''}`}>
                    {conv.lastMessage}
                  </div>
                </div>
                {conv.unread && <div className="unread-dot" />}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {!activeConv ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <Send size={28} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Your messages</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Send private photos and messages to a friend or group.
              </div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <button
                  className="btn btn-ghost"
                  onClick={() => setChatOpen(false)}
                  style={{ display: 'none' }}
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <img src={activeConv.user.avatar} alt={activeConv.user.username} className="avatar" style={{ width: 40, height: 40 }} />
                  {activeConv.online && <div className="online-dot" />}
                </div>
                <div className="chat-header-info">
                  <div className="name">{activeConv.user.username}</div>
                  <div className="status">{activeConv.online ? '🟢 Active now' : 'Offline'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    id="chat-audio-call-btn"
                    className="btn btn-ghost"
                    aria-label="Audio call"
                    onClick={() => setAudioCall(activeConv.user)}
                    title="Audio Call"
                  >
                    <Phone size={20} />
                  </button>
                  <button
                    id="chat-video-call-btn"
                    className="btn btn-ghost"
                    aria-label="Video call"
                    onClick={() => setVideoCall(activeConv.user)}
                    title="Video Call"
                  >
                    <Video size={20} />
                  </button>
                  <button className="btn btn-ghost"><Info size={20} /></button>
                </div>
              </div>

              <div className="chat-messages" id="chat-messages-container">
                <div className="chat-date-divider">Today</div>
                {activeConv.messages.map(msg => {
                  const isOwn = msg.from === user?.id || msg.from === 'u1';
                  return (
                    <div key={msg.id} className={`message-bubble-wrap ${isOwn ? 'own' : ''}`}>
                      {!isOwn && (
                        <img src={activeConv.user.avatar} alt="avatar" className="avatar" style={{ width: 28, height: 28 }} />
                      )}
                      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                        {msg.text}
                      </div>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <div className="chat-input-wrap">
                  <input
                    id="chat-message-input"
                    className="chat-input"
                    placeholder={`Message ${activeConv.user.username}...`}
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={!messageText.trim()}
                  aria-label="Send message"
                >
                  <Send size={22} style={{ fill: messageText.trim() ? 'var(--accent-3)' : 'none', color: messageText.trim() ? 'var(--accent-3)' : 'var(--text-muted)' }} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Audio Call Modal */}
      {audioCall && (
        <AudioCall
          contact={audioCall}
          onClose={() => setAudioCall(null)}
        />
      )}

      {/* Video Call Modal */}
      {videoCall && (
        <VideoCall
          contact={videoCall}
          onClose={() => setVideoCall(null)}
        />
      )}
    </>
  );
}
