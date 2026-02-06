import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';

const STORAGE_KEY = 'reskin_saved_accounts';

const ROLE_BADGES = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', ring: 'ring-purple-200' },
  am: { label: 'AM', color: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200' },
  client: { label: 'Client', color: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200' },
};

// Add Account Modal with Login/Register tabs
function AddAccountModal({ isOpen, onClose, onAdd, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [label, setLabel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setLabel('');
    setError('');
    setSuccess('');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      setIsLoading(true);
      const result = await onRegister({ email, password, fullName, label: label || email.split('@')[0] });
      setIsLoading(false);

      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Account created! You can now switch to it.');
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1500);
      }
    } else {
      // Login mode - just save credentials
      const result = onAdd({ email, password, label: label || email.split('@')[0] });
      if (result?.error) {
        setError(result.error);
      } else {
        resetForm();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header with tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex items-center justify-between px-6 pt-4 pb-0">
            <h2 className="text-lg font-semibold text-neutral-900">Add Account</h2>
            <button
              onClick={onClose}
              className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex px-6 mt-4">
            <button
              onClick={() => handleModeChange('login')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Existing Account
            </button>
            <button
              onClick={() => handleModeChange('register')}
              className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Full Name <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 border border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Display Name <span className="text-neutral-400 font-normal">(for switcher)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Test Client"
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-md text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {mode === 'register' ? 'Create & Save' : 'Save Account'}
            </button>
          </div>

          {mode === 'login' && (
            <p className="text-xs text-center text-neutral-500">
              Save existing account credentials for quick switching
            </p>
          )}

          {mode === 'register' && (
            <p className="text-xs text-center text-neutral-500">
              Creates a new account in Supabase and saves it for switching
            </p>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}

export function AccountSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');
  
  const dropdownRef = useRef(null);
  const { profile, user, signIn, signOut, signUp } = useAuth();

  // Load saved accounts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedAccounts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved accounts:', e);
    }
  }, []);

  // Sync current user's profile data into saved accounts cache
  useEffect(() => {
    if (!profile || !user?.email) return;
    setSavedAccounts(prev => {
      const idx = prev.findIndex(a => a.email === user.email);
      if (idx === -1) return prev;
      const updated = [...prev];
      const changed =
        updated[idx].cached_avatar_url !== (profile.avatar_url || null) ||
        updated[idx].cached_full_name !== (profile.full_name || null) ||
        updated[idx].cached_role !== (profile.role || null);
      if (!changed) return prev;
      updated[idx] = {
        ...updated[idx],
        cached_avatar_url: profile.avatar_url || null,
        cached_full_name: profile.full_name || null,
        cached_role: profile.role || null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [profile, user?.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSwitchError('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add existing account (just save credentials)
  const handleAddAccount = ({ email, password, label }) => {
    const exists = savedAccounts.some(a => a.email === email);
    if (exists) {
      return { error: 'Account already saved' };
    }

    const newAccount = { email, password, label };
    const updated = [...savedAccounts, newAccount];
    setSavedAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true };
  };

  // Register new account in Supabase and save it
  const handleRegisterAccount = async ({ email, password, fullName, label }) => {
    const exists = savedAccounts.some(a => a.email === email);
    if (exists) {
      return { error: 'Account already saved' };
    }

    try {
      // Create account in Supabase
      const { error } = await signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName || label,
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      // Save to local storage for quick switching
      const newAccount = { email, password, label };
      const updated = [...savedAccounts, newAccount];
      setSavedAccounts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  };

  // Remove account from list
  const handleRemoveAccount = (email, e) => {
    e.stopPropagation();
    const updated = savedAccounts.filter(a => a.email !== email);
    setSavedAccounts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Switch to account - direct login without signOut (Supabase handles session replacement)
  const handleSwitchAccount = async (account) => {
    if (account.email === user?.email) {
      setIsOpen(false);
      return;
    }

    setIsSwitching(true);
    setSwitchError('');

    try {
      // Direct sign in - Supabase replaces current session automatically
      const { error } = await signIn({
        email: account.email,
        password: account.password,
      });

      if (error) {
        setSwitchError('Login failed: ' + error.message);
        setIsSwitching(false);
        return;
      }

      setIsOpen(false);
      setIsSwitching(false);
      // Auth state change will trigger re-render with new user
    } catch (err) {
      setSwitchError('Switch failed: ' + err.message);
      setIsSwitching(false);
    }
  };

  const roleBadge = ROLE_BADGES[profile?.role] || ROLE_BADGES.client;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* User Profile Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSwitching}
          className={`flex items-center gap-3 p-1.5 pr-3 rounded-md hover:bg-neutral-100 transition-colors ${isOpen ? 'bg-neutral-100' : ''} ${isSwitching ? 'opacity-50' : ''}`}
        >
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full ${roleBadge.color} flex items-center justify-center ring-2 ${roleBadge.ring}`}>
            {isSwitching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">
                {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          {/* Name & Role (hidden on mobile) */}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-neutral-900 leading-tight">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-neutral-500">{roleBadge.label}</p>
          </div>

          {/* Chevron */}
          <svg 
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded shadow-xl border border-neutral-200 overflow-hidden z-50">
            {/* Current account header */}
            <div className="p-4 bg-gradient-to-br from-neutral-50 to-neutral-100/50">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${roleBadge.color} flex items-center justify-center ring-2 ${roleBadge.ring} overflow-hidden`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold">
                      {profile?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{profile?.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>

            {/* Error message */}
            {switchError && (
              <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-700 text-sm">
                {switchError}
              </div>
            )}

            {/* Saved accounts */}
            {savedAccounts.length > 0 && (
              <div className="py-2 border-b border-neutral-100">
                <p className="px-4 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Switch Account
                </p>
                {savedAccounts.map((account) => {
                  const isCurrent = account.email === user?.email;
                  const displayName = account.cached_full_name || account.label;
                  const avatarUrl = account.cached_avatar_url;
                  const accountRole = account.cached_role;
                  const accountBadge = accountRole ? ROLE_BADGES[accountRole] : null;
                  return (
                    <div
                      key={account.email}
                      role="button"
                      tabIndex={isSwitching ? -1 : 0}
                      onClick={() => handleSwitchAccount(account)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSwitchAccount(account); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors cursor-pointer ${
                        isCurrent ? 'bg-emerald-50/50' : ''
                      } ${isSwitching ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ${accountBadge ? accountBadge.color : 'bg-neutral-200'}`}>
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <span className={`text-sm font-medium ${accountBadge ? '' : 'text-neutral-600'}`}>
                            {displayName[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{account.email}</p>
                      </div>
                      {isCurrent ? (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <button
                          onClick={(e) => handleRemoveAccount(account.email, e)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Remove account"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => { setShowAddModal(true); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-neutral-100">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </span>
                Add Account
              </button>
              
              <button
                onClick={() => { signOut(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-red-50">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
        onRegister={handleRegisterAccount}
      />
    </>
  );
}

export default AccountSwitcher;
