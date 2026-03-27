import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

type BootstrapState =
  | "loading"
  | "unauthenticated"
  | "unverified"
  | "needs_onboarding"
  | "needs_diagnostic"
  | "diagnostic_processing"
  | "needs_plan"
  | "ready";

interface SessionState {
  session: Session | null;
  user: User | null;
  bootstrapState: BootstrapState;
  setSession: (session: Session | null) => void;
  setBootstrapState: (state: BootstrapState) => void;
  isEmailVerified: () => boolean;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  user: null,
  bootstrapState: "loading",
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setBootstrapState: (bootstrapState) => set({ bootstrapState }),
  isEmailVerified: () => {
    const user = get().user;
    return !!user?.email_confirmed_at;
  },
  clear: () =>
    set({
      session: null,
      user: null,
      bootstrapState: "unauthenticated",
    }),
}));
