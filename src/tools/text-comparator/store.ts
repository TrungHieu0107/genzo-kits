import { create } from 'zustand';

interface TextCompareState {
  leftText: string;
  rightText: string;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  clearAll: () => void;
}

export const useTextCompareStore = create<TextCompareState>((set) => ({
  leftText: "",
  rightText: "",
  setLeftText: (text) => set({ leftText: text }),
  setRightText: (text) => set({ rightText: text }),
  clearAll: () => set({ leftText: "", rightText: "" }),
}));
