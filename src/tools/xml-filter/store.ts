import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { XmlNode, FilterQuery, FilteredResult } from './types';

interface XmlFilterStore {
  filePath: string | null;
  rawNodes: XmlNode[];
  filteredResults: FilteredResult[];
  query: FilterQuery;
  viewMode: 'table' | 'tree';
  isLoading: boolean;
  error: string | null;

  // actions
  loadFile: (path: string) => Promise<void>;
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
  isLoading: false,
  error: null,

  loadFile: async (path: string) => {
    set({ isLoading: true, error: null, filePath: path });
    try {
      const nodes = await invoke<XmlNode[]>('parse_xml_file', { path });
      set({ rawNodes: nodes, isLoading: false });
      // Apply initial filter (which should be empty)
      await get().applyFilter();
    } catch (err) {
      set({ error: String(err), isLoading: false, rawNodes: [] });
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
