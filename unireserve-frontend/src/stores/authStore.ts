import { create } from 'zustand';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setInitialized: (init: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setInitialized: (init) => set({ isInitialized: init }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
