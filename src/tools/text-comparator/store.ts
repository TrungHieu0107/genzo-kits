import { create } from 'zustand';

interface TextCompareState {
  leftText: string;
  rightText: string;
  leftPath: string | null;
  rightPath: string | null;
  leftEncoding: string;
  rightEncoding: string;
  
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  setLeftPath: (path: string | null) => void;
  setRightPath: (path: string | null) => void;
  setLeftEncoding: (encoding: string) => void;
  setRightEncoding: (encoding: string) => void;
  clearAll: () => void;
}

export const useTextCompareStore = create<TextCompareState>((set) => ({
  leftText: "",
  rightText: "",
  leftPath: null,
  rightPath: null,
  leftEncoding: "UTF-8",
  rightEncoding: "UTF-8",
  
  setLeftText: (text) => set({ leftText: text }),
  setRightText: (text) => set({ rightText: text }),
  setLeftPath: (path) => set({ leftPath: path }),
  setRightPath: (path) => set({ rightPath: path }),
  setLeftEncoding: (encoding) => set({ leftEncoding: encoding }),
  setRightEncoding: (encoding) => set({ rightEncoding: encoding }),
  clearAll: () => set({ 
    leftText: "", 
    rightText: "",
    leftPath: null,
    rightPath: null,
    leftEncoding: "UTF-8",
    rightEncoding: "UTF-8"
  }),
}));
