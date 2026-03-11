import { create } from 'zustand';

export interface FileEntry {
  path: string;
  name: string;
  checked: boolean;
  encoding: string;
}

export interface ScanOccurrence {
  file_path: string;
  line_number: number;
  line_content: string;
  match_type: string;
}

export interface ScanResult {
  old_name: string;
  occurrences: ScanOccurrence[];
}

interface PropertyRenamerState {
  files: FileEntry[];
  scanResults: ScanResult[];
  mappings: Record<string, string>;
  selectedName: string | null;
  showPreview: boolean;
  isScanning: boolean;
  isReplacing: boolean;
  isUndoing: boolean;
  statusMessage: string | null;
  statusType: "success" | "error" | "info";
  filter: string;
  scanSourcePath: string | null;

  setFiles: (files: FileEntry[]) => void;
  addFiles: (paths: string[]) => void;
  removeFile: (path: string) => void;
  toggleFileCheck: (path: string) => void;
  updateFileEncoding: (path: string, encoding: string) => void;
  setScanResults: (results: ScanResult[]) => void;
  setMappings: (mappings: Record<string, string>) => void;
  updateMapping: (oldName: string, newName: string) => void;
  setSelectedName: (name: string | null) => void;
  setShowPreview: (show: boolean) => void;
  setIsScanning: (val: boolean) => void;
  setIsReplacing: (val: boolean) => void;
  setIsUndoing: (val: boolean) => void;
  setStatus: (msg: string | null, type: "success" | "error" | "info") => void;
  setFilter: (filter: string) => void;
  setScanSourcePath: (path: string | null) => void;
  clearResults: () => void;
}

export const usePropertyRenamerStore = create<PropertyRenamerState>((set) => ({
  files: [],
  scanResults: [],
  mappings: {},
  selectedName: null,
  showPreview: false,
  isScanning: false,
  isReplacing: false,
  isUndoing: false,
  statusMessage: null,
  statusType: "info",
  filter: "",
  scanSourcePath: null,

  setFiles: (files) => set({ files }),
  
  addFiles: (paths) => set((state) => {
    const existingPaths = new Set(state.files.map(f => f.path));
    const newFiles = paths
      .filter(p => !existingPaths.has(p))
      .map(p => ({
        path: p,
        name: p.split(/[\\/]/).pop() || p,
        checked: true,
        encoding: "UTF-8"
      }));
    return { files: [...state.files, ...newFiles] };
  }),

  removeFile: (path) => set((state) => ({
    files: state.files.filter(f => f.path !== path)
  })),

  toggleFileCheck: (path) => set((state) => ({
    files: state.files.map(f => f.path === path ? { ...f, checked: !f.checked } : f)
  })),

  updateFileEncoding: (path, encoding) => set((state) => ({
    files: state.files.map(f => f.path === path ? { ...f, encoding } : f)
  })),

  setScanResults: (scanResults) => set({ scanResults }),
  setMappings: (mappings) => set({ mappings }),
  
  updateMapping: (oldName, newName) => set((state) => ({
    mappings: { ...state.mappings, [oldName]: newName }
  })),

  setSelectedName: (selectedName) => set({ selectedName }),
  setShowPreview: (showPreview) => set({ showPreview }),
  setIsScanning: (isScanning) => set({ isScanning }),
  setIsReplacing: (isReplacing) => set({ isReplacing }),
  setIsUndoing: (isUndoing) => set({ isUndoing }),
  
  setStatus: (statusMessage, statusType) => set({ statusMessage, statusType }),
  setFilter: (filter) => set({ filter }),
  setScanSourcePath: (scanSourcePath) => set({ scanSourcePath }),

  clearResults: () => set({ scanResults: [], mappings: {}, selectedName: null, showPreview: false }),
}));
