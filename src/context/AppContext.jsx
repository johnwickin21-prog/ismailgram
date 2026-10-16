import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/db';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const currentUserIdRef = useRef(null);
  const realtimeRef = useRef(null);

  // ── Toast ────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // ── Data loading ─────────────────────────────────────────
  const loadPosts = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setPostsLoading(true);
      const data = await db.fetchPosts(userId);
      setPosts(data);
    } catch (err) {
      console.error('loadPosts error:', err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const loadStories = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setStoriesLoading(true);
      const data = await db.fetchStories(userId);
      setStories(data);
    } catch (err) {
      console.error('loadStories error:', err);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const data = await db.fetchNotifications(userId);
      setNotifications(data);
    } catch (err) {
      console.error('loadNotifications error:', err);
    }
  }, []);

  const loadConversations = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const data = await db.fetchConversations(userId);
      setConversations(data);
    } catch (err) {
      console.error('loadConversations error:', err);
    }
  }, []);

  // Called by App.jsx when user logs in
  const initData = useCallback(async (userId) => {
    if (!userId) return;
    currentUserIdRef.current = userId;
    await Promise.all([
      loadPosts(userId),
      loadStories(userId),
      loadNotifications(userId),
      loadConversations(userId),
    ]);
    setupRealtime(userId);
  }, [loadPosts, loadStories, loadNotifications, loadConversations]);

  const clearData = useCallback(() => {
    setPosts([]);
    setStories([]);
    setNotifications([]);
    setConversations([]);
    currentUserIdRef.current = null;
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
  }, []);

  // ── Realtime subscriptions ────────────────────────────────
  const setupRealtime = (userId) => {
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current);
    }
    const channel = supabase
      .channel('ismailgram_realtime')
      // New messages
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        setConversations(prev => prev.map(c => {
          if (c.id !== msg.conv_id) return c;
          const newMsg = {
            id: msg.id,
            from: msg.sender_id,
            text: msg.text,
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            seen: msg.seen,
          };
          return {
            ...c,
            lastMessage: msg.text,
            timestamp: 'now',
            unread: msg.sender_id !== userId,
            messages: [...(c.messages || []), newMsg],
          };
        }));
      })
      // Messages marked seen
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (msg.seen) {
          setConversations(prev => prev.map(c => {
            if (c.id !== msg.conv_id) return c;
            return {
              ...c,
              messages: (c.messages || []).map(m =>
                m.id === msg.id ? { ...m, seen: true } : m
              ),
            };
          }));
        }
      })
      // New notifications
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
        loadNotifications(userId);
      })
      // New posts
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        loadPosts(userId);
      })
      // New stories
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
        loadStories(userId);
      })
      .subscribe();
    realtimeRef.current = channel;
  };

  // ── Post actions ─────────────────────────────────────────
  const toggleLike = useCallback(async (postId) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.liked;
      return { ...p, liked, likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1) };
    }));
    try {
      await db.toggleLike(userId, postId, post.liked);
      // Create notification if liking
      if (!post.liked && post.user.id !== userId) {
        await db.createNotification(post.user.id, userId, 'like', postId);
      }
    } catch (err) {
      // Revert on error
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        return { ...p, liked: post.liked, likes: post.likes };
      }));
      console.error('toggleLike error:', err);
    }
  }, [posts]);

  const toggleSave = useCallback(async (postId) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, saved: !p.saved } : p
    ));
    try {
      await db.toggleSave(userId, postId, post.saved);
    } catch (err) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, saved: post.saved } : p
      ));
      console.error('toggleSave error:', err);
    }
  }, [posts]);

  const addComment = useCallback(async (postId, user, text) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    try {
      const comment = await db.addComment(userId, postId, text);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      ));
      // Create notification
      const post = posts.find(p => p.id === postId);
      if (post && post.user.id !== userId) {
        await db.createNotification(post.user.id, userId, 'comment', postId);
      }
    } catch (err) {
      console.error('addComment error:', err);
    }
  }, [posts]);

  const addPost = useCallback(async (postData) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    // The post has already been created in Supabase via CreatePost component.
    // Just reload posts to show it.
    await loadPosts(userId);
  }, [loadPosts]);

  const addStory = useCallback(async (storyData) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    // Story already saved to DB in StoriesBar. Just reload.
    await loadStories(userId);
  }, [loadStories]);

  const markStorySeen = useCallback(async (storyId) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, seen: true } : s));
    try {
      await db.markStorySeen(storyId, userId);
    } catch (err) {
      console.error('markStorySeen error:', err);
    }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      await db.markNotificationsRead(userId);
    } catch (err) {
      console.error('markNotificationsRead error:', err);
    }
  }, []);

  const sendMessage = useCallback(async (convId, user, text) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    // Optimistic update
    const newMsg = {
      id: 'm_' + Date.now(),
      from: userId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seen: false,
    };
    setConversations(prev => prev.map(c =>
      c.id === convId
        ? { ...c, lastMessage: text, timestamp: 'now', unread: false, messages: [...(c.messages || []), newMsg] }
        : c
    ));
    try {
      const saved = await db.sendMessage(convId, userId, text);
      // Replace temp message with real one
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: (c.messages || []).map(m => m.id === newMsg.id ? saved : m) }
          : c
      ));
    } catch (err) {
      console.error('sendMessage error:', err);
    }
  }, []);

  const loadConvMessages = useCallback(async (convId) => {
    const userId = currentUserIdRef.current;
    if (!userId) return;
    try {
      const messages = await db.fetchMessages(convId);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages } : c
      ));
      // Mark messages as seen
      await db.markMessagesSeen(convId, userId);
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unread: false } : c
      ));
    } catch (err) {
      console.error('loadConvMessages error:', err);
    }
  }, []);

  const unreadNotifCount = notifications.filter(n => n.unread).length;
  const unreadMsgCount = conversations.filter(c => c.unread).length;

  return (
    <AppContext.Provider value={{
      posts, stories, notifications, conversations,
      toasts, showToast,
      postsLoading, storiesLoading,
      toggleLike, toggleSave, addComment, addPost, addStory,
      markStorySeen, markNotificationsRead,
      sendMessage, loadConvMessages,
      unreadNotifCount, unreadMsgCount,
      initData, clearData,
      loadPosts, loadStories, loadConversations,
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
