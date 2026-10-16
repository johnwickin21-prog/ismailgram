import { useState, useRef } from 'react';
import { X, Link, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EditProfile({ onClose }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

    const reader = new FileReader();
    reader.onload = (event) => {
      updateUser({ avatar: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) {
      setError('Name and username are required.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    updateUser({ ...form });
    setLoading(false);
    onClose();
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
              <img src={user?.avatar} alt="avatar" className="avatar" style={{ width: 52, height: 52 }} />
              <div>
                <div className="username">{user?.username}</div>
                <button type="button" className="change-photo-btn" onClick={handlePhotoClick}>Change profile photo</button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {error && (
              <div className="login-error">{error}</div>
            )}

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
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="edit-profile-form" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
