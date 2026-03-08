import { create } from 'zustand';
import { DaoSession, parseSqlLogs } from './parser';

interface SqlLogStore {
  rawContent: string;
  sessions: DaoSession[];
  activeSessionIndex: number | null;
  setRawContent: (content: string) => void;
  setActiveSession: (index: number | null) => void;
  processContent: (content: string) => void;
  clear: () => void;
}

export const useSqlLogStore = create<SqlLogStore>((set) => ({
  rawContent: '',
  sessions: [],
  activeSessionIndex: null,

  setRawContent: (content) => set({ rawContent: content }),
  
  setActiveSession: (index) => set({ activeSessionIndex: index }),

  processContent: (content) => {
    const sessions = parseSqlLogs(content);
    set({ rawContent: content, sessions, activeSessionIndex: sessions.length > 0 ? 0 : null });
  },

  clear: () => set({ rawContent: '', sessions: [], activeSessionIndex: null })
}));
