import { useState } from 'react';
import {
  User, Lock, Bell, Eye, Shield, Palette, Globe,
  HelpCircle, Info, Trash2, LogOut, ChevronRight,
  Moon, Sun, Monitor, Smartphone, Camera, Heart,
  MessageCircle, UserPlus, Tag, Volume2, Mail,
  X, Check, AlertTriangle, Key, Activity,
  Accessibility, Languages, BookOpen, Flag, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`settings-toggle ${checked ? 'on' : 'off'}`}
  >
    <span className="toggle-knob" />
  </button>
);

const SettingRow = ({ icon: Icon, label, desc, right, onClick, danger }) => (
  <button
    className={`settings-row ${danger ? 'danger' : ''}`}
    onClick={onClick}
  >
    {Icon && (
      <span className={`settings-row-icon ${danger ? 'danger' : ''}`}>
        <Icon size={18} />
      </span>
    )}
    <div className="settings-row-text">
      <div className="settings-row-label">{label}</div>
      {desc && <div className="settings-row-desc">{desc}</div>}
    </div>
    <div className="settings-row-right">
      {right ?? <ChevronRight size={16} />}
    </div>
  </button>
);

const SectionHeader = ({ title }) => (
  <div className="settings-section-header">{title}</div>
);

const Divider = () => <div className="settings-divider" />;

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Privacy
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storyReplies, setStoryReplies] = useState(true);
  const [allowTags, setAllowTags] = useState(true);

  // Notifications
  const [notifLikes, setNotifLikes] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifFollows, setNotifFollows] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifLiveVideos, setNotifLiveVideos] = useState(false);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifSMS, setNotifSMS] = useState(false);
  const [notifPush, setNotifPush] = useState(true);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [savedLogin, setSavedLogin] = useState(true);

  // Appearance
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');

  // Content
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [language, setLanguage] = useState('English');
  const [autoPlay, setAutoPlay] = useState(true);
  const [highQuality, setHighQuality] = useState(true);

  // UI state
  const [activeSection, setActiveSection] = useState('home');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sections = [
    {
      id: 'account',
      icon: User,
      label: 'Account',
      desc: 'Edit profile, username, password',
    },
    {
      id: 'privacy',
      icon: Eye,
      label: 'Privacy',
      desc: 'Account privacy, story, tags',
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      desc: 'Push, email, SMS notifications',
    },
    {
      id: 'security',
      icon: Shield,
      label: 'Security',
      desc: 'Two-factor auth, login activity',
    },
    {
      id: 'appearance',
      icon: Palette,
      label: 'Appearance',
      desc: 'Theme, font size, display',
    },
    {
      id: 'content',
      icon: Globe,
      label: 'Content & Display',
      desc: 'Language, accessibility, content',
    },
    {
      id: 'about',
      icon: Info,
      label: 'About',
      desc: 'Version, terms, privacy policy',
    },
  ];

  const renderHome = () => (
    <div className="settings-home">
      {/* User card */}
      <div className="settings-user-card">
        <img src={user?.avatar} alt={user?.username} className="avatar" style={{ width: 64, height: 64 }} />
        <div>
          <div className="settings-user-name">{user?.username}</div>
          <div className="settings-user-sub">{user?.name}</div>
          <button
            className="settings-edit-link"
            onClick={() => navigate('/profile')}
          >
            View profile
          </button>
        </div>
      </div>

      <Divider />

      {/* Main sections */}
      <div className="settings-list">
        {sections.map(s => (
          <SettingRow
            key={s.id}
            icon={s.icon}
            label={s.label}
            desc={s.desc}
            onClick={() => setActiveSection(s.id)}
          />
        ))}
      </div>

      <Divider />

      {/* Danger zone */}
      <div className="settings-list">
        <SettingRow
          icon={AlertTriangle}
          label="Deactivate Account"
          desc="Temporarily disable your account"
          danger
          onClick={() => setShowDeactivateConfirm(true)}
        />
        <SettingRow
          icon={Trash2}
          label="Delete Account"
          desc="Permanently delete your account"
          danger
          onClick={() => setShowDeleteConfirm(true)}
        />
        <SettingRow
          icon={LogOut}
          label="Log Out"
          right={null}
          danger
          onClick={handleLogout}
        />
      </div>

      <div className="settings-version">IsmailGram v2.0.0 · Made with ❤️</div>
    </div>
  );

  const renderAccount = () => (
    <div className="settings-section-body">
      <SectionHeader title="Personal Information" />
      <div className="settings-list">
        <SettingRow icon={User} label="Edit Profile" desc="Name, bio, website, profile photo" onClick={() => navigate('/profile')} />
        <SettingRow icon={User} label="Username" desc={`@${user?.username}`} onClick={() => {}} />
        <SettingRow icon={Mail} label="Email Address" desc="Manage linked email" onClick={() => {}} />
        <SettingRow icon={Smartphone} label="Phone Number" desc="Add or change phone number" onClick={() => {}} />
      </div>

      <SectionHeader title="Account" />
      <div className="settings-list">
        <SettingRow icon={Key} label="Change Password" desc="Update your password" onClick={() => {}} />
        <SettingRow icon={Activity} label="Professional Account" desc="Switch to creator or business" onClick={() => {}} />
        <SettingRow icon={Languages} label="Linked Accounts" desc="Facebook, Twitter, etc." onClick={() => {}} />
      </div>

      <SectionHeader title="Data" />
      <div className="settings-list">
        <SettingRow icon={BookOpen} label="Download Your Data" desc="Request a copy of your data" onClick={() => {}} />
        <SettingRow icon={Activity} label="Account Activity" desc="View recent login history" onClick={() => {}} />
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="settings-section-body">
      <SectionHeader title="Account Privacy" />
      <div className="settings-list">
        <SettingRow
          icon={Lock}
          label="Private Account"
          desc="Only approved followers can see your content"
          right={<Toggle id="toggle-private" checked={privateAccount} onChange={setPrivateAccount} />}
        />
        <SettingRow
          icon={Activity}
          label="Activity Status"
          desc="Show when you were last active"
          right={<Toggle id="toggle-activity" checked={activityStatus} onChange={setActivityStatus} />}
        />
      </div>

      <SectionHeader title="Interactions" />
      <div className="settings-list">
        <SettingRow
          icon={MessageCircle}
          label="Story Replies"
          desc="Allow replies to your stories"
          right={<Toggle id="toggle-stories" checked={storyReplies} onChange={setStoryReplies} />}
        />
        <SettingRow
          icon={Tag}
          label="Tags & Mentions"
          desc="Allow others to tag you"
          right={<Toggle id="toggle-tags" checked={allowTags} onChange={setAllowTags} />}
        />
        <SettingRow icon={UserPlus} label="Restricted Accounts" desc="Manage restricted accounts" onClick={() => {}} />
        <SettingRow icon={X} label="Blocked Accounts" desc="View and manage blocked users" onClick={() => {}} />
        <SettingRow icon={Globe} label="Close Friends" desc="Manage your close friends list" onClick={() => {}} />
      </div>

      <SectionHeader title="Content" />
      <div className="settings-list">
        <SettingRow icon={Heart} label="Liked Posts" desc="Posts you've liked" onClick={() => {}} />
        <SettingRow icon={Eye} label="Hidden Words" desc="Filter offensive comments" onClick={() => {}} />
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="settings-section-body">
      <SectionHeader title="Push Notifications" />
      <div className="settings-list">
        <SettingRow
          icon={Bell}
          label="Push Notifications"
          desc="Enable all push notifications"
          right={<Toggle id="toggle-push" checked={notifPush} onChange={setNotifPush} />}
        />
      </div>

      <SectionHeader title="Interactions" />
      <div className="settings-list">
        <SettingRow
          icon={Heart}
          label="Likes"
          desc="Notify when someone likes your post"
          right={<Toggle id="toggle-likes" checked={notifLikes} onChange={setNotifLikes} />}
        />
        <SettingRow
          icon={MessageCircle}
          label="Comments"
          desc="Notify when someone comments"
          right={<Toggle id="toggle-comments" checked={notifComments} onChange={setNotifComments} />}
        />
        <SettingRow
          icon={UserPlus}
          label="New Followers"
          desc="Notify when someone follows you"
          right={<Toggle id="toggle-follows" checked={notifFollows} onChange={setNotifFollows} />}
        />
        <SettingRow
          icon={MessageCircle}
          label="Messages"
          desc="Notify for new direct messages"
          right={<Toggle id="toggle-messages" checked={notifMessages} onChange={setNotifMessages} />}
        />
        <SettingRow
          icon={Camera}
          label="Live Videos"
          desc="Notify when someone goes live"
          right={<Toggle id="toggle-live" checked={notifLiveVideos} onChange={setNotifLiveVideos} />}
        />
      </div>

      <SectionHeader title="Other Notifications" />
      <div className="settings-list">
        <SettingRow
          icon={Mail}
          label="Email Notifications"
          desc="Get notifications by email"
          right={<Toggle id="toggle-email" checked={notifEmail} onChange={setNotifEmail} />}
        />
        <SettingRow
          icon={Smartphone}
          label="SMS Notifications"
          desc="Get notifications by SMS"
          right={<Toggle id="toggle-sms" checked={notifSMS} onChange={setNotifSMS} />}
        />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-section-body">
      <SectionHeader title="Login Security" />
      <div className="settings-list">
        <SettingRow
          icon={Shield}
          label="Two-Factor Authentication"
          desc={twoFactor ? 'Enabled — Your account is protected' : 'Add an extra layer of security'}
          right={<Toggle id="toggle-2fa" checked={twoFactor} onChange={setTwoFactor} />}
        />
        <SettingRow
          icon={Key}
          label="Change Password"
          desc="Update your account password"
          onClick={() => {}}
        />
        <SettingRow
          icon={Activity}
          label="Login Activity"
          desc="View devices and locations"
          onClick={() => {}}
        />
        <SettingRow
          icon={BookOpen}
          label="Saved Login Info"
          desc="Manage remembered passwords"
          right={<Toggle id="toggle-saved-login" checked={savedLogin} onChange={setSavedLogin} />}
        />
      </div>

      <SectionHeader title="Data & Permissions" />
      <div className="settings-list">
        <SettingRow icon={Globe} label="Apps & Websites" desc="Manage third-party app access" onClick={() => {}} />
        <SettingRow icon={Mail} label="Emails from IsmailGram" desc="View security emails sent to you" onClick={() => {}} />
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="settings-section-body">
      <SectionHeader title="Theme" />
      <div className="settings-theme-selector">
        {[
          { id: 'light', icon: Sun, label: 'Light' },
          { id: 'dark', icon: Moon, label: 'Dark' },
          { id: 'auto', icon: Monitor, label: 'Auto' },
        ].map(t => (
          <button
            key={t.id}
            id={`theme-${t.id}`}
            className={`theme-option ${theme === t.id ? 'active' : ''}`}
            onClick={() => setTheme(t.id)}
          >
            <t.icon size={24} />
            <span>{t.label}</span>
            {theme === t.id && <Check size={14} className="theme-check" />}
          </button>
        ))}
      </div>

      <SectionHeader title="Font Size" />
      <div className="settings-list">
        <div className="settings-font-selector">
          {['small', 'medium', 'large'].map(f => (
            <button
              key={f}
              id={`font-${f}`}
              className={`font-option ${fontSize === f ? 'active' : ''}`}
              onClick={() => setFontSize(f)}
            >
              <span style={{ fontSize: f === 'small' ? 13 : f === 'medium' ? 16 : 20 }}>Aa</span>
              <span className="font-label">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <SectionHeader title="Display" />
      <div className="settings-list">
        <SettingRow icon={Monitor} label="Grid View" desc="Choose default feed layout" onClick={() => {}} />
        <SettingRow icon={Accessibility} label="Accessibility" desc="Text, contrast, motion" onClick={() => {}} />
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="settings-section-body">
      <SectionHeader title="Content Preferences" />
      <div className="settings-list">
        <SettingRow
          icon={Eye}
          label="Sensitive Content"
          desc="Show content that may be sensitive"
          right={<Toggle id="toggle-sensitive" checked={sensitiveContent} onChange={setSensitiveContent} />}
        />
        <SettingRow
          icon={Volume2}
          label="Auto-Play Videos"
          desc="Play videos automatically in feed"
          right={<Toggle id="toggle-autoplay" checked={autoPlay} onChange={setAutoPlay} />}
        />
        <SettingRow
          icon={Camera}
          label="High Quality Uploads"
          desc="Upload photos and videos in highest quality"
          right={<Toggle id="toggle-quality" checked={highQuality} onChange={setHighQuality} />}
        />
      </div>

      <SectionHeader title="Language & Region" />
      <div className="settings-list">
        <SettingRow icon={Languages} label="Language" desc={language} onClick={() => {}} />
        <SettingRow icon={Globe} label="Region" desc="India" onClick={() => {}} />
      </div>

      <SectionHeader title="Accessibility" />
      <div className="settings-list">
        <SettingRow icon={Accessibility} label="Alt Text" desc="Auto-generate alt text for images" onClick={() => {}} />
        <SettingRow icon={Monitor} label="Reduce Motion" desc="Minimize animations" onClick={() => {}} />
        <SettingRow icon={Eye} label="High Contrast" desc="Increase visual contrast" onClick={() => {}} />
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="settings-section-body">
      <SectionHeader title="Legal" />
      <div className="settings-list">
        <SettingRow icon={BookOpen} label="Privacy Policy" onClick={() => {}} />
        <SettingRow icon={BookOpen} label="Terms of Service" onClick={() => {}} />
        <SettingRow icon={BookOpen} label="Cookie Policy" onClick={() => {}} />
        <SettingRow icon={BookOpen} label="Community Guidelines" onClick={() => {}} />
      </div>

      <SectionHeader title="Support" />
      <div className="settings-list">
        <SettingRow icon={HelpCircle} label="Help Center" onClick={() => {}} />
        <SettingRow icon={Flag} label="Report a Problem" onClick={() => {}} />
        <SettingRow icon={MessageCircle} label="Give Feedback" onClick={() => {}} />
      </div>

      <SectionHeader title="App Info" />
      <div className="settings-list">
        <SettingRow icon={Info} label="App Version" right={<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>2.0.0</span>} />
        <SettingRow icon={Info} label="Build" right={<span style={{ fontSize: 13, color: 'var(--text-muted)' }}>2026.10.16</span>} />
      </div>
    </div>
  );

  const sectionContent = {
    account: { title: 'Account', render: renderAccount },
    privacy: { title: 'Privacy', render: renderPrivacy },
    notifications: { title: 'Notifications', render: renderNotifications },
    security: { title: 'Security', render: renderSecurity },
    appearance: { title: 'Appearance', render: renderAppearance },
    content: { title: 'Content & Display', render: renderContent },
    about: { title: 'About', render: renderAbout },
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        {activeSection !== 'home' && (
          <button
            className="settings-back-btn"
            onClick={() => setActiveSection('home')}
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="settings-title">
          {activeSection === 'home' ? 'Settings' : sectionContent[activeSection]?.title}
        </h1>
      </div>

      {/* Body */}
      <div className="settings-body">
        {activeSection === 'home'
          ? renderHome()
          : sectionContent[activeSection]?.render()}
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: '#ff3b30' }}>Delete Account</span>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Are you sure?</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                  This will permanently delete your IsmailGram account, including all your posts, messages, followers, and data. This action <strong>cannot be undone</strong>.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate confirm */}
      {showDeactivateConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeactivateConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Deactivate Account</span>
              <button className="modal-close-btn" onClick={() => setShowDeactivateConfirm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>😴</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Deactivate Account?</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                  Your profile will be hidden and your content will be invisible to others. You can reactivate at any time by logging back in.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeactivateConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
