import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors - but don't redirect on login page
    if (error.response?.status === 401) {
      // Don't redirect if we're already on login page or making login request
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isLoginRequest = originalRequest?.url?.includes('/auth/login');
        const isRegisterRequest = originalRequest?.url?.includes('/auth/register');
        
        // Only clear tokens and redirect if not on login page and not a login/register request
        if (currentPath !== '/login' && currentPath !== '/register' && !isLoginRequest && !isRegisterRequest) {
          tokenManager.clearTokens();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiClient = {
  // Generic methods
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<any> => {
    const response = await api.get(url, config);
    return response.data;
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> => {
    const response = await api.post(url, data, config);
    return response.data;
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<any> => {
    const response = await api.put(url, data, config);
    return response.data;
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<any> => {
    const response = await api.delete(url, config);
    return response.data;
  },

  // File upload
  upload: async <T = any>(url: string, formData: FormData): Promise<any> => {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Request/Response logging for development
if (process.env.NODE_ENV === 'development') {
  api.interceptors.request.use(
    (config) => {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params);
      return config;
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.log(`❌ ${error.response?.status} ${error.config?.url}`, error.response?.data);
      return Promise.reject(error);
    }
  );
}

export default api;