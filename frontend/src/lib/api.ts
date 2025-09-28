// API Client for Next.js Frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token management
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Base API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log('Making API request to:', url);
    console.log('Request config:', {
      method: config.method,
      headers: config.headers,
      body: config.body,
      hasToken: !!getToken()
    });
    
    const response = await fetch(url, config);
    
    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const textData = await response.text();
        console.error('Non-JSON response:', textData);
        data = { message: textData || 'Invalid response format' };
      }
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      data = { message: 'Failed to parse server response' };
    }
    
    console.log('API Response:', { 
      status: response.status, 
      statusText: response.statusText, 
      data 
    });
    
    if (!response.ok) {
      console.error('API Response not OK:', response.status, response.statusText);
      console.error('Error details:', data);
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('API Request failed:', {
      url,
      error: error instanceof Error ? error.message : String(error),
      endpoint
    });
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to server. Please check if the backend is running on http://localhost:5000');
    }
    
    throw error;
  }
};

// Health check function for debugging
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('Health check response:', data);
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  register: async (userData: { name: string; email: string; password: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  verifyToken: async () => {
    return apiRequest('/auth/verify-token', {
      method: 'POST',
    });
  },

  logout: () => {
    removeToken();
    return Promise.resolve();
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiRequest('/user/profile');
  },

  updateProfile: async (profileData: { name?: string; email?: string }) => {
    return apiRequest('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  getConnectedAccounts: async () => {
    return apiRequest('/user/connected-accounts');
  },

  connectAccount: async (accountData: { platform: string; username: string }) => {
    return apiRequest('/user/connect-account', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  disconnectAccount: async (accountData: { platform: string }) => {
    return apiRequest('/user/disconnect-account', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  },

  changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    return apiRequest('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};

// Posts API
export const postsAPI = {
  getPosts: async (params?: { status?: string; platform?: string; limit?: number; offset?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/posts${queryString}`);
  },

  createPost: async (postData: {
    content: string;
    platform: string;
    scheduledDate?: string;
    scheduledTime?: string;
    publishNow?: boolean;
  }) => {
    return apiRequest('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  getPost: async (id: number) => {
    return apiRequest(`/posts/${id}`);
  },

  updatePost: async (id: number, postData: {
    content?: string;
    platform?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => {
    return apiRequest(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  deletePost: async (id: number) => {
    return apiRequest(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  publishPost: async (id: number) => {
    return apiRequest(`/posts/${id}/publish`, {
      method: 'POST',
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getOverview: async (timeRange?: string) => {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    return apiRequest(`/analytics/overview${queryString}`);
  },

  getPlatformComparison: async (timeRange?: string) => {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    return apiRequest(`/analytics/platform-comparison${queryString}`);
  },

  getTopPosts: async (params?: { limit?: number; platform?: string; timeRange?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/analytics/top-posts${queryString}`);
  },
};

// Schedule API
export const scheduleAPI = {
  getPosts: async (params?: {
    status?: string;
    platform?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/schedule/posts${queryString}`);
  },

  createScheduledPost: async (postData: {
    content: string;
    platform: string;
    scheduledDate: string;
    scheduledTime: string;
    mediaUrls?: string[];
    tags?: string[];
  }) => {
    return apiRequest('/schedule/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  getUpcoming: async () => {
    return apiRequest('/schedule/upcoming');
  },

  getCalendar: async (params?: { month?: number; year?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/schedule/calendar${queryString}`);
  },
};

// Social API
export const socialAPI = {
  getContentSuggestions: async (params?: { topic?: string; platform?: string; tone?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest(`/social/content/suggestions${queryString}`);
  },

  getPlatformStatus: async () => {
    return apiRequest('/social/platforms/status');
  },

  connectPlatform: async (platform: string, accessToken: string, refreshToken?: string) => {
    return apiRequest('/social/platforms/connect', {
      method: 'POST',
      body: JSON.stringify({ platform, accessToken, refreshToken }),
    });
  },

  disconnectPlatform: async (platform: string) => {
    return apiRequest('/social/platforms/disconnect', {
      method: 'POST',
      body: JSON.stringify({ platform }),
    });
  },
};

// AI API
export const aiAPI = {
  generateContent: async (prompt: string, platform?: string, contentType?: string) => {
    return apiRequest('/ai/generate-content', {
      method: 'POST',
      body: JSON.stringify({ prompt, platform, contentType }),
    });
  },

  improveContent: async (content: string, improvements: string) => {
    return apiRequest('/ai/improve-content', {
      method: 'POST',
      body: JSON.stringify({ content, improvements }),
    });
  },

  getSuggestions: async (platform?: string) => {
    const queryString = platform ? `?platform=${platform}` : '';
    return apiRequest(`/ai/suggestions${queryString}`);
  },
};

// Token utilities
export const tokenUtils = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};

export default apiRequest;