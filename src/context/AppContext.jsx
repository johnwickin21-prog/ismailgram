import { createContext, useContext, useState, useCallback } from 'react';
import { POSTS, STORIES, NOTIFICATIONS, CONVERSATIONS } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [posts, setPosts] = useState(POSTS);
  const [stories, setStories] = useState(STORIES);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const toggleLike = useCallback((postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.liked;
      return { ...p, liked, likes: liked ? p.likes + 1 : p.likes - 1 };
    }));
  }, []);

  const toggleSave = useCallback((postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, saved: !p.saved } : p
    ));
  }, []);

  const addComment = useCallback((postId, user, text) => {
    const newComment = {
      id: 'c_' + Date.now(),
      user,
      text,
      timestamp: 'Just now',
    };
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    ));
  }, []);

  const addPost = useCallback((post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const addStory = useCallback((story) => {
    setStories(prev => [story, ...prev]);
  }, []);

  const markStorySeen = useCallback((storyId) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, seen: true } : s));
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }, []);

  const sendMessage = useCallback((convId, user, text) => {
    const newMsg = { id: 'm_' + Date.now(), from: user.id, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, lastMessage: text, timestamp: 'now', unread: false, messages: [...c.messages, newMsg] }
        : c
    ));
  }, []);

  const unreadNotifCount = notifications.filter(n => n.unread).length;
  const unreadMsgCount = conversations.filter(c => c.unread).length;

  return (
    <AppContext.Provider value={{
      posts, stories, notifications, conversations,
      toasts, showToast,
      toggleLike, toggleSave, addComment, addPost, addStory,
      markStorySeen, markNotificationsRead,
      sendMessage,
      unreadNotifCount, unreadMsgCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
