'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { userAPI, socialAPI } from '@/lib/api';

interface ConnectedAccount {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook';
  connected: boolean;
  username?: string;
  displayName?: string;
  profileImage?: string;
  connectedAt?: Date;
  followerCount?: number;
}

interface UserProfile {
  name: string;
  email: string;
  profileImage?: string;
  createdAt: Date;
}

const platformConfig = {
  twitter: { 
    name: 'Twitter', 
    icon: '🐦', 
    color: 'bg-blue-500', 
    description: 'Share short updates and engage with your audience',
    website: 'twitter.com'
  },
  linkedin: { 
    name: 'LinkedIn', 
    icon: '💼', 
    color: 'bg-blue-700', 
    description: 'Build your professional network and share industry insights',
    website: 'linkedin.com'
  },
  instagram: { 
    name: 'Instagram', 
    icon: '📸', 
    color: 'bg-pink-500', 
    description: 'Share photos and stories with visual content',
    website: 'instagram.com'
  },
  facebook: { 
    name: 'Facebook', 
    icon: '📘', 
    color: 'bg-blue-600', 
    description: 'Connect with friends and share life updates',
    website: 'facebook.com'
  }
};

export default function SettingsPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data on component mount
  useEffect(() => {
    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const platform = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        toast.error(`OAuth error: ${error}`, { position: 'top-right' });
        window.history.replaceState({}, document.title, '/settings');
        return;
      }
      
      if (code && platform) {
        try {
          toast.info(`Processing ${platform} connection...`, { position: 'top-right' });
          
          const response = await socialAPI.connectPlatform(platform.toLowerCase(), code);
          
          if (response.success) {
            toast.success(`Successfully connected to ${platform}!`, { 
              position: 'top-right',
              autoClose: 3000 
            });
            
            // Refresh user data
            loadUserData();
          } else {
            throw new Error(response.message || 'Connection failed');
          }
        } catch (error) {
          console.error(`OAuth callback error:`, error);
          toast.error(`Failed to complete ${platform} connection`, { 
            position: 'top-right',
            autoClose: 5000 
          });
        }
        
        window.history.replaceState({}, document.title, '/settings');
      }
    };

    const loadUserData = async () => {
      try {
        setIsPageLoading(true);
        
        // Load user profile
        const profileResponse = await userAPI.getProfile();
        if (profileResponse.success) {
          const profile: UserProfile = {
            name: profileResponse.user.name,
            email: profileResponse.user.email,
            profileImage: profileResponse.user.profileImage,
            createdAt: new Date(profileResponse.user.createdAt || Date.now())
          };
          setUserProfile(profile);
          setProfileForm({
            name: profile.name,
            email: profile.email
          });
        }

        // Load connected accounts
        const accountsResponse = await userAPI.getConnectedAccounts();
        if (accountsResponse.success) {
          const accounts = Object.keys(platformConfig).map(platform => {
            const accountData = accountsResponse.connectedAccounts[platform];
            return {
              platform: platform as keyof typeof platformConfig,
              connected: accountData?.connected || false,
              username: accountData?.username || undefined,
              displayName: accountData?.displayName || undefined,
              profileImage: accountData?.profileImage || undefined,
              connectedAt: accountData?.connectedAt ? new Date(accountData.connectedAt) : undefined,
              followerCount: accountData?.followerCount || undefined
            };
          });
          setConnectedAccounts(accounts);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data. Please refresh the page.', {
          position: 'top-right',
          autoClose: 5000
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    handleOAuthCallback();
    loadUserData();
  }, []);

  const handleConnectAccount = async (platform: string) => {
    if (loading[platform]) return;
    
    setLoading({ ...loading, [platform]: true });
    
    try {
      toast.info(`Redirecting to ${platform} OAuth...`, { position: 'top-right' });
      
      // Generate OAuth URL for real social media platforms
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const baseUrl = API_BASE_URL.replace('/api', '');
      const redirectUri = encodeURIComponent(`${window.location.origin}/settings`);
      
      let oauthUrl = '';
      
      switch (platform.toLowerCase()) {
        case 'twitter':
          oauthUrl = `${baseUrl}/api/auth/twitter?redirect_uri=${redirectUri}`;
          break;
        case 'linkedin':
          oauthUrl = `${baseUrl}/api/auth/linkedin?redirect_uri=${redirectUri}`;
          break;
        case 'instagram':
          oauthUrl = `${baseUrl}/api/auth/instagram?redirect_uri=${redirectUri}`;
          break;
        case 'facebook':
          oauthUrl = `${baseUrl}/api/auth/facebook?redirect_uri=${redirectUri}`;
          break;
        default:
          throw new Error('Unsupported platform');
      }
      
      // Redirect to OAuth provider
      window.location.href = oauthUrl;
      
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : `Failed to connect to ${platform}. Please try again.`,
        { 
          position: 'top-right',
          autoClose: 5000 
        }
      );
      setLoading({ ...loading, [platform]: false });
    }
  };

  const handleDisconnectAccount = async (platform: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${platformConfig[platform as keyof typeof platformConfig].name} account?`)) {
      return;
    }

    if (loading[platform]) return;
    setLoading({ ...loading, [platform]: true });
    
    try {
      toast.info(`Disconnecting from ${platform}...`, { position: 'top-right' });
      
      const response = await socialAPI.disconnectPlatform(platform.toLowerCase());

      if (response.success) {
        toast.success(`Successfully disconnected from ${platformConfig[platform as keyof typeof platformConfig].name}!`, { 
          position: 'top-right',
          autoClose: 3000 
        });
        
        // Update the connected accounts in state
        setConnectedAccounts(prev => 
          prev.map(account => 
            account.platform === platform
              ? { 
                  ...account, 
                  connected: false, 
                  username: undefined,
                  displayName: undefined,
                  connectedAt: undefined,
                  followerCount: undefined
                }
              : account
          )
        );
        
      } else {
        throw new Error(response.message || 'Disconnection failed');
      }
      
    } catch (error) {
      console.error(`Error disconnecting from ${platform}:`, error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : `Failed to disconnect from ${platform}. Please try again.`,
        { 
          position: 'top-right',
          autoClose: 5000 
        }
      );
    } finally {
      setLoading({ ...loading, [platform]: false });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileForm.name.trim()) {
      toast.error('Name is required', { position: 'top-right' });
      return;
    }

    setLoading({ ...loading, profile: true });
    
    try {
      const response = await userAPI.updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      });

      if (response.success) {
        setUserProfile(prev => prev ? ({
          ...prev,
          name: profileForm.name,
          email: profileForm.email
        }) : null);
        
        setEditingProfile(false);
        toast.success('Profile updated successfully!', { 
          position: 'top-right',
          autoClose: 3000 
        });
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
      
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update profile. Please try again.',
        { 
          position: 'top-right',
          autoClose: 5000 
        }
      );
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('All password fields are required', { position: 'top-right' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match', { position: 'top-right' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long', { position: 'top-right' });
      return;
    }

    setLoading({ ...loading, password: true });
    
    try {
      const response = await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordModal(false);
        toast.success('Password changed successfully!', { 
          position: 'top-right',
          autoClose: 3000 
        });
      } else {
        throw new Error(response.message || 'Password change failed');
      }
      
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to change password. Please try again.',
        { 
          position: 'top-right',
          autoClose: 5000 
        }
      );
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const connectedCount = connectedAccounts.filter(account => account.connected).length;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load user profile. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <ToastContainer />
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link
              href="/Dashboard"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-400">Manage your account and connected platforms</p>
            </div>
          </div>
          <div className="text-2xl">⚙️</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* User Profile Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
            {!editingProfile && (
              <button
                onClick={() => setEditingProfile(true)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {editingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({ name: userProfile?.name || '', email: userProfile?.email || '' });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.profile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading.profile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl text-white font-bold">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{userProfile.name}</h3>
                  <p className="text-gray-400">{userProfile.email}</p>
                  <p className="text-sm text-gray-500">Member since {formatDate(userProfile.createdAt)}</p>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  🔒 Change Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Linking Section */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
              <span className="text-sm text-gray-400">{connectedCount} of {connectedAccounts.length} connected</span>
            </div>
            <p className="text-gray-400 text-sm">
              Connect your social media accounts to start scheduling and managing your posts
            </p>
          </div>

          <div className="space-y-4">
            {connectedAccounts.map((account) => {
              const config = platformConfig[account.platform];
              const isLoading = loading[account.platform];

              return (
                <div key={account.platform} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{config.name}</h3>
                        <p className="text-sm text-gray-400">{config.description}</p>
                        
                        {account.connected ? (
                          <div className="mt-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              <span className="text-sm text-green-400 font-medium">Connected</span>
                              {account.username && (
                                <span className="text-sm text-gray-400">as {account.username}</span>
                              )}
                            </div>
                            {account.followerCount && (
                              <p className="text-xs text-gray-500 mt-1">
                                {account.followerCount.toLocaleString()} followers • 
                                Connected on {account.connectedAt && formatDate(account.connectedAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span className="text-sm text-gray-400">Not connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {account.connected ? (
                        <button
                          onClick={() => handleDisconnectAccount(account.platform)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Disconnect'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectAccount(account.platform)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connection Benefits */}
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h3 className="text-sm font-medium text-blue-300 mb-2">✨ Benefits of connecting accounts:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Schedule posts across multiple platforms simultaneously</li>
              <li>• Get AI-powered content suggestions for each platform</li>
              <li>• Track engagement and analytics in one dashboard</li>
              <li>• Save time with automated cross-posting</li>
            </ul>
          </div>
        </div>

        {/* Account Statistics */}
        {connectedCount > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{connectedCount}</div>
                <div className="text-sm text-gray-400">Connected Accounts</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {connectedAccounts
                    .filter(acc => acc.connected && acc.followerCount)
                    .reduce((total, acc) => total + (acc.followerCount || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Reach</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">0</div>
                <div className="text-sm text-gray-400">Posts This Month</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading.password}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {loading.password ? 'Changing...' : 'Change Password'}
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}