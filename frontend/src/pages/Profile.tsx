import React from 'react';
import { Shield, Mail } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';

interface UserProfile {
  id: number;
  email: string;
  full_name?: string | null;
  job_profile?: string | null;
  organization?: string | null;
  phone_number?: string | null;
  two_factor_enabled: boolean;
  last_password_change?: string | null;
}

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showPasswordForm, setShowPasswordForm] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [profileForm, setProfileForm] = React.useState({
    full_name: '',
    job_profile: '',
    organization: '',
    phone_number: '',
  });

  const [passwordForm, setPasswordForm] = React.useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const { data: currentUser, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await axios.get('/auth/me');
      return response.data;
    },
  });

  React.useEffect(() => {
    if (!currentUser) return;
    setProfileForm({
      full_name: currentUser.full_name ?? '',
      job_profile: currentUser.job_profile ?? 'Administrator',
      organization: currentUser.organization ?? 'Default Organization',
      phone_number: currentUser.phone_number ?? '',
    });
  }, [currentUser]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const response = await axios.put('/auth/me', profileForm);
      return response.data as UserProfile;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      setIsEditing(false);
      setErrorMessage(null);
      setStatusMessage('Profile updated successfully.');
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update profile.');
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        throw new Error('New password and confirm password do not match.');
      }
      const response = await axios.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
      setErrorMessage(null);
      setStatusMessage('Password changed successfully.');
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || err?.message || 'Failed to change password.');
    },
  });

  const setTwoFactor = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await axios.post('/auth/two-factor', { enabled });
      return response.data as UserProfile;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
      setErrorMessage(null);
      setStatusMessage(`Two-factor authentication ${user.two_factor_enabled ? 'enabled' : 'disabled'}.`);
    },
    onError: (err: any) => {
      setStatusMessage(null);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update 2FA setting.');
    },
  });

  const lastPasswordChangeText = React.useMemo(() => {
    if (!currentUser?.last_password_change) return 'Never';
    const date = new Date(currentUser.last_password_change);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const diffMs = Date.now() - date.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`;
  }, [currentUser?.last_password_change]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-10 w-48 bg-gray-800/50 rounded animate-pulse mb-8" />
        <div className="h-52 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-52 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
          <div className="h-52 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <p className="text-red-400">Failed to load profile data from backend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <PageHero
        id="profile"
        tone="indigo"
        eyebrow="Account identity and security"
        eyebrowIcon={<Shield className="h-3.5 w-3.5" />}
        title="My Profile"
        titleIcon={<Shield className="w-8 h-8 text-indigo-300" />}
        description="Manage your personal details, password, and multi-factor security settings."
        chips={[
          { label: currentUser.email, tone: 'indigo' },
          { label: currentUser.two_factor_enabled ? '2FA enabled' : '2FA disabled', tone: currentUser.two_factor_enabled ? 'emerald' : 'default' },
        ]}
      />

      <PageGuide
        title="About Profile"
        purpose="Profile allows you to manage personal account details and core security settings."
        actions={[
          'edit contact and organization information',
          'change your password securely',
          'enable or disable two-factor authentication',
        ]}
      />

      {statusMessage && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-300 text-sm">{statusMessage}</div>}
      {errorMessage && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-300 text-sm">{errorMessage}</div>}

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-8 flex items-start space-x-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
          {(currentUser.full_name || currentUser.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">{currentUser.full_name || 'Unnamed User'}</h2>
          <p className="text-gray-400 mb-4">
            {currentUser.job_profile || 'Administrator'} • {currentUser.organization || 'Default Organization'}
          </p>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setStatusMessage(null);
                setErrorMessage(null);
                setIsEditing((prev) => !prev);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button
              onClick={() => {
                setStatusMessage(null);
                setErrorMessage(null);
                setShowPasswordForm((prev) => !prev);
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium border border-gray-700"
            >
              {showPasswordForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Full Name"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="text"
              value={profileForm.job_profile}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, job_profile: e.target.value }))}
              placeholder="Job Profile"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="text"
              value={profileForm.organization}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="Organization"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="text"
              value={profileForm.phone_number}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              placeholder="Phone Number"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {showPasswordForm && (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, current_password: e.target.value }))}
              placeholder="Current Password"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))}
              placeholder="New Password"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
              placeholder="Confirm New Password"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            onClick={() => changePassword.mutate()}
            disabled={changePassword.isPending}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
          >
            {changePassword.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Mail className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Contact Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 uppercase">Email Address</label>
              <p className="text-gray-300">{currentUser.email}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase">Phone Number</label>
              <p className="text-gray-300">{currentUser.phone_number || 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Security</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500 uppercase">Two-Factor Authentication</label>
                <p className={`text-sm ${currentUser.two_factor_enabled ? 'text-green-400' : 'text-yellow-400'}`}>
                  {currentUser.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                onClick={() => setTwoFactor.mutate(!currentUser.two_factor_enabled)}
                disabled={setTwoFactor.isPending}
                className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-60"
              >
                {setTwoFactor.isPending ? 'Updating...' : 'Manage'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500 uppercase">Last Password Change</label>
                <p className="text-gray-300 text-sm">{lastPasswordChangeText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
