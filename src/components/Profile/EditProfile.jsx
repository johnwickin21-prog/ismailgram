import { useState, useRef } from 'react';
import { X, Link } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function EditProfile({ onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) {
      setError('Name and username are required.');
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(form.username)) {
      setError('Username can only contain letters, numbers, dots and underscores.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // If new avatar file selected, upload it
      if (avatarFile) {
        const ext = avatarFile.name?.split('.').pop() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { data, error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: avatarFile.type,
        });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        await updateUser({ ...form, avatar: urlData.publicUrl });
      } else {
        await updateUser({ ...form });
      }
      setSuccess('Profile updated! ✓');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('EditProfile submit error:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit Profile</span>
          <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <form className="edit-profile-form" onSubmit={handleSubmit} id="edit-profile-form">
            <div className="edit-avatar-section">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={avatarPreview || user?.avatar}
                  alt="avatar"
                  className="avatar"
                  style={{ width: 72, height: 72, border: '3px solid var(--border-light)' }}
                />
                {loading && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '50%' }}>
                    <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  </div>
                )}
              </div>
              <div>
                <div className="username">{user?.username}</div>
                <button type="button" className="change-photo-btn" onClick={handlePhotoClick} disabled={loading}>
                  Change profile photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}
            {success && <div style={{ color: '#22c55e', fontSize: 13, padding: '8px 12px', background: 'rgba(34,197,94,0.1)', borderRadius: 8, marginBottom: 8 }}>{success}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="ep-name">Name</label>
              <input id="ep-name" type="text" className="form-input" value={form.name} onChange={handleChange('name')} maxLength={50} placeholder="Your name" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-username">Username</label>
              <input id="ep-username" type="text" className="form-input" value={form.username} onChange={handleChange('username')} maxLength={30} placeholder="username" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-bio">Bio</label>
              <textarea id="ep-bio" className="form-input form-textarea" value={form.bio} onChange={handleChange('bio')} maxLength={150} placeholder="Write something about yourself..." style={{ minHeight: 80 }} />
              <div className="char-count">{form.bio.length}/150</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-website">Website</label>
              <div style={{ position: 'relative' }}>
                <Link size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="ep-website" type="url" className="form-input" value={form.website} onChange={handleChange('website')} placeholder="https://yourwebsite.com" style={{ paddingLeft: 36 }} />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="edit-profile-form" className="btn btn-primary" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
              : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
