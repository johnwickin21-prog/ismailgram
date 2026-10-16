// ============================================================
// db.js — Supabase Data Access Layer for IsmailGram
// All database operations go through this file.
// Uses supabase-js v2 correct API (no supabase.raw())
// ============================================================

import { supabase } from './supabaseClient';

// ─── STORAGE helpers ─────────────────────────────────────────
export async function uploadFile(bucket, file, folder = '') {
  const ext = file.name?.split('.').pop() || (file.type?.split('/')[1]) || 'jpg';
  const path = `${folder}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function uploadBase64(bucket, base64, folder = '') {
  const res = await fetch(base64);
  const blob = await res.blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  const path = `${folder}${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type,
  });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ─── PROFILES ────────────────────────────────────────────────
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();                          // maybeSingle: returns null instead of error if not found
  if (error) throw error;
  return data || null;
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAllProfiles(excludeId) {
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchFollowing(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data || []).map(f => f.following_id);
}

export async function toggleFollow(followerId, followingId) {
  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id);
    // Decrement counters (read-then-write, no raw SQL needed)
    const { data: fp } = await supabase.from('profiles').select('followers').eq('id', followingId).single();
    if (fp) await supabase.from('profiles').update({ followers: Math.max(0, (fp.followers || 1) - 1) }).eq('id', followingId);
    const { data: rp } = await supabase.from('profiles').select('following').eq('id', followerId).single();
    if (rp) await supabase.from('profiles').update({ following: Math.max(0, (rp.following || 1) - 1) }).eq('id', followerId);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    // Increment counters
    const { data: fp } = await supabase.from('profiles').select('followers').eq('id', followingId).single();
    if (fp) await supabase.from('profiles').update({ followers: (fp.followers || 0) + 1 }).eq('id', followingId);
    const { data: rp } = await supabase.from('profiles').select('following').eq('id', followerId).single();
    if (rp) await supabase.from('profiles').update({ following: (rp.following || 0) + 1 }).eq('id', followerId);
    return true;
  }
}

// ─── POSTS ───────────────────────────────────────────────────
export async function fetchPosts(currentUserId) {
  const { data: postsData, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(id, username, name, avatar_url, verified)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  if (!postsData || postsData.length === 0) return [];

  const postIds = postsData.map(p => p.id);

  // Fetch likes by current user
  const { data: userLikes } = await supabase
    .from('likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds);
  const likedSet = new Set((userLikes || []).map(l => l.post_id));

  // Fetch saves by current user
  const { data: userSaves } = await supabase
    .from('saves').select('post_id').eq('user_id', currentUserId).in('post_id', postIds);
  const savedSet = new Set((userSaves || []).map(s => s.post_id));

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles!comments_user_id_fkey(id, username, avatar_url)')
    .in('post_id', postIds)
    .order('created_at', { ascending: true });

  const commentsByPost = {};
  (commentsData || []).forEach(c => {
    if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
    commentsByPost[c.post_id].push({
      id: c.id,
      user: { id: c.profiles.id, username: c.profiles.username, avatar: c.profiles.avatar_url },
      text: c.text,
      timestamp: timeAgoSimple(c.created_at),
    });
  });

  return postsData.map(p => ({
    id: p.id,
    user: {
      id: p.profiles.id,
      username: p.profiles.username,
      name: p.profiles.name,
      avatar: p.profiles.avatar_url,
      verified: p.profiles.verified,
    },
    image: p.image_url,
    caption: p.caption || '📸',
    likes: p.likes_count,
    liked: likedSet.has(p.id),
    saved: savedSet.has(p.id),
    comments: commentsByPost[p.id] || [],
    location: p.location || null,
    timestamp: timeAgoSimple(p.created_at),
    isVideo: p.is_video,
  }));
}

export async function createPost(userId, imageUrl, caption, location, isVideo, audience) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption: caption || '📸',
      location: location || null,
      is_video: isVideo || false,
      audience: audience || 'everyone',
      likes_count: 0,
    })
    .select()
    .single();
  if (error) throw error;
  // Increment user post count (read-then-write)
  const { data: prof } = await supabase.from('profiles').select('posts_count').eq('id', userId).single();
  if (prof) {
    await supabase.from('profiles').update({ posts_count: (prof.posts_count || 0) + 1 }).eq('id', userId);
  }
  return data;
}

export async function toggleLike(userId, postId, currentlyLiked) {
  if (currentlyLiked) {
    await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId);
    // Decrement likes_count
    const { data: p } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
    if (p) await supabase.from('posts').update({ likes_count: Math.max(0, (p.likes_count || 1) - 1) }).eq('id', postId);
    return false;
  } else {
    await supabase.from('likes').upsert({ user_id: userId, post_id: postId }, { onConflict: 'user_id,post_id', ignoreDuplicates: true });
    // Increment likes_count
    const { data: p } = await supabase.from('posts').select('likes_count').eq('id', postId).single();
    if (p) await supabase.from('posts').update({ likes_count: (p.likes_count || 0) + 1 }).eq('id', postId);
    return true;
  }
}

export async function toggleSave(userId, postId, currentlySaved) {
  if (currentlySaved) {
    await supabase.from('saves').delete().eq('user_id', userId).eq('post_id', postId);
    return false;
  } else {
    await supabase.from('saves').upsert({ user_id: userId, post_id: postId }, { onConflict: 'user_id,post_id', ignoreDuplicates: true });
    return true;
  }
}

