'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { userAPI, scheduleAPI, socialAPI } from '@/lib/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ConnectedAccount {
  platform: string;
  connected: boolean;
  icon: string;
  username: string | null;
}

interface UpcomingPost {
  id: number;
  platform: string;
  icon: string;
  scheduledDate: string;
  scheduledTime: string;
  content: string;
  status: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [upcomingPosts, setUpcomingPosts] = useState<UpcomingPost[]>([]);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const platform = urlParams.get('state'); // Platform will be passed as state parameter
      const error = urlParams.get('error');
      
      if (error) {
        toast.error(`OAuth error: ${error}`, { position: 'top-right' });
        // Clean up URL
        window.history.replaceState({}, document.title, '/dashboard');
        return;
      }
      
      if (code && platform) {
        try {
          toast.info(`Processing ${platform} connection...`, { position: 'top-right' });
          
          // Exchange code for access token and connect account
          const response = await socialAPI.connectPlatform(platform.toLowerCase(), code);
          
          if (response.success) {
            toast.success(`Successfully connected to ${platform}!`, { 
              position: 'top-right',
              autoClose: 3000 
            });
            
            // Refresh dashboard data
            fetchDashboardData();
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
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/dashboard');
      }
    };

    const fetchDashboardData = async () => {
      try {
        // Fetch connected accounts
        const accountsResponse = await userAPI.getConnectedAccounts();
        if (accountsResponse.success) {
          const accounts = [
            { platform: 'Twitter', connected: accountsResponse.connectedAccounts.twitter.connected, icon: '🐦', username: accountsResponse.connectedAccounts.twitter.username },
            { platform: 'LinkedIn', connected: accountsResponse.connectedAccounts.linkedin.connected, icon: '💼', username: accountsResponse.connectedAccounts.linkedin.username },
            { platform: 'Instagram', connected: accountsResponse.connectedAccounts.instagram.connected, icon: '📸', username: accountsResponse.connectedAccounts.instagram.username },
          ];
          setConnectedAccounts(accounts);
        }

        // Fetch upcoming posts
        const postsResponse = await scheduleAPI.getUpcoming();
        if (postsResponse.success) {
          setUpcomingPosts(postsResponse.upcomingPosts);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    handleOAuthCallback();
    fetchDashboardData();
  }, []);

  const handleConnectAccount = async (platform: string) => {
    if (connectingPlatform) return;
    
    setConnectingPlatform(platform);
    
    try {
      toast.info(`Redirecting to ${platform} OAuth...`, { position: 'top-right' });
      
      // Generate OAuth URL for real social media platforms
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const baseUrl = API_BASE_URL.replace('/api', '');
      const redirectUri = encodeURIComponent(`${window.location.origin}/dashboard`);
      
      let oauthUrl = '';
      
      switch (platform.toLowerCase()) {
        case 'twitter':
          // Real Twitter OAuth 2.0 URL
          oauthUrl = `${baseUrl}/api/auth/twitter?redirect_uri=${redirectUri}`;
          break;
          
        case 'linkedin':
          // Real LinkedIn OAuth 2.0 URL
          oauthUrl = `${baseUrl}/api/auth/linkedin?redirect_uri=${redirectUri}`;
          break;
          
        case 'instagram':
          // Real Instagram Basic Display API URL
          oauthUrl = `${baseUrl}/api/auth/instagram?redirect_uri=${redirectUri}`;
          break;
          
        case 'facebook':
          // Real Facebook Login API URL
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
      setConnectingPlatform(null);
    }
  };

  const handleDisconnectAccount = async (platform: string) => {
    if (connectingPlatform) return; // Prevent multiple simultaneous operations
    
    setConnectingPlatform(platform);
    try {
      toast.info(`Disconnecting from ${platform}...`, { position: 'top-right' });
      
      const response = await socialAPI.disconnectPlatform(platform.toLowerCase());

      if (response.success) {
        toast.success(`Successfully disconnected from ${platform}!`, { 
          position: 'top-right',
          autoClose: 3000 
        });
        
        // Update the connected accounts in state
        setConnectedAccounts(prev => 
          prev.map(account => 
            account.platform.toLowerCase() === platform.toLowerCase()
              ? { 
                  ...account, 
                  connected: false, 
                  username: null 
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
      setConnectingPlatform(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const connectedCount = connectedAccounts.filter(account => account.connected).length;
  const totalAccounts = connectedAccounts.length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome, {user?.name || 'User'}! 👋
              </h1>
              <p className="text-gray-300 mt-1">
                Here&apos;s your social media overview for today
              </p>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Content
              </Link>
              <Link
                href="/calendar"
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                View Calendar
              </Link>
              <Link
                href="/settings"
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={logout}
                className="text-gray-300 hover:text-white px-4 py-2 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Linked Accounts Widget */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
                <div className="text-sm text-gray-300">
                  {connectedCount} of {totalAccounts} connected
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(connectedCount / totalAccounts) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Account List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedAccounts.map((account) => (
                  <div 
                    key={account.platform}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{account.icon}</span>
                      <div>
                        <h3 className="font-medium text-white">{account.platform}</h3>
                        {account.connected ? (
                          <p className="text-sm text-green-400 flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                            Connected {account.username && `• ${account.username}`}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 flex items-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                            Not Connected
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {account.connected ? (
                      <button
                        onClick={() => handleDisconnectAccount(account.platform)}
                        disabled={connectingPlatform === account.platform}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {connectingPlatform === account.platform ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnectAccount(account.platform)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="space-y-4">
            <Link
              href="/create"
              className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Create Content</h3>
                  <p className="text-blue-100 text-sm">Use AI to generate posts</p>
                </div>
                <span className="text-3xl">🤖</span>
              </div>
            </Link>

            <Link
              href="/calendar"
              className="block w-full bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg shadow-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">View Calendar</h3>
                  <p className="text-green-100 text-sm">Manage your schedule</p>
                </div>
                <span className="text-3xl">📅</span>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="block w-full bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg shadow-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Analytics</h3>
                  <p className="text-orange-100 text-sm">Track performance</p>
                </div>
                <span className="text-3xl">📊</span>
              </div>
            </Link>

            <Link
              href="/settings"
              className="block w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 rounded-lg shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Settings</h3>
                  <p className="text-gray-100 text-sm">Manage your account</p>
                </div>
                <span className="text-3xl">⚙️</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Posts Widget */}
        <div className="mt-8">
          <div className="bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Upcoming Posts</h2>
              <Link
                href="/calendar"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                View All →
              </Link>
            </div>

            {upcomingPosts.length > 0 ? (
              <div className="space-y-4">
                {upcomingPosts.map((post) => (
                  <div 
                    key={post.id}
                    className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{post.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-white">{post.platform}</span>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          {post.status}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                        {post.content.length > 120 
                          ? `${post.content.substring(0, 120)}...` 
                          : post.content
                        }
                      </p>
                      <div className="flex items-center text-xs text-gray-400 space-x-4">
                        <span>📅 {formatDate(post.scheduledDate)}</span>
                        <span>🕐 {formatTime(post.scheduledTime)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-white mb-2">No upcoming posts</h3>
                <p className="text-gray-400 mb-4">Create your first scheduled post to get started!</p>
                <Link
                  href="/create"
                  className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Content
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
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