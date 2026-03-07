import { create } from 'zustand';

export interface EditorFile {
  id: string;
  path: string | null;
  name: string;
  content: string;
  isDirty: boolean;
  language: string;
}

interface NoteEditorState {
  files: EditorFile[];
  activeFileId: string | null;
  openFolder: string | null;
  
  setOpenFolder: (path: string | null) => void;
  openFile: (file: Omit<EditorFile, 'isDirty'>) => void;
  createFile: () => void;
  closeFile: (id: string) => void;
  updateContent: (id: string, newContent: string) => void;
  setActiveFile: (id: string | null) => void;
  markClean: (id: string) => void;
}

export const useNoteEditorStore = create<NoteEditorState>((set) => ({
  files: [],
  activeFileId: null,
  openFolder: null,

  setOpenFolder: (path) => set({ openFolder: path }),

  openFile: (fileDef) => set((state) => {
    // Check if already open
    const existingIndex = state.files.findIndex(f => f.path === fileDef.path);
    if (existingIndex !== -1) {
      return { activeFileId: state.files[existingIndex].id };
    }
    
    // Add new
    const newFile: EditorFile = { ...fileDef, isDirty: false };
    return {
      files: [...state.files, newFile],
      activeFileId: newFile.id
    };
  }),

  createFile: () => set((state) => {
    const untitledCount = state.files.filter(f => f.name.startsWith("Untitled-")).length + 1;
    const newId = `untitled-${Date.now()}`;
    const newFile: EditorFile = {
      id: newId,
      path: null,
      name: `Untitled-${untitledCount}`,
      content: "",
      isDirty: false,
      language: "plaintext"
    };

    return {
      files: [...state.files, newFile],
      activeFileId: newId
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

  updateContent: (id, newContent) => set((state) => ({
    files: state.files.map(f => 
      f.id === id ? { ...f, content: newContent, isDirty: true } : f
    )
  })),

  setActiveFile: (id) => set({ activeFileId: id }),

  markClean: (id) => set((state) => ({
    files: state.files.map(f => 
      f.id === id ? { ...f, isDirty: false } : f
    )
  })),
}));
