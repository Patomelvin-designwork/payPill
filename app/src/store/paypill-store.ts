import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface PaypillUser {
  id: string;
  name: string;
  email: string;
  ppllBalance: number;
}

interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

interface SignUpResult {
  requiresVerification: boolean;
}

interface PaypillState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: PaypillUser | null;
  onboardingComplete: boolean;
  initializeAuth: () => Promise<void>;
  signIn: (payload: AuthPayload) => Promise<void>;
  signUp: (payload: AuthPayload) => Promise<SignUpResult>;
  verifySignUpCode: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

async function loadProfile(userId: string, email: string, fallbackName = "New User") {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,ppll_balance,onboarding_complete")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    user: {
      id: userId,
      email,
      name: data?.full_name || fallbackName,
      ppllBalance: data?.ppll_balance ?? 0,
    },
    onboardingComplete: data?.onboarding_complete ?? false,
  };
}

export const usePaypillStore = create<PaypillState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  onboardingComplete: false,

  initializeAuth: async () => {
    set({ isLoading: true });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
      set({ isAuthenticated: false, user: null, onboardingComplete: false, isLoading: false });
      return;
    }

    try {
      const profile = await loadProfile(
        session.user.id,
        session.user.email || "",
        (session.user.user_metadata?.full_name as string | undefined) || "New User"
      );
      set({
        isAuthenticated: true,
        user: profile.user,
        onboardingComplete: profile.onboardingComplete,
        isLoading: false,
      });
    } catch {
      set({ isAuthenticated: false, user: null, onboardingComplete: false, isLoading: false });
    }
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw error || new Error("Unable to sign in.");
    }

    const profile = await loadProfile(
      data.user.id,
      data.user.email || email,
      (data.user.user_metadata?.full_name as string | undefined) || "New User"
    );

    set({ isAuthenticated: true, user: profile.user, onboardingComplete: profile.onboardingComplete });
  },

  signUp: async ({ email, password, name }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingResult, error: existingError } = await supabase.rpc(
      "user_exists_by_email",
      { email_input: normalizedEmail }
    );

    if (existingError) {
      throw existingError;
    }

    if (existingResult) {
      throw new Error("An account with this email already exists. Please sign in.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: name || "New User",
        },
      },
    });

    if (error || !data.user) {
      throw error || new Error("Unable to create account.");
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: normalizedEmail,
        full_name: name || "New User",
      },
      { onConflict: "id" }
    );

    if (profileError) {
      throw profileError;
    }

    if (data.session) {
      set({
        isAuthenticated: true,
        user: {
          id: data.user.id,
          email: normalizedEmail,
          name: name || "New User",
          ppllBalance: 0,
        },
        onboardingComplete: false,
      });
      return { requiresVerification: false };
    }

    return { requiresVerification: true };
  },

  verifySignUpCode: async (email, token) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      throw new Error("Verification code is required.");
    }

    const { error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: "signup",
    });

    if (error) {
      throw error;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw sessionError || new Error("Verification succeeded but no active session was found.");
    }

    const profile = await loadProfile(
      session.user.id,
      session.user.email || normalizedEmail,
      (session.user.user_metadata?.full_name as string | undefined) || "New User"
    );

    set({
      isAuthenticated: true,
      user: profile.user,
      onboardingComplete: profile.onboardingComplete,
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, onboardingComplete: false });
  },

  completeOnboarding: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    set({ onboardingComplete: true });
  },
}));

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
