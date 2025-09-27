// API Client utility for frontend
// Place this in your frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token management
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

// Base API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Authentication API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  
  verifyToken: () =>
    apiClient.post('/auth/verify-token'),
  
  logout: () => {
    removeToken();
    return Promise.resolve();
  },
};

// User API
export const userAPI = {
  getProfile: () =>
    apiClient.get('/user/profile'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    apiClient.put('/user/profile', data),
  
  getConnectedAccounts: () =>
    apiClient.get('/user/connected-accounts'),
  
  connectAccount: (data: { platform: string; username: string }) =>
    apiClient.post('/user/connect-account', data),
  
  disconnectAccount: (data: { platform: string }) =>
    apiClient.post('/user/disconnect-account', data),
};

// Posts API
export const postsAPI = {
  getPosts: (params?: { status?: string; platform?: string; limit?: number; offset?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/posts${queryString}`);
  },
  
  createPost: (data: {
    content: string;
    platform: string;
    scheduledDate?: string;
    scheduledTime?: string;
    publishNow?: boolean;
  }) =>
    apiClient.post('/posts', data),
  
  getPost: (id: number) =>
    apiClient.get(`/posts/${id}`),
  
  updatePost: (id: number, data: {
    content?: string;
    platform?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) =>
    apiClient.put(`/posts/${id}`, data),
  
  deletePost: (id: number) =>
    apiClient.delete(`/posts/${id}`),
  
  publishPost: (id: number) =>
    apiClient.post(`/posts/${id}/publish`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: (timeRange?: string) => {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/analytics/overview${queryString}`);
  },
  
  getPlatformComparison: (timeRange?: string) => {
    const queryString = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get(`/analytics/platform-comparison${queryString}`);
  },
  
  getTopPosts: (params?: { limit?: number; platform?: string; timeRange?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/analytics/top-posts${queryString}`);
  },
  
  getTimeSeries: (params?: { timeRange?: string; metric?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/analytics/time-series${queryString}`);
  },
  
  getGrowth: () =>
    apiClient.get('/analytics/growth'),
};

// Social Media API
export const socialAPI = {
  publish: (data: {
    content: string;
    platforms: string[];
    mediaUrls?: string[];
  }) =>
    apiClient.post('/social/publish', data),
  
  schedule: (data: {
    content: string;
    platforms: string[];
    scheduledDate: string;
    scheduledTime: string;
    mediaUrls?: string[];
  }) =>
    apiClient.post('/social/schedule', data),
  
  getPlatformStatus: () =>
    apiClient.get('/social/platforms/status'),
  
  connectPlatform: (data: { platform: string; accessToken: string; refreshToken?: string }) =>
    apiClient.post('/social/platforms/connect', data),
  
  disconnectPlatform: (data: { platform: string }) =>
    apiClient.post('/social/platforms/disconnect', data),
  
  getContentSuggestions: (params?: { topic?: string; platform?: string; tone?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/social/content/suggestions${queryString}`);
  },
};

// Schedule API
export const scheduleAPI = {
  getPosts: (params?: {
    status?: string;
    platform?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/schedule/posts${queryString}`);
  },
  
  createScheduledPost: (data: {
    content: string;
    platform: string;
    scheduledDate: string;
    scheduledTime: string;
    mediaUrls?: string[];
    tags?: string[];
  }) =>
    apiClient.post('/schedule/posts', data),
  
  updateScheduledPost: (id: number, data: {
    content?: string;
    platform?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    mediaUrls?: string[];
    tags?: string[];
  }) =>
    apiClient.put(`/schedule/posts/${id}`, data),
  
  deleteScheduledPost: (id: number) =>
    apiClient.delete(`/schedule/posts/${id}`),
  
  getCalendar: (params?: { month?: number; year?: number }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get(`/schedule/calendar${queryString}`);
  },
  
  getUpcoming: () =>
    apiClient.get('/schedule/upcoming'),
  
  publishNow: (id: number) =>
    apiClient.post(`/schedule/posts/${id}/publish-now`),
};

// Token management utilities
export const tokenUtils = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};

// Export default API client for custom requests
export default apiClient;