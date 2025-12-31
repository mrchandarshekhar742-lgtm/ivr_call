import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, tokenManager } from '@/utils/api';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Store tokens
            tokenManager.setToken(tokens.accessToken);
            tokenManager.setRefreshToken(tokens.refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            toast.success('Login successful!');
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
          });
          
          // Clear any existing tokens on login failure
          tokenManager.clearTokens();
          
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
          
          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Store tokens immediately
            tokenManager.setToken(tokens.accessToken);
            tokenManager.setRefreshToken(tokens.refreshToken);
            
            // Update auth state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            // Force a small delay to ensure tokens are stored
            await new Promise(resolve => setTimeout(resolve, 100));
            
            toast.success('Registration successful! Welcome to IVR System!');
            
            // Return success to indicate registration completed
            return { success: true, user, tokens };
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Registration failed',
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const refreshToken = tokenManager.getRefreshToken();
          
          if (refreshToken) {
            await apiClient.post('/api/auth/logout', { refreshToken });
          }
        } catch (error) {
          // Ignore logout errors
          console.warn('Logout error:', error);
        } finally {
          // Clear tokens and state regardless of API call result
          tokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          
          toast.success('Logged out successfully');
        }
      },

      refreshAuth: async () => {
        try {
          const refreshToken = tokenManager.getRefreshToken();
          
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await apiClient.post<AuthResponse>('/api/auth/refresh', {
            refreshToken,
          });

          if (response.success && response.data) {
            const { user, tokens } = response.data;
            
            // Update tokens
            tokenManager.setToken(tokens.accessToken);
            tokenManager.setRefreshToken(tokens.refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              error: null,
            });
          }
        } catch (error: any) {
          // Refresh failed, clear everything
          tokenManager.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            error: error.message || 'Session expired',
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.put<{ user: User }>('/api/auth/profile', data);
          
          if (response.success && response.data) {
            set({
              user: response.data.user,
              isLoading: false,
              error: null,
            });
            
            toast.success('Profile updated successfully!');
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Profile update failed',
          });
          throw error;
        }
      },

      changePassword: async (currentPassword: string, newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await apiClient.put('/api/auth/change-password', {
            currentPassword,
            newPassword,
          });
          
          set({ isLoading: false, error: null });
          toast.success('Password changed successfully! Please log in again.');
          
          // Force logout after password change
          await get().logout();
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Password change failed',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook to get current user profile
export const useCurrentUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
};

// Hook to check permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };
  
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  };
  
  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    permissions: user?.permissions || [],
    role: user?.role,
  };
};

// Initialize auth state on app start
export const initializeAuth = async () => {
  const token = tokenManager.getToken();
  
  if (token) {
    try {
      const response = await apiClient.get<{ user: User; permissions: string[] }>('/api/auth/me');
      
      if (response.success && response.data) {
        useAuth.setState({
          user: response.data.user,
          isAuthenticated: true,
          error: null,
        });
        return true;
      }
    } catch (error: any) {
      // Token is invalid or expired, clear it silently
      tokenManager.clearTokens();
      useAuth.setState({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      return false;
    }
  } else {
    // No token found, set unauthenticated state
    useAuth.setState({
      user: null,
      isAuthenticated: false,
      error: null,
    });
    return false;
  }
};