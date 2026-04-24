import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { XmlNode, FilterQuery, FilteredResult } from './types';

interface XmlFilterStore {
  filePath: string | null;
  rawNodes: XmlNode[];
  filteredResults: FilteredResult[];
  query: FilterQuery;
  viewMode: 'table' | 'tree';
  encoding: 'UTF-8' | 'Shift_JIS';
  isLoading: boolean;
  error: string | null;

  // actions
  loadFile: (path: string) => Promise<void>;
  setEncoding: (encoding: 'UTF-8' | 'Shift_JIS') => void;
  applyFilter: () => Promise<void>;
  setQuery: (q: Partial<FilterQuery>) => void;
  setViewMode: (mode: 'table' | 'tree') => void;
  resetFilter: () => void;
}

export const useXmlFilterStore = create<XmlFilterStore>((set, get) => ({
  filePath: null,
  rawNodes: [],
  filteredResults: [],
  query: {
    tag: '',
    attr_name: '',
    attr_value: '',
    text: '',
  },
  viewMode: 'table',
  encoding: 'UTF-8',
  isLoading: false,
  error: null,

  loadFile: async (path: string) => {
    const { encoding } = get();
    set({ isLoading: true, error: null, filePath: path });
    try {
      const nodes = await invoke<XmlNode[]>('parse_xml_file', { path, encoding });
      set({ rawNodes: nodes, isLoading: false });
      // Apply initial filter (which should be empty)
      await get().applyFilter();
    } catch (err) {
      set({ error: String(err), isLoading: false, rawNodes: [] });
    }
  },

  setEncoding: (encoding) => {
    set({ encoding });
    // If we have a file, reload it with new encoding
    const { filePath } = get();
    if (filePath) {
      get().loadFile(filePath);
    }
  },

  applyFilter: async () => {
    const { rawNodes, query } = get();
    if (rawNodes.length === 0) {
        set({ filteredResults: [] });
        return;
    }

    set({ isLoading: true });
    try {
      // Check if query is empty
      const isEmpty = !query.tag && !query.attr_name && !query.attr_value && !query.text;
      
      if (isEmpty) {
          // If empty, we might want to show everything as "self"
          // Or the backend already handles empty query as "matches everything"
          const results = await invoke<FilteredResult[]>('filter_xml_nodes', { 
            nodes: rawNodes, 
            query: { tag: null, attr_name: null, attr_value: null, text: null }
          });
          set({ filteredResults: results, isLoading: false });
      } else {
          const results = await invoke<FilteredResult[]>('filter_xml_nodes', { 
            nodes: rawNodes, 
            query 
          });
          set({ filteredResults: results, isLoading: false });
      }
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
