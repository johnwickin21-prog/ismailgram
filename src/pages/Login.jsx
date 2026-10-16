import { useState } from 'react';
import { Eye, EyeOff, Camera, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise(r => setTimeout(r, 700));

    let result;
    if (mode === 'login') {
      result = login(form.username, form.password);
    } else {
      result = signup(form.name, form.username, form.password);
    }

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
    setForm({ name: '', username: '', password: '' });
  };

  const fillDemo = () => {
    setForm({ name: '', username: 'ismail', password: 'ismail123' });
    setMode('login');
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-box">
          <div className="login-logo">
            <img src="/ismailgram_logo.jpg" alt="Logo" style={{ width: 80, height: 80, borderRadius: '20px', objectFit: 'cover', margin: '0 auto 16px', display: 'block', boxShadow: 'var(--shadow-md)' }} />
            <h1>IsmailGram</h1>
            <p>Share your world, one photo at a time</p>
          </div>

          {error && (
            <div className="login-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange('name')}
                required
                autoComplete="name"
              />
            )}

            <input
              id="login-username"
              type="text"
              className="form-input"
              placeholder="Username"
              value={form.username}
              onChange={handleChange('username')}
              required
              autoComplete="username"
            />

            <div className="login-input-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Password"
                value={form.password}
                onChange={handleChange('password')}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="login-input-icon"
                onClick={() => setShowPass(s => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'login' ? 'Log In' : 'Sign Up'
              )}
            </button>

            {mode === 'login' && (
              <>
                <div className="login-divider">OR</div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={fillDemo}
                >
                  🎭 Try Demo Account
                </button>
              </>
            )}
          </form>

          <div className="login-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={switchMode}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </div>

          {mode === 'login' && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              Demo: <strong>ismail</strong> / <strong>ismail123</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
