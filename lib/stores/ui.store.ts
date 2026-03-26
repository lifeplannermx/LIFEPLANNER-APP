import { create } from "zustand";

interface UiState {
  globalLoading: boolean;
  globalError: string | null;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
  clearError: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  globalLoading: false,
  globalError: null,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setGlobalError: (globalError) => set({ globalError }),
  clearError: () => set({ globalError: null }),
}));
