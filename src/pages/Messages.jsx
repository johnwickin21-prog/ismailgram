import { useState, useEffect, useRef } from 'react';
import { Search, Send, Phone, Video, Info, ArrowLeft, CheckCheck, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import AudioCall from '../components/Call/AudioCall';
import VideoCall from '../components/Call/VideoCall';

export default function Messages() {
  const { conversations, sendMessage, loadConvMessages } = useApp();
  const { user } = useAuth();
  const [activeConv, setActiveConv] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [audioCall, setAudioCall] = useState(null);
  const [videoCall, setVideoCall] = useState(null);
  const messagesEndRef = useRef(null);

  const filtered = conversations.filter(c =>
    c.user.username.toLowerCase().includes(search.toLowerCase()) ||
    c.user.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Get active conv from context (to keep messages in sync)
  const activeConvData = activeConv
    ? conversations.find(c => c.id === activeConv.id) || activeConv
    : null;

  const openChat = async (conv) => {
    setActiveConv(conv);
    setChatOpen(true);
    // Load messages and mark as seen
    await loadConvMessages(conv.id);
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvData?.messages?.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConv) return;
    const text = messageText.trim();
    setMessageText('');
    await sendMessage(activeConv.id, user, text);
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
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Send size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>No conversations yet</div>
              </div>
            ) : (
              filtered.map(conv => (
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
                      {conv.lastMessage || 'Say hello! 👋'}
                    </div>
                  </div>
                  {conv.unread && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="chat-area">
          {!activeConvData ? (
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
                  <img src={activeConvData.user.avatar} alt={activeConvData.user.username} className="avatar" style={{ width: 40, height: 40 }} />
                  {activeConvData.online && <div className="online-dot" />}
                </div>
                <div className="chat-header-info">
                  <div className="name">{activeConvData.user.username}</div>
                  <div className="status">{activeConvData.online ? '🟢 Active now' : 'Offline'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    id="chat-audio-call-btn"
                    className="btn btn-ghost"
                    aria-label="Audio call"
                    onClick={() => setAudioCall(activeConvData.user)}
                    title="Audio Call"
                  >
                    <Phone size={20} />
                  </button>
                  <button
                    id="chat-video-call-btn"
                    className="btn btn-ghost"
                    aria-label="Video call"
                    onClick={() => setVideoCall(activeConvData.user)}
                    title="Video Call"
                  >
                    <Video size={20} />
                  </button>
                  <button className="btn btn-ghost"><Info size={20} /></button>
                </div>
              </div>

              <div className="chat-messages" id="chat-messages-container">
                <div className="chat-date-divider">Today</div>
                {(activeConvData.messages || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
                    No messages yet. Say hello! 👋
                  </div>
                ) : (
                  (activeConvData.messages || []).map(msg => {
                    const isOwn = msg.from === user?.id;
                    return (
                      <div key={msg.id} className={`message-bubble-wrap ${isOwn ? 'own' : ''}`}>
                        {!isOwn && (
                          <img src={activeConvData.user.avatar} alt="avatar" className="avatar" style={{ width: 28, height: 28 }} />
                        )}
                        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                          {msg.text}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="message-time">{msg.time}</span>
                          {isOwn && (
                            msg.seen
                              ? <CheckCheck size={12} style={{ color: 'var(--accent-3)' }} title="Seen" />
                              : <Check size={12} style={{ color: 'var(--text-muted)' }} title="Sent" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-area" onSubmit={handleSend}>
                <div className="chat-input-wrap">
                  <input
                    id="chat-message-input"
                    className="chat-input"
                    placeholder={`Message ${activeConvData.user.username}...`}
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

      {audioCall && (
        <AudioCall contact={audioCall} onClose={() => setAudioCall(null)} />
      )}
      {videoCall && (
        <VideoCall contact={videoCall} onClose={() => setVideoCall(null)} />
      )}
    </>
  );
}
