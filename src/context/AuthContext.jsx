import { createContext, useContext, useState, useEffect } from 'react';
import { fetchProfile, upsertProfile, updateProfile, uploadBase64 } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ismailgram_user';

function buildProfileRow(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || '',
    bio: user.bio || '',
    avatar_url: user.avatar || 'https://i.pravatar.cc/150?img=11',
    website: user.website || '',
    followers: user.followers || 0,
    following: user.following || 0,
    posts_count: user.posts || 0,
    verified: user.verified || false,
    is_private: user.isPrivate || false,
  };
}

function dbProfileToUser(p) {
  return {
    id: p.id,
    username: p.username,
    name: p.name,
    bio: p.bio,
    avatar: p.avatar_url,
    website: p.website,
    followers: p.followers,
    following: p.following,
    posts: p.posts_count,
    verified: p.verified,
    isPrivate: p.is_private,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage, then refresh from DB
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const cached = JSON.parse(saved);
          setUser(cached); // show cached immediately
          // Refresh from DB in background
          try {
            const dbProfile = await fetchProfile(cached.id);
            if (dbProfile) {
              const fresh = dbProfileToUser(dbProfile);
              setUser(fresh);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            }
          } catch (_) {
            // offline — use cached
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username, password) => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Username and password are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      // Look up profile by username in DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (error || !data) {
        return { success: false, error: 'No account found with that username.' };
      }

      // Simple password check via stored hash
      // We store password_hash in a separate way — for this app we use a
      // "password" field that we add on the profiles table (optional).
      // For backward-compat, we accept any password for existing accounts
      // and use the stored one for new ones. Since we don't have real auth,
      // we store a bcrypt-free hash (just a flag).
      // SIMPLE APPROACH: store pw hint in localStorage alongside profile.
      const pwKey = `ismailgram_pw_${data.id}`;
      const storedPw = localStorage.getItem(pwKey);

      if (storedPw && storedPw !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      if (!storedPw) {
        // First login after migration — accept and store
        localStorage.setItem(pwKey, password);
      }

      const userData = dbProfileToUser(data);
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const signup = async (name, username, password) => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return { success: false, error: 'Username can only contain letters, numbers, dots and underscores.' };
    }

    try {
      // Check if username taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .single();

      if (existing) {
        return { success: false, error: 'Username already taken. Choose another.' };
      }

      const newId = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const profileRow = {
        id: newId,
        username: username.toLowerCase().trim(),
        name: name.trim(),
        bio: '',
        avatar_url: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        website: '',
        followers: 0,
        following: 0,
        posts_count: 0,
        verified: false,
        is_private: false,
      };

      await upsertProfile(profileRow);
      // Store password locally (simple — no Supabase Auth)
      localStorage.setItem(`ismailgram_pw_${newId}`, password);

      const userData = dbProfileToUser(profileRow);
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUser = async (updates) => {
    if (!user) return;
    try {
      // If avatar is a base64 dataURL, upload to Storage first
      let avatarUrl = updates.avatar;
      if (updates.avatar && updates.avatar.startsWith('data:')) {
        avatarUrl = await uploadBase64('avatars', updates.avatar, `${user.id}/`);
        updates = { ...updates, avatar: avatarUrl };
      }

      // Build DB update object
      const dbUpdates = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.followers !== undefined) dbUpdates.followers = updates.followers;
      if (updates.following !== undefined) dbUpdates.following = updates.following;
      if (updates.posts !== undefined) dbUpdates.posts_count = updates.posts;

      if (Object.keys(dbUpdates).length > 0) {
        const fresh = await updateProfile(user.id, dbUpdates);
        const userData = dbProfileToUser(fresh);
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return;
      }
    } catch (err) {
      console.error('updateUser error:', err);
    }
    // Fallback: local only
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
