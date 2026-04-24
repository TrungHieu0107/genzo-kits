import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { XmlNode, FilterQuery, FilteredResult, XmlFile } from './types';

interface XmlFilterStore {
  files: XmlFile[];
  nodesMap: Record<string, XmlNode[]>; // path -> roots
  filteredResults: FilteredResult[];
  query: FilterQuery;
  viewMode: 'table' | 'tree';
  isLoading: boolean;
  error: string | null;

  // actions
  addFile: (path: string, encoding: 'UTF-8' | 'Shift_JIS') => Promise<void>;
  removeFile: (path: string) => void;
  updateFileEncoding: (path: string, encoding: 'UTF-8' | 'Shift_JIS') => Promise<void>;
  applyFilter: () => Promise<void>;
  setQuery: (q: Partial<FilterQuery>) => void;
  setViewMode: (mode: 'table' | 'tree') => void;
  resetFilter: () => void;
}

export const useXmlFilterStore = create<XmlFilterStore>((set, get) => ({
  files: [],
  nodesMap: {},
  filteredResults: [],
  query: {
    tag: '',
    attr_name: '',
    attr_value: '',
    text: '',
  },
  viewMode: 'table',
  isLoading: false,
  error: null,

  addFile: async (path: string, encoding: 'UTF-8' | 'Shift_JIS') => {
    const { files, nodesMap } = get();
    if (files.some(f => f.path === path)) return;

    set({ isLoading: true, error: null });
    try {
      const nodes = await invoke<XmlNode[]>('parse_xml_file', { path, encoding });
      const fileName = path.split(/[\\/]/).pop() || path;
      
      const newFile: XmlFile = { path, name: fileName, encoding };
      
      set({ 
        files: [...files, newFile],
        nodesMap: { ...nodesMap, [path]: nodes },
        isLoading: false 
      });
      
      await get().applyFilter();
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  removeFile: (path: string) => {
    const { files, nodesMap } = get();
    const newFiles = files.filter(f => f.path !== path);
    const newNodesMap = { ...nodesMap };
    delete newNodesMap[path];

    set({ files: newFiles, nodesMap: newNodesMap });
    get().applyFilter();
  },

  updateFileEncoding: async (path: string, encoding: 'UTF-8' | 'Shift_JIS') => {
    const { files, nodesMap } = get();
    const fileIndex = files.findIndex(f => f.path === path);
    if (fileIndex === -1) return;

    set({ isLoading: true, error: null });
    try {
      const nodes = await invoke<XmlNode[]>('parse_xml_file', { path, encoding });
      
      const newFiles = [...files];
      newFiles[fileIndex] = { ...newFiles[fileIndex], encoding };
      
      set({ 
        files: newFiles,
        nodesMap: { ...nodesMap, [path]: nodes },
        isLoading: false 
      });
      
      await get().applyFilter();
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  applyFilter: async () => {
    const { nodesMap, query } = get();
    const allRoots = Object.values(nodesMap).flat();
    
    if (allRoots.length === 0) {
        set({ filteredResults: [] });
        return;
    }

    set({ isLoading: true });
    try {
      const results = await invoke<FilteredResult[]>('filter_xml_nodes', { 
        nodes: allRoots, 
        query: {
          tag: query.tag || null,
          attr_name: query.attr_name || null,
          attr_value: query.attr_value || null,
          text: query.text || null
        }
      });
      set({ filteredResults: results, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  setQuery: (q: Partial<FilterQuery>) => {
    set((state) => ({
      query: { ...state.query, ...q }
    }));
  },

  setViewMode: (mode: 'table' | 'tree') => set({ viewMode: mode }),

  resetFilter: () => {
    set({
      query: {
        tag: '',
        attr_name: '',
        attr_value: '',
        text: '',
      }
    });
    get().applyFilter();
  }
}));