export async function addComment(userId, postId, text) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ user_id: userId, post_id: postId, text })
    .select('*, profiles!comments_user_id_fkey(id, username, avatar_url)')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    user: { id: data.profiles.id, username: data.profiles.username, avatar: data.profiles.avatar_url },
    text: data.text,
    timestamp: 'Just now',
  };
}

export async function fetchUserPosts(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    image: p.image_url,
    likes: p.likes_count,
    comments: [],
    isVideo: p.is_video,
    caption: p.caption,
    timestamp: timeAgoSimple(p.created_at),
  }));
}

export async function fetchSavedPosts(userId) {
  const { data, error } = await supabase
    .from('saves')
    .select('post_id, posts(id, image_url, likes_count, is_video, caption, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || [])
    .filter(s => s.posts)
    .map(s => ({
      id: s.posts.id,
      image: s.posts.image_url,
      likes: s.posts.likes_count,
      comments: [],
      isVideo: s.posts.is_video,
      caption: s.posts.caption,
      timestamp: timeAgoSimple(s.posts.created_at),
    }));
}

// ─── STORIES ─────────────────────────────────────────────────
export async function fetchStories(currentUserId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select('*, profiles!stories_user_id_fkey(id, username, avatar_url)')
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(s => ({
    id: s.id,
    user: { id: s.profiles.id, username: s.profiles.username, avatar: s.profiles.avatar_url },
    image: s.image_url,
    seen: Array.isArray(s.seen_by) && s.seen_by.includes(currentUserId),
    timestamp: timeAgoSimple(s.created_at),
  }));
}

export async function createStory(userId, imageUrl) {
  const { data, error } = await supabase
    .from('stories')
    .insert({ user_id: userId, image_url: imageUrl, seen_by: [] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markStorySeen(storyId, userId) {
  const { data: story } = await supabase.from('stories').select('seen_by').eq('id', storyId).maybeSingle();
  if (!story) return;
  const seenBy = story.seen_by || [];
  if (!seenBy.includes(userId)) {
    await supabase.from('stories').update({ seen_by: [...seenBy, userId] }).eq('id', storyId);
  }
}

// ─── CONVERSATIONS & MESSAGES ─────────────────────────────────
export async function fetchConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:profiles!conversations_user1_id_fkey(id, username, name, avatar_url),
      user2:profiles!conversations_user2_id_fkey(id, username, name, avatar_url)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const convIds = (data || []).map(c => c.id);
  if (convIds.length === 0) return [];

  // Fetch last message for each conversation
  const { data: lastMsgs } = await supabase
    .from('messages')
    .select('*')
    .in('conv_id', convIds)
    .order('created_at', { ascending: false });

  const lastMsgByConv = {};
  (lastMsgs || []).forEach(m => {
    if (!lastMsgByConv[m.conv_id]) lastMsgByConv[m.conv_id] = m;
  });

  // Fetch unread counts
  const { data: unreadData } = await supabase
    .from('messages')
    .select('conv_id')
    .in('conv_id', convIds)
    .neq('sender_id', userId)
    .eq('seen', false);
  const unreadConvIds = new Set((unreadData || []).map(m => m.conv_id));

  return (data || []).map(c => {
    const otherUser = c.user1_id === userId ? c.user2 : c.user1;
    const lastMsg = lastMsgByConv[c.id];
    return {
      id: c.id,
      user: {
        id: otherUser.id,
        username: otherUser.username,
        name: otherUser.name,
        avatar: otherUser.avatar_url,
      },
      lastMessage: lastMsg?.text || '',
      timestamp: lastMsg ? timeAgoSimple(lastMsg.created_at) : '',
      unread: unreadConvIds.has(c.id),
      online: false,
      messages: [],
    };
  });
}

export async function fetchMessages(convId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conv_id', convId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(m => ({
    id: m.id,
    from: m.sender_id,
    text: m.text,
    time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    seen: m.seen,
  }));
}

export async function sendMessage(convId, senderId, text) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conv_id: convId, sender_id: senderId, text, seen: false })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    from: data.sender_id,
    text: data.text,
    time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    seen: data.seen,
  };
}

export async function markMessagesSeen(convId, currentUserId) {
  await supabase
    .from('messages')
    .update({ seen: true })
    .eq('conv_id', convId)
    .neq('sender_id', currentUserId)
    .eq('seen', false);
}

export async function getOrCreateConversation(userId1, userId2) {
  // Try existing
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: userId1, user2_id: userId2 })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
export async function fetchNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url), post:posts(image_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map(n => ({
    id: n.id,
    type: n.type,
    user: { id: n.actor.id, username: n.actor.username, avatar: n.actor.avatar_url },
    text: n.type === 'like' ? 'liked your photo.'
        : n.type === 'comment' ? 'commented on your post.'
        : n.type === 'follow' ? 'started following you.'
        : 'mentioned you.',
    postImage: n.post?.image_url || null,
    timestamp: timeAgoSimple(n.created_at),
    unread: !n.read,
  }));
}

export async function markNotificationsRead(userId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

export async function createNotification(recipientId, actorId, type, postId = null) {
  if (recipientId === actorId) return;
  await supabase.from('notifications').insert({
    user_id: recipientId,
    actor_id: actorId,
    type,
    post_id: postId || null,
    read: false,
  });
}

// ─── SEARCH ──────────────────────────────────────────────────
export async function searchProfiles(query) {
  if (!query || query.trim().length < 2) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, name, avatar_url, verified, followers')
    .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    username: p.username,
    name: p.name,
    avatar: p.avatar_url,
    verified: p.verified,
    followers: p.followers,
  }));
}

// ─── LOCAL HELPER ─────────────────────────────────────────────
function timeAgoSimple(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}
