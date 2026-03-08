import { create } from 'zustand';
import { load } from '@tauri-apps/plugin-store';
import { invoke } from '@tauri-apps/api/core';
import { DaoSession, parseSqlLogs } from './parser';

export interface LogFile {
  path: string;
  name: string;
  alias?: string;
  sessions: DaoSession[];
  encoding: string;
  content: string;
}

export interface SqlFilter {
  id: string;
  type: 'query' | 'dao' | 'time';
  value: string;
}

interface SqlLogStore {
  files: LogFile[];
  activeFileIndex: number | null;
  activeSessionIndex: number | null;
  filters: SqlFilter[];
  
  addFile: (path: string, name: string, content: string, encoding: string) => void;
  removeFile: (index: number) => void;
  selectFile: (index: number | null) => void;
  selectSession: (index: number | null) => void;
  updateFileContent: (index: number, content: string, encoding: string) => void;
  setFileAlias: (index: number, alias: string | undefined) => void;
  loadFiles: () => Promise<void>;
  saveFiles: () => Promise<void>;
  clear: () => void;

  addFilter: (type: SqlFilter['type'], value: string) => void;
  removeFilter: (id: string) => void;
  clearFilters: () => void;
}

export const useSqlLogStore = create<SqlLogStore>((set, get) => ({
  files: [],
  activeFileIndex: null,
  activeSessionIndex: null,
  filters: [],

  addFile: (path, name, content, encoding) => {
    const sessions = parseSqlLogs(content);
    const newFile: LogFile = { path, name, content, sessions, encoding };
    set((state) => {
      const newFiles = [...state.files, newFile];
      return { 
        files: newFiles, 
        activeFileIndex: newFiles.length - 1, 
        activeSessionIndex: sessions.length > 0 ? 0 : null 
      };
    });
    // Sync to disk
    get().saveFiles();
  },

  removeFile: (index) => {
    set((state) => {
      const newFiles = state.files.filter((_, i) => i !== index);
      let newActiveFile = state.activeFileIndex;
      if (newActiveFile === index) {
        newActiveFile = newFiles.length > 0 ? 0 : null;
      } else if (newActiveFile !== null && newActiveFile > index) {
        newActiveFile--;
      }
      
      return {
        files: newFiles,
        activeFileIndex: newActiveFile,
        activeSessionIndex: (newActiveFile !== null && newFiles[newActiveFile].sessions.length > 0) ? 0 : null
      };
    });
    // Sync to disk
    get().saveFiles();
  },

  selectFile: (index) => set((state) => ({
    activeFileIndex: index,
    activeSessionIndex: (index !== null && state.files[index].sessions.length > 0) ? 0 : null
  })),

  selectSession: (index) => set({ activeSessionIndex: index }),

  updateFileContent: (index, content, encoding) => {
    const sessions = parseSqlLogs(content);
    set((state) => {
      const updatedFiles = state.files.map((f, i) => 
        i === index ? { ...f, content, encoding, sessions } : f
      );
      return {
        files: updatedFiles,
        activeSessionIndex: (state.activeFileIndex === index && sessions.length > 0) ? 0 : null
      };
    });
    // Sync to disk
  setFileAlias: (index, alias) => {
    set((state) => ({
      files: state.files.map((f, i) => i === index ? { ...f, alias } : f)
    }));
    get().saveFiles();
  },

  loadFiles: async () => {
    try {
      const store = await load('sql_log_files.json', { autoSave: false, defaults: { opened_files: [] } });
      const savedFilesMetadata = await store.get<{ path: string, name: string, alias?: string, encoding: string }[]>('opened_files') || [];
      
      const loadedFiles: LogFile[] = [];
      for (const meta of savedFilesMetadata) {
        try {
          const response: { content: string | null; error: string | null } = 
            await invoke('read_file_encoded', { path: meta.path, encoding: meta.encoding });
          
          if (response.content) {
            loadedFiles.push({
              path: meta.path,
              name: meta.name,
              alias: meta.alias,
              encoding: meta.encoding,
              content: response.content,
              sessions: parseSqlLogs(response.content)
            });
          }
        } catch (e) {
          console.error(`Failed to reload persistent file ${meta.path}:`, e);
        }
      }
      
      if (loadedFiles.length > 0) {
        set({ 
          files: loadedFiles, 
          activeFileIndex: 0, 
          activeSessionIndex: loadedFiles[0].sessions.length > 0 ? 0 : null 
        });
      }
    } catch (err) {
      console.error("Failed to load persistent log files:", err);
    }
  },

  saveFiles: async () => {
    try {
      const files = get().files;
      const metadata = files.map(f => ({ path: f.path, name: f.name, alias: f.alias, encoding: f.encoding }));
      const store = await load('sql_log_files.json', { autoSave: false, defaults: { opened_files: [] } });
      await store.set('opened_files', metadata);
      await store.save();
    } catch (err) {
      console.error("Failed to save log files metadata:", err);
    }
  },

  clear: () => {
    set({ files: [], activeFileIndex: null, activeSessionIndex: null });
    // Clear persistent store
    load('sql_log_files.json', { autoSave: false, defaults: { opened_files: [] } }).then(async store => {
        await store.set('opened_files', []);
        await store.save();
    }).catch(err => console.error("Failed to clear store:", err));
  },

  addFilter: (type, value) => set((state) => ({
    filters: [...state.filters, { id: crypto.randomUUID(), type, value }]
  })),

  removeFilter: (id) => set((state) => ({
    filters: state.filters.filter(f => f.id !== id)
  })),

  clearFilters: () => set({ filters: [] })
}));
