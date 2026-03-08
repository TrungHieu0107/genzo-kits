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

export interface NoteEditorSession {
  files: EditorFile[];
  activeFileId: string | null;
}

interface NoteEditorState {
  files: EditorFile[];
  activeFileId: string | null;
  openFolder: string | null;
  
  setOpenFolder: (path: string | null) => void;
  openFile: (file: Omit<EditorFile, 'isDirty'>) => void;
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
  hydrateSession: (session: NoteEditorSession) => void;
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
      language: "plaintext",
      encoding: "UTF-8"
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

  // Đóng toàn bộ tab (nếu bị dirty có thể cần xử lý lưu sau, tạm thời ta filter clean hoặc close all)
  closeAll: () => set((state) => {
    // Chỉ giữ lại những files đã pin (tuỳ chọn) hoặc xoá sạch. Tạm thời xoá all = clear
    return {
      files: state.files.filter(f => f.isPinned), // Optionally keep pinned
      activeFileId: state.files.find(f => f.isPinned)?.id || null
    };
  }),

  // Đóng tất cả tab KHÁC tab hiện tại
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

  // Cập nhật ngôn ngữ syntax highlighting cho file
  // Update the syntax highlighting language for a file
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

  hydrateSession: (session) => set({
    files: session.files || [],
    activeFileId: session.activeFileId || null
  }),
}));
