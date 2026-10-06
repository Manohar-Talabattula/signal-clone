'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Moon, Sun, Shield, Bell, Smartphone, Info, X, Camera, Check, QrCode } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, theme, toggleTheme, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'notifications' | 'devices' | 'about'>('profile');

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await updateProfile({ display_name: displayName, about, avatar_url: avatarUrl });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: Camera },
    { id: 'appearance', label: 'Appearance', icon: theme === 'dark' ? Moon : Sun },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'devices', label: 'Linked Devices', icon: Smartphone },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1b1f23] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-gray-900 dark:text-gray-100 flex h-[600px]">
        {/* Sidebar Nav */}
        <div className="w-56 bg-gray-50 dark:bg-[#16191e] border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold mb-4 text-[#2c6bed]">Settings</h2>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#2c6bed] text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#282c31]'
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <button
            onClick={logout}
            className="w-full py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold rounded-xl transition"
          >
            Log Out
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {activeTab} Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-md">
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl || user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full bg-gray-200 object-cover border-2 border-[#2c6bed]"
                  />
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Avatar URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    About / Status Quote
                  </label>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={user.phone}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl cursor-not-allowed"
                  />
                </div>

                {successMsg && <p className="text-xs text-green-500 font-semibold">{successMsg}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 bg-[#2c6bed] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md transition"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Theme Mode</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={toggleTheme}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 ${
                        theme === 'dark'
                          ? 'border-[#2c6bed] bg-blue-50/20 dark:bg-blue-950/40'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <Moon size={24} className="text-[#2c6bed]" />
                      <span className="text-xs font-bold">Signal Dark</span>
                    </div>

                    <div
                      onClick={toggleTheme}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col items-center gap-2 ${
                        theme === 'light'
                          ? 'border-[#2c6bed] bg-blue-50/20'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <Sun size={24} className="text-amber-500" />
                      <span className="text-xs font-bold">Signal Light</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#282c31] rounded-2xl border border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold mb-1">Simulated Protocol Encryption</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    All 1-on-1 and Group chats are secured with simulated Signal Protocol encryption. Keys are derived per session.
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="text-xs font-semibold">Read Receipts</div>
                    <div className="text-[11px] text-gray-400">Show blue checkmarks when you read messages</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2c6bed]" />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="text-xs font-semibold">Message Sound Alerts</div>
                    <div className="text-[11px] text-gray-400">Play notification chime on new message</div>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2c6bed]" />
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="space-y-4 text-center py-4">
                <QrCode size={80} className="mx-auto text-[#2c6bed]" />
                <h4 className="text-sm font-bold">Link Signal Desktop or Mobile</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  Scan this QR code from your Signal app to link this browser session securely.
                </p>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
                  <h4 className="font-bold mb-1 text-sm">Signal Desktop Clone v7.12</h4>
                  <p>SDE Fullstack Messaging Platform built with Next.js, FastAPI & SQLite.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
