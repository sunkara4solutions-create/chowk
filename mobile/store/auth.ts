import { create } from 'zustand';
import { getToken, getRole, saveToken, saveRole, removeAll } from '../lib/storage';

interface AuthState {
  token: string | null;
  role: 'worker' | 'contractor' | 'new' | null;
  profile: any | null;
  isLoading: boolean;
  setAuth: (token: string, role: 'worker' | 'contractor' | 'new', profile: any | null) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  profile: null,
  isLoading: true,

  setAuth: async (token, role, profile) => {
    await saveToken(token);
    await saveRole(role);
    set({ token, role, profile });
  },

  clearAuth: async () => {
    await removeAll();
    set({ token: null, role: null, profile: null });
  },

  initialize: async () => {
    try {
      const [token, role] = await Promise.all([getToken(), getRole()]);
      if (token && role) {
        set({
          token,
          role: role as 'worker' | 'contractor' | 'new',
          profile: null,
          isLoading: false,
        });
      } else {
        set({ token: null, role: null, profile: null, isLoading: false });
      }
    } catch {
      set({ token: null, role: null, profile: null, isLoading: false });
    }
  },
}));
