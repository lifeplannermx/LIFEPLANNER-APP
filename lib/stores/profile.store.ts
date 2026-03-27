import { create } from "zustand";
import type { Profile } from "@/lib/schemas/profile.schemas";

interface ProfileState {
  profile: Profile | null;
  isLoaded: boolean;
  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  isOnboardingComplete: () => boolean;
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoaded: false,
  setProfile: (profile) => set({ profile, isLoaded: true }),
  updateProfile: (updates) => {
    const current = get().profile;
    if (current) {
      set({ profile: { ...current, ...updates } });
    }
  },
  isOnboardingComplete: () => {
    const profile = get().profile;
    return !!profile?.onboarding_completed_at;
  },
  clear: () => set({ profile: null, isLoaded: false }),
}));
