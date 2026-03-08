import { create } from 'zustand';
import { load } from '@tauri-apps/plugin-store';

export interface GlobalConfig {
  theme: 'vs-dark' | 'light';
  renderWhitespace: 'all' | 'none';
  ignoreTrimWhitespace: boolean; // For Compare Tool
  tabSize: number;
  fontSize: number;
  encoding: string;
  wordWrap: 'on' | 'off';
}

interface ConfigState extends GlobalConfig {
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<GlobalConfig>) => Promise<void>;
}

const DEFAULT_CONFIG: GlobalConfig = {
  theme: 'vs-dark',
  renderWhitespace: 'none',
  ignoreTrimWhitespace: true,
  tabSize: 4,
  fontSize: 14,
  encoding: 'UTF-8',
  wordWrap: 'off',
};

// Khởi tạo Zustand store cho Global Configuration
export const useConfigStore = create<ConfigState>((set, get) => ({
  ...DEFAULT_CONFIG,

  loadConfig: async () => {
    try {
      const store = await load('editor_config.json', { autoSave: false, defaults: DEFAULT_CONFIG as unknown as Record<string, unknown> });
      const loadedTheme = await store.get<'vs-dark' | 'light'>('theme');
      const loadedRenderWhitespace = await store.get<'all' | 'none'>('renderWhitespace');
      const loadedIgnoreTrimWhitespace = await store.get<boolean>('ignoreTrimWhitespace');
      const loadedTabSize = await store.get<number>('tabSize');
      const loadedFontSize = await store.get<number>('fontSize');
      const loadedEncoding = await store.get<string>('encoding');
      const loadedWordWrap = await store.get<'on' | 'off'>('wordWrap');

      set({
        theme: loadedTheme ?? DEFAULT_CONFIG.theme,
        renderWhitespace: loadedRenderWhitespace ?? DEFAULT_CONFIG.renderWhitespace,
        ignoreTrimWhitespace: loadedIgnoreTrimWhitespace ?? DEFAULT_CONFIG.ignoreTrimWhitespace,
        tabSize: loadedTabSize ?? DEFAULT_CONFIG.tabSize,
        fontSize: loadedFontSize ?? DEFAULT_CONFIG.fontSize,
        encoding: loadedEncoding ?? DEFAULT_CONFIG.encoding,
        wordWrap: loadedWordWrap ?? DEFAULT_CONFIG.wordWrap,
      });
    } catch (err) {
      console.error("Failed to load config from tauri store:", err);
    }
  },

  updateConfig: async (updates) => {
    // Cập nhật state Zustand trước để UI phản hồi ngay lập tức
    // Update Zustand state first for immediate UI reactivity
    set((state) => ({ ...state, ...updates }));

    // Persist to disk using tauri-plugin-store
    try {
      const store = await load('editor_config.json', { autoSave: false, defaults: DEFAULT_CONFIG as unknown as Record<string, unknown> });
      const currentState = get();
      
      if (updates.theme !== undefined) await store.set('theme', currentState.theme);
      if (updates.renderWhitespace !== undefined) await store.set('renderWhitespace', currentState.renderWhitespace);
      if (updates.ignoreTrimWhitespace !== undefined) await store.set('ignoreTrimWhitespace', currentState.ignoreTrimWhitespace);
      if (updates.tabSize !== undefined) await store.set('tabSize', currentState.tabSize);
      if (updates.fontSize !== undefined) await store.set('fontSize', currentState.fontSize);
      if (updates.encoding !== undefined) await store.set('encoding', currentState.encoding);
      if (updates.wordWrap !== undefined) await store.set('wordWrap', currentState.wordWrap);

      await store.save();
    } catch (err) {
      console.error("Failed to save config to tauri store:", err);
    }
  }
}));
