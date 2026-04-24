import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  wordWrap: 'on' | 'off';
  minimap: boolean;
}

export type ToastPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'top-center' | 'bottom-center';

export interface UISettings {
  fontSize: number;
}

export interface GeneralSettings {
  language: string;
  theme: 'vs-dark' | 'vs-light';
  toastPosition: ToastPosition;
  editor: EditorSettings;
  ui: UISettings;
}

export interface TextComparatorSettings {
  includeWhitespace: boolean;
  showRowHighlight: boolean;
  editor?: Partial<EditorSettings>;
}

export interface NoteEditorSettings {
  defaultEncoding: string;
  editor?: Partial<EditorSettings>;
}

interface SettingsState {
  general: GeneralSettings;
  tools: {
    'text-comparator': TextComparatorSettings;
    'note-editor': NoteEditorSettings;
  };

  updateGeneral: (settings: Partial<GeneralSettings>) => void;
  updateGeneralEditor: (settings: Partial<EditorSettings>) => void;
  updateGeneralUI: (settings: Partial<UISettings>) => void;
  updateToolSettings: (toolId: string, settings: any) => void;
  resetAll: () => void;
}

const DEFAULT_SETTINGS: Omit<SettingsState, 'updateGeneral' | 'updateGeneralEditor' | 'updateGeneralUI' | 'updateToolSettings' | 'resetAll'> = {
  general: {
    language: 'English',
    theme: 'vs-dark',
    toastPosition: 'bottom-right',
    editor: {
      fontSize: 14,
      fontFamily: 'monospace',
      wordWrap: 'off',
      minimap: true,
    },
    ui: {
      fontSize: 13,
    }
  },
  tools: {
    'text-comparator': {
      includeWhitespace: true,
      showRowHighlight: true,
    },
    'note-editor': {
      defaultEncoding: 'UTF-8',
    }
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateGeneral: (newSettings) => set((state) => ({
        general: { ...state.general, ...newSettings }
      })),

      updateGeneralEditor: (newEditor) => set((state) => ({
        general: {
          ...state.general,
          editor: { ...state.general.editor, ...newEditor }
        }
      })),

      updateGeneralUI: (newUI) => set((state) => ({
        general: {
          ...state.general,
          ui: { ...(state.general?.ui || DEFAULT_SETTINGS.general.ui), ...newUI }
        }
      })),

      updateToolSettings: (toolId, newSettings) => set((state) => ({
        tools: {
          ...state.tools,
          [toolId]: { ...state.tools[toolId as keyof typeof state.tools], ...newSettings }
        }
      })),

      resetAll: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'genzo-settings-storage',
      version: 2, // Bump version to handle new ui structure
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Add ui settings if missing
          return {
            ...persistedState,
            general: {
              ...persistedState.general,
              ui: persistedState.general?.ui || DEFAULT_SETTINGS.general.ui
            }
          };
        }
        return persistedState;
      }
    }
  )
);

// Helper to resolve effective editor settings
// Helper để lấy cấu hình editor hiệu dụng (Ưu tiên tool-specific)
export const getEffectiveEditorSettings = (state: SettingsState, toolId: keyof SettingsState['tools']): EditorSettings => {
  const general = state.general.editor;
  const toolSpecific = state.tools[toolId]?.editor || {};
  return { ...general, ...toolSpecific };
};
