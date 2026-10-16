import { createContext, useContext, useState, useEffect } from 'react';
import { CURRENT_USER } from '../data/mockData';

const AuthContext = createContext(null);

const DEMO_USERS = [
  { username: 'ismail', password: 'ismail123', ...CURRENT_USER },
  { username: 'demo', password: 'demo123', ...CURRENT_USER, username: 'demo', name: 'Demo User' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('ismailgram_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('ismailgram_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const found = DEMO_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem('ismailgram_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password.' };
  };

  const signup = (name, username, password) => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    const newUser = {
      ...CURRENT_USER,
      id: 'u_' + Date.now(),
      name,
      username,
      followers: 0,
      following: 0,
      posts: 0,
      verified: false,
      bio: '',
    };
    setUser(newUser);
    localStorage.setItem('ismailgram_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ismailgram_user');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('ismailgram_user', JSON.stringify(updated));
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
