import { create } from 'zustand';
import { tools } from '../tools/index';

interface AppState {
  activeToolId: string;
  isSidebarCollapsed: boolean;
  
  setActiveTool: (id: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeToolId: localStorage.getItem("genzoActiveTool") || tools[0].id,
  isSidebarCollapsed: localStorage.getItem("genzoSidebarCollapsed") === "true",

  setActiveTool: (id) => {
    localStorage.setItem("genzoActiveTool", id);
    set({ activeToolId: id });
  },

  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem("genzoSidebarCollapsed", collapsed.toString());
    set({ isSidebarCollapsed: collapsed });
  },

  toggleSidebar: () => set((state) => {
    const newVal = !state.isSidebarCollapsed;
    localStorage.setItem("genzoSidebarCollapsed", newVal.toString());
    return { isSidebarCollapsed: newVal };
  }),
}));
