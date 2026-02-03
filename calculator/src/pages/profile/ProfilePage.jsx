import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function ProfilePage() {
  const { profile, client, updateProfile, updateClient, isClient } = useAuth();

  // Profile form state
  const [fullName, setFullName] = useState('');

  // Client form state
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('individual');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form with existing data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Update profile
      const { error: profileError } = await updateProfile({
        full_name: fullName,
      });

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

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Profile Settings</h1>
        <p className="text-neutral-500 mt-1">
          Manage your account information
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded">
          <p className="text-sm text-emerald-800">{success}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Information */}
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Account Information
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded border border-neutral-200 bg-neutral-50 text-neutral-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Role
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : profile?.role === 'am'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {profile?.role === 'admin'
                  ? 'Administrator'
                  : profile?.role === 'am'
                  ? 'Account Manager'
                  : 'Client'}
              </span>
            </div>
          </div>
        </div>

        {/* Client Information (only for clients) */}
        {isClient && (
          <div className="bg-white rounded-md border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Company Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="companyType"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Type
                </label>
                <select
                  id="companyType"
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors bg-white"
                >
                  <option value="individual">Individual / Freelancer</option>
                  <option value="company">Company</option>
                </select>
              </div>

              {companyType === 'company' && (
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Company name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder="Your company name"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder="e.g., United States"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-neutral-700 mb-1.5"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors resize-none"
                  placeholder="Your business address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Contact name
                  </label>
                  <input
                    id="contactName"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder="Contact person"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-neutral-700 mb-1.5"
                  >
                    Contact phone
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded border border-neutral-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
