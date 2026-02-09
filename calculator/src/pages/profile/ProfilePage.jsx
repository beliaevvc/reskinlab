import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../hooks/useLanguage';
import { Select } from '../../components/Select';
import UserAvatar from '../../components/UserAvatar';

export function ProfilePage() {
  const { t, i18n } = useTranslation('common');
  const { changeLanguage } = useLanguage();
  const {
    profile,
    client,
    updateProfile,
    updateClient,
    uploadAvatar,
    changePassword,
    deactivateAccount,
    isClient,
    isStaff,
  } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bio, setBio] = useState('');

  // Client form state
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('individual');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone state
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateText, setDeactivateText] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setTelegram(profile.telegram || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar_url || null);
    }
    if (client) {
      setCompanyName(client.company_name || '');
      setCompanyType(client.company_type || 'individual');
      setCountry(client.country || '');
      setAddress(client.address || '');
      setContactName(client.contact_name || '');
      setContactPhone(client.contact_phone || '');
    }
  }, [profile, client]);

  // Detect form changes
  useEffect(() => {
    if (!profile) return;
    const profileChanged =
      fullName !== (profile.full_name || '') ||
      phone !== (profile.phone || '') ||
      telegram !== (profile.telegram || '') ||
      bio !== (profile.bio || '') ||
      avatarFile !== null;

    let clientChanged = false;
    if (isClient && client) {
      clientChanged =
        companyName !== (client.company_name || '') ||
        companyType !== (client.company_type || 'individual') ||
        country !== (client.country || '') ||
        address !== (client.address || '') ||
        contactName !== (client.contact_name || '') ||
        contactPhone !== (client.contact_phone || '');
    }

    setHasChanges(profileChanged || clientChanged);
  }, [
    fullName, phone, telegram, bio, avatarFile,
    companyName, companyType, country, address, contactName, contactPhone,
    profile, client, isClient,
  ]);

  // Avatar handlers
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar file must be less than 5 MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Upload avatar if changed
      if (avatarFile) {
        setUploadingAvatar(true);
        const { error: avatarError } = await uploadAvatar(avatarFile);
        setUploadingAvatar(false);
        if (avatarError) throw avatarError;
        setAvatarFile(null);
      }

      // Update profile fields
      const profileUpdates = { full_name: fullName };
      if (isStaff) {
        profileUpdates.phone = phone || null;
        profileUpdates.telegram = telegram || null;
        profileUpdates.bio = bio || null;
      }

      // If avatar was removed (preview is null but profile had avatar)
      if (!avatarPreview && profile?.avatar_url && !avatarFile) {
        profileUpdates.avatar_url = null;
      }

      const { error: profileError } = await updateProfile(profileUpdates);
      if (profileError) throw profileError;

      // Update client record if client role
      if (isClient) {
        const { error: clientError } = await updateClient({
          company_name: companyName || null,
          company_type: companyType,
          country: country || null,
          address: address || null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          profile_completed: true,
        });
        if (clientError) throw clientError;
      }

      setSuccess(t('profile.profileUpdated'));
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || t('profile.failedUpdate'));
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError(t('profile.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await changePassword(newPassword);
      if (error) throw error;
      setPasswordSuccess(t('profile.passwordChanged'));
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Deactivate account
  const handleDeactivate = async () => {
    if (deactivateText !== 'DEACTIVATE') return;
    setDeactivating(true);
    try {
      const { error } = await deactivateAccount();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to deactivate account');
      setDeactivating(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const name = fullName || profile?.email || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    const role = profile?.role;
    if (role === 'admin') return { labelKey: 'profile.roles.admin', classes: 'bg-red-100 text-red-700' };
    if (role === 'am') return { labelKey: 'profile.roles.am', classes: 'bg-blue-100 text-blue-700' };
    return { labelKey: 'profile.roles.client', classes: 'bg-amber-100 text-amber-700' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Sticky Header with Save */}
      <div className="sticky top-0 z-10 bg-neutral-50/95 backdrop-blur-sm pb-4 pt-1 -mx-1 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{t('profile.title')}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {t('profile.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {uploadingAvatar ? t('profile.uploading') : t('profile.saving')}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t('profile.saveChanges')}
              </>
            )}
          </button>
        </div>

        {/* Status messages */}
        {success && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}
        {passwordSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm text-emerald-800">{passwordSuccess}</p>
          </div>
        )}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="space-y-6 mt-2">
        {/* ============================================ */}
        {/* Avatar & Basic Info Card */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0">
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-200 hover:border-emerald-400 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserAvatar
                      name={profile?.full_name}
                      email={profile?.email}
                      role={profile?.role}
                      size="2xl"
                      className="w-full h-full"
                    />
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {/* Remove avatar button */}
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove avatar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-2 text-center whitespace-pre-line">
                {t('profile.clickToUpload')}
              </p>
            </div>

            {/* Basic info */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.fullName')}
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                  placeholder={t('profile.fullNamePlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.emailAddress')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('profile.role')}
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadge.classes}`}
                >
                  {t(roleBadge.labelKey)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* Language Settings */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">{t('profile.language')}</h2>
          <p className="text-sm text-neutral-500 mb-4">{t('profile.languageSubtitle')}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => changeLanguage('en')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  i18n.language === 'en'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t('profile.languages.en')}
              </button>
              <button
                type="button"
                onClick={() => changeLanguage('ru')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  i18n.language === 'ru'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t('profile.languages.ru')}
              </button>
            </div>
            <p className="text-xs text-neutral-400">{t('profile.languageNote')}</p>
          </div>
        </div>

        {/* ============================================ */}
        {/* Staff Extra Fields (Admin / AM) */}
        {/* ============================================ */}
        {isStaff && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {t('profile.contactBio')}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t('profile.phone')}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="telegram"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t('profile.telegram')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">@</span>
                    <input
                      id="telegram"
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                      placeholder={t('profile.telegramPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.bio')}
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors resize-none"
                  placeholder={t('profile.bioPlaceholder')}
                />
                <p className="mt-1 text-xs text-neutral-400">
                  {t('profile.characters', { count: bio.length })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Client Information (only for clients) */}
        {/* ============================================ */}
        {isClient && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              {t('profile.companyInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('profile.companyType')}
                </label>
                <Select
                  value={companyType}
                  onChange={(val) => setCompanyType(val)}
                  options={[
                    { value: 'individual', label: t('profile.companyTypes.individual') },
                    { value: 'company', label: t('profile.companyTypes.company') },
                  ]}
                />
              </div>

              {companyType === 'company' && (
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t('profile.companyName')}
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                    placeholder={t('profile.companyNamePlaceholder')}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.country')}
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                  placeholder={t('profile.countryPlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.address')}
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors resize-none"
                  placeholder={t('profile.addressPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t('profile.contactName')}
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                    placeholder={t('profile.contactNamePlaceholder')}
                  />
                </div>
                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    {t('profile.contactPhone')}
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Change Password Section */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">{t('profile.password')}</h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {t('profile.passwordSubtitle')}
              </p>
            </div>
            {!showPasswordSection && (
              <button
                type="button"
                onClick={() => setShowPasswordSection(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                {t('profile.changePassword')}
              </button>
            )}
          </div>

          {showPasswordSection && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.newPassword')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                  placeholder={t('profile.newPasswordPlaceholder')}
                  minLength={6}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  {t('profile.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
                  placeholder={t('profile.confirmPasswordPlaceholder')}
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      {t('profile.updating')}
                    </>
                  ) : (
                    t('profile.updatePassword')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSection(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  {t('actions.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ============================================ */}
        {/* Danger Zone */}
        {/* ============================================ */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-1">{t('profile.dangerZone')}</h2>
          <p className="text-sm text-neutral-500 mb-4">
            {t('profile.dangerZoneSubtitle')}
          </p>

          {!showDeactivateConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeactivateConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
            >
              {t('profile.deactivateAccount')}
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <p className="text-sm text-red-800 font-medium">
                {t('profile.deactivateConfirm')}
              </p>
              <p className="text-sm text-red-700">
                {t('profile.deactivateWarning')}
              </p>
              <div>
                <label className="block text-sm text-red-700 mb-1.5">
                  Type <span className="font-mono font-bold">DEACTIVATE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deactivateText}
                  onChange={(e) => setDeactivateText(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-red-300 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors"
                  placeholder="DEACTIVATE"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={deactivateText !== 'DEACTIVATE' || deactivating}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {deactivating ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      {t('profile.deactivating')}
                    </>
                  ) : (
                    t('profile.deactivateAccount')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setDeactivateText('');
                  }}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
                >
                  {t('actions.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
