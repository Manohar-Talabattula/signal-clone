'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Smartphone, User as UserIcon, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');

  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [otp, setOtp] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick seed user accounts for instant demo switching
  const seedUsers = [
    { name: 'Alice Vance', id: 'alice', phone: '+15550101', role: 'Dev Lead (Admin)' },
    { name: 'Bob Smith', id: 'bob', phone: '+15550102', role: 'Product Designer' },
    { name: 'Charlie Brown', id: 'charlie', phone: '+15550103', role: 'Security Researcher' },
    { name: 'Dana Scully', id: 'dana', phone: '+15550104', role: 'Systems Architect' },
  ];

  const handleQuickLogin = async (userId: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userId, '123456');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login' && !identifier.trim()) {
      setError('Please enter a phone number or username');
      return;
    }
    if (mode === 'register' && (!username.trim() || !phone.trim() || !displayName.trim())) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(identifier, otp);
      } else {
        await register(
          username,
          phone,
          displayName,
          avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1b1f23] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden text-gray-900 dark:text-gray-100 transition-all">
        {/* Header Banner */}
        <div className="bg-[#2c6bed] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-10">
            <Shield size={120} />
          </div>
          <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-3">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Signal</h1>
          <p className="text-sm text-blue-100 mt-1">Speak Freely. Say Hello to Privacy.</p>
        </div>

        <div className="p-6">
          {/* Quick Switch Demo Bar */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <Sparkles size={14} /> Quick Demo Login:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {seedUsers.map((su) => (
                <button
                  key={su.id}
                  onClick={() => handleQuickLogin(su.id)}
                  disabled={loading}
                  className="flex flex-col items-start p-2 bg-white dark:bg-[#282c31] hover:bg-blue-100 dark:hover:bg-[#343a42] rounded-lg border border-gray-200 dark:border-gray-700 text-left text-xs transition"
                >
                  <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-[#2c6bed]" /> {su.name}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{su.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-gray-200 dark:border-gray-800 w-full"></div>
            <span className="bg-white dark:bg-[#1b1f23] px-3 text-xs text-gray-400 uppercase tracking-wider font-medium absolute">
              Or Custom Sign In
            </span>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-gray-100 dark:bg-[#282c31] p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setStep('details');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1b1f23] text-[#2c6bed] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setStep('details');
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1b1f23] text-[#2c6bed] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleProceedToOtp} className="space-y-4">
              {mode === 'login' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number or Username
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. +15550101 or alice"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        placeholder="alice"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+15550199"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2c6bed] hover:bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                Continue to Verification
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mock Verification Code (OTP)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 tracking-widest text-center font-mono text-lg bg-gray-50 dark:bg-[#282c31] border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2c6bed]"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Enter code <span className="font-mono text-[#2c6bed] font-bold">123456</span> to complete authentication.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="w-1/3 py-2.5 bg-gray-200 dark:bg-[#282c31] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#2c6bed] hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Enter Signal'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
