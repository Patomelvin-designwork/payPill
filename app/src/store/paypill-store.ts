import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PaypillUser {
  name: string;
  email: string;
  ppllBalance: number;
}

interface PaypillState {
  isAuthenticated: boolean;
  user: PaypillUser | null;
  onboardingComplete: boolean;
  login: (email: string, name: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

export const usePaypillStore = create<PaypillState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      onboardingComplete: false,
      login: (email, name) =>
        set({
          isAuthenticated: true,
          user: { name, email, ppllBalance: 1250 },
          onboardingComplete: false,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          onboardingComplete: false,
        }),
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    {
      name: 'paypill-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
