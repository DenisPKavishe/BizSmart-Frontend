import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  email: string;
  username: string;
  phone: string;
  role: string;
  role_name: string;
  business: number;
  business_name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<boolean>;
  refreshTokenAction: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login/', { email, password });
          const { access, refresh, user } = response.data;
          
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, isAuthenticated: false });
          throw new Error(error.response?.data?.detail || 'Login failed');
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        
        // No token at all
        if (!token) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
        }
        
        try {
          // Decode token to check expiration
          const decoded: any = jwtDecode(token);
          const isExpired = decoded.exp * 1000 < Date.now();
          
          // Token is still valid
          if (!isExpired) {
            // If we have user data in store, just set authenticated
            const { user } = get();
            if (user) {
            set({ isAuthenticated: true, isLoading: false });
            return true;
          }
            
            // Try to fetch user profile if we don't have it
            try {
              const profileRes = await api.get('/auth/profile/');
              set({ 
                user: profileRes.data, 
                isAuthenticated: true, 
                isLoading: false 
              });
              return true;
            } catch (profileError) {
              set({ isLoading: false, isAuthenticated: false });
              return false;
            }
          }
          
          // Token expired, try to refresh
          if (refreshToken) {
            const refreshed = await get().refreshTokenAction();
            if (refreshed) {
              return true;
            }
          }
          
          // Refresh failed or no refresh token
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
          
        } catch (error) {
          console.error('Token validation error:', error);
          set({ isLoading: false, isAuthenticated: false, user: null });
          return false;
        }
      },

      refreshTokenAction: async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        
        try {
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          const { access } = response.data;
          
          localStorage.setItem('access_token', access);
          set({ accessToken: access, isAuthenticated: true });
          
          // Try to get user profile
          try {
            const profileRes = await api.get('/auth/profile/');
            set({ user: profileRes.data });
          } catch (profileError) {
            // User profile fetch failed, but token is refreshed
            console.warn('Could not fetch user profile after refresh');
          }
          
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);