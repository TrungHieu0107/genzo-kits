import { create } from 'zustand';

export interface EditorFile {
  id: string;
  path: string | null;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
  encoding: string;
  isPinned?: boolean;
}

export interface EncodedFileResponse {
  content: string;
  is_binary: boolean;
  error?: string;
}

// Helper to determine Monaco language from filename
export const getLanguageFromPath = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'md': return 'markdown';
    case 'rs': return 'rust';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'cpp':
    case 'c':
    case 'h': return 'cpp';
    case 'xml': return 'xml';
    case 'sql': return 'sql';
    case 'sh':
    case 'bat': return 'shell';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'toml': return 'toml';
    case 'ini': return 'ini';
    case 'txt': return 'plaintext';
    default: return 'plaintext';
  }
};

export interface NoteEditorSession {
  files: EditorFile[];
  activeFileId: string | null;
}

interface NoteEditorState {
  files: EditorFile[];
  activeFileId: string | null;
  openFolder: string | null;
  isHydrated: boolean; 
  
  setOpenFolder: (path: string | null) => void;
  openFile: (file: Omit<EditorFile, 'isDirty'>) => void;
  openFileByPath: (path: string, encoding?: string) => Promise<void>;
  createFile: () => void;
  closeFile: (id: string) => void;
  closeAll: () => void;
  closeOther: (id: string) => void;
  updateContent: (id: string, newContent: string) => void;
  updateEncoding: (id: string, newEncoding: string) => void;
  updateLanguage: (id: string, newLanguage: string) => void;
  setActiveFile: (id: string | null) => void;
  markClean: (id: string) => void;
  togglePin: (id: string) => void;
  reorderFiles: (oldIndex: number, newIndex: number) => void;
  hydrateSession: (session: NoteEditorSession) => void;
}

export const useNoteEditorStore = create<NoteEditorState>((set) => ({
  files: [],
  activeFileId: null,
  openFolder: null,
  isHydrated: false,

  setOpenFolder: (path) => set({ openFolder: path }),

  openFile: (fileDef) => set((state) => {
    const existingIndex = state.files.findIndex(f => f.path === fileDef.path);
    if (existingIndex !== -1) {
      return { activeFileId: state.files[existingIndex].id, isHydrated: true };
    }
    
    const newFile: EditorFile = { ...fileDef, isDirty: false };
    return {
      files: [...state.files, newFile],
      activeFileId: newFile.id,
      isHydrated: true
    };
  }),

  openFileByPath: async (path, encoding) => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const name = path.split(/[/\\]/).pop() || path;
      const targetEnc = encoding || "UTF-8";
      
      const response = await invoke<EncodedFileResponse>('read_file_encoded', { 
        path, 
        encoding: targetEnc 
      });

      if (response.error) {
        console.error("Error reading file:", response.error);
        return;
      }

      useNoteEditorStore.getState().openFile({
        id: path,
        path: path,
        name: name,
        content: response.is_binary ? "Binary file or unsupported encoding." : (response.content || ""),
        language: getLanguageFromPath(name),
        encoding: targetEnc
      });
    } catch (err) {
      console.error("Failed to open file by path:", err);
    }
  },

  createFile: () => set((state) => {
    const untitledCount = state.files.filter(f => f.name.startsWith("Untitled-")).length + 1;
    const newId = `untitled-${Date.now()}`;
    const newFile: EditorFile = {
      id: newId,
      path: null,
      name: `Untitled-${untitledCount}`,
      content: "",
      isDirty: false,
      language: "plaintext",
      encoding: "UTF-8"
    };

    return {
      files: [...state.files, newFile],
      activeFileId: newId,
      isHydrated: true
    };
  }),

  closeFile: (id) => set((state) => {
    const newFiles = state.files.filter(f => f.id !== id);
    let newActiveId = state.activeFileId;
    
    if (state.activeFileId === id) {
      newActiveId = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null;
    }
    
    return {
      files: newFiles,
      activeFileId: newActiveId
    };
  }),

  closeAll: () => set((state) => {
    return {
      files: state.files.filter(f => f.isPinned),
      activeFileId: state.files.find(f => f.isPinned)?.id || null
    };
  }),

  closeOther: (id) => set((state) => {
    const targetFile = state.files.find(f => f.id === id);
    const pinnedFiles = state.files.filter(f => f.isPinned && f.id !== id);
    if (!targetFile) return state;

    const newFiles = targetFile.isPinned ? [targetFile, ...pinnedFiles] : [...pinnedFiles, targetFile];
    
    return {
      files: newFiles,
      activeFileId: id
    };
  }),

  updateContent: (id, newContent) => set((state) => ({
    files: state.files.map(f => 
      f.id === id ? { ...f, content: newContent, isDirty: true } : f
    )
  })),

  updateEncoding: (id, newEncoding) => set((state) => ({
    files: state.files.map(f =>
      f.id === id ? { ...f, encoding: newEncoding, isDirty: true } : f
    )
  })),

  updateLanguage: (id, newLanguage) => set((state) => ({
    files: state.files.map(f =>
      f.id === id ? { ...f, language: newLanguage } : f
    )
  })),

  setActiveFile: (id) => set({ activeFileId: id }),

  markClean: (id) => set((state) => ({
    files: state.files.map(f => 
      f.id === id ? { ...f, isDirty: false } : f
    )
  })),

  togglePin: (id) => set((state) => ({
    files: state.files.map(f =>
      f.id === id ? { ...f, isPinned: !f.isPinned } : f
    )
  })),

  reorderFiles: (oldIndex, newIndex) => set((state) => {
    const newFiles = [...state.files];
    const [movedFile] = newFiles.splice(oldIndex, 1);
    newFiles.splice(newIndex, 0, movedFile);
    return { files: newFiles };
  }),

  hydrateSession: (session) => set({
    files: session.files || [],
    activeFileId: session.activeFileId || null,
    isHydrated: true
  }),
}));
