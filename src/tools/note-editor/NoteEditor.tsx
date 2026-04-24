import { useEffect, useState, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  X, Pin, PinOff, Search, Terminal 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Store & Hooks
import { useNoteEditorStore, EditorFile } from "./store";
import { useTextCompareStore } from "../text-comparator/store";
import { useSettingsStore } from "../settings/store";
import { useToastStore } from "../../components/toastStore";
import { useEditorConfig } from "../../components/useEditorConfig";
import { useFileSystem } from "../../hooks/useFileSystem";
import { useNoteEditorSession } from "./hooks/useNoteEditorSession";
import { useNoteEditorCommands } from "./hooks/useNoteEditorCommands";

// Components
import { Sidebar } from "./components/Sidebar";
import { EditorView } from "./components/EditorView";
import { StatusBar } from "../../components/StatusBar";
import { getLanguageFromPath } from "./utils";

interface SafeFileResponse {
  content: string | null;
  is_binary: boolean;
  error: string | null;
}

export function NoteEditor() {
  const { 
    files, activeFileId, 
    openFile, openFileByPath, createFile, closeFile, closeAll, closeOther,
    updateContent, updateEncoding, updateLanguage, setActiveFile, markClean,
    togglePin, reorderFiles
  } = useNoteEditorStore();

  const { selectFiles, saveFile } = useFileSystem();
  const { showToast } = useToastStore();
  const { setLeftText, setRightText } = useTextCompareStore();
  const { tools: toolSettings } = useSettingsStore();
  const { getCommonOptions, config } = useEditorConfig();

  // State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [promptData, setPromptData] = useState<{ type: 'path' | 'language', value: string } | null>(null);

  const activeFile = files.find(f => f.id === activeFileId);
  const activeFileRef = useRef(activeFile);
  const noteSettings = toolSettings['note-editor'];

  // Hooks
  const { isRestoring } = useNoteEditorSession();
  
  const handleOpenFile = useCallback(async () => {
    try {
      const selected = await selectFiles({ multiple: false });
      if (typeof selected === 'string') {
        await openFileByPath(selected, noteSettings.defaultEncoding);
      }
    } catch (err) { console.error("Failed to open file dialog:", err); }
  }, [selectFiles, openFileByPath, noteSettings.defaultEncoding]);

  const handleSaveFile = useCallback(async (file: EditorFile) => {
    if (!file.isDirty) return;
    try {
      if (file.path) {
        await invoke('save_file_encoded', { path: file.path, content: file.content, encoding: file.encoding });
        markClean(file.id);
      } else {
        const savePath = await saveFile({ title: "Save File As", defaultPath: file.name });
        if (typeof savePath === 'string') {
          await invoke('save_file_encoded', { path: savePath, content: file.content, encoding: file.encoding });
          markClean(file.id);
          closeFile(file.id);
          const name = savePath.split(/[/\\]/).pop() || savePath;
          openFile({
            id: savePath, path: savePath, name, content: file.content, 
            language: getLanguageFromPath(name), encoding: file.encoding
          });
        }
      }
    } catch (err) { console.error(err); }
  }, [markClean, saveFile, closeFile, openFile]);

  useNoteEditorCommands({ handleOpenFile, handleSaveFile });

  // Effects
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  useEffect(() => {
    // Logic for tracking closed files removed if unused
  }, [files]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Handlers
  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(600, startWidth + (mouseMoveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleEncodingChange = async (file: EditorFile, newEncoding: string) => {
    if (!file.path) { updateEncoding(file.id, newEncoding); return; }
    try {
      const response: SafeFileResponse = await invoke('read_file_encoded', { path: file.path, encoding: newEncoding });
      if (response.error || response.is_binary) return;
      updateEncoding(file.id, newEncoding);
      updateContent(file.id, response.content || "");
      markClean(file.id);
    } catch (err) { console.error(err); }
  };

  const handlePromptSubmit = async () => {
    if (!promptData || !promptData.value.trim()) { setPromptData(null); return; }
    
    if (promptData.type === 'path') {
      try {
        await openFileByPath(promptData.value, noteSettings.defaultEncoding);
        showToast("File opened by path!", "success");
      } catch (err) {
        showToast(`Failed: ${err}`, "error");
      }
    } else if (promptData.type === 'language' && activeFile) {
      updateLanguage(activeFile.id, promptData.value.trim().toLowerCase());
    }
    setPromptData(null);
  };

  const handleEditorDidMount = (editor: any) => {
    editor.addAction({
      id: "set-compare-left", label: "Set as Left Comparison",
      run: () => { setLeftText(editor.getValue()); showToast("Left comparison source set."); }
    });
    editor.addAction({
      id: "set-compare-right", label: "Set as Right Comparison",
      run: () => { setRightText(editor.getValue()); showToast("Right comparison source set."); }
    });
    editor.addAction({
      id: "change-language", label: "Change Language Mode",
      run: () => setPromptData({ type: 'language', value: activeFileRef.current?.language || "" })
    });
  };

  if (isRestoring) {
    return (
      <div className="flex w-full h-full bg-[#0F0F10] items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">Restoring Session</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full bg-[#0F0F10] text-[#E1E1E1] font-sans overflow-hidden">
      <Sidebar 
        files={files}
        activeFileId={activeFileId}
        isSidebarCollapsed={isSidebarCollapsed}
        sidebarWidth={sidebarWidth}
        draggedIndex={draggedIndex}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onResize={handleResize}
        onCreateFile={createFile}
        onOpenFile={handleOpenFile}
        onOpenPath={() => setPromptData({ type: 'path', value: '' })}
        onSaveActive={() => activeFile && handleSaveFile(activeFile)}
        onSelect={setActiveFile}
        onClose={closeFile}
        onContextMenu={(e, id) => { e.preventDefault(); setContextMenu({ id, x: e.clientX, y: e.clientY }); }}
        onDragStart={setDraggedIndex}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(idx) => {
          if (draggedIndex !== null && draggedIndex !== idx) reorderFiles(draggedIndex, idx);
          setDraggedIndex(null);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <EditorView 
          activeFile={activeFile}
          theme={config.theme}
          options={getCommonOptions({ readOnly: false })}
          onContentChange={updateContent}
          onMount={handleEditorDidMount}
        />

        <StatusBar 
           activeFileName={activeFile?.name || "No File"}
           activeLanguage={activeFile?.language || "plaintext"}
           activeEncoding={activeFile?.encoding || "UTF-8"}
           isCompareMode={false}
           onLanguageChange={(lang) => activeFile && updateLanguage(activeFile.id, lang)}
           onEncodingChange={(enc) => activeFile && handleEncodingChange(activeFile, enc)}
        />
      </div>

      {/* Inline Prompt (Replacing window.prompt) */}
      <AnimatePresence>
        {promptData && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[60] w-[400px] bg-[#1E1E20]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-3">
              {promptData.type === 'path' ? <Search className="w-4 h-4 text-blue-400" /> : <Terminal className="w-4 h-4 text-purple-400" />}
              <span className="text-[0.85rem] font-bold uppercase tracking-wider text-gray-400">
                {promptData.type === 'path' ? "Open File by Path" : "Set Language Mode"}
              </span>
            </div>
            <div className="flex gap-2">
              <input 
                autoFocus
                className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition-colors"
                placeholder={promptData.type === 'path' ? "C:\\path\\to\\file.txt" : "javascript"}
                value={promptData.value}
                onChange={e => setPromptData({ ...promptData, value: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handlePromptSubmit()}
              />
              <button 
                onClick={handlePromptSubmit}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Go
              </button>
              <button 
                onClick={() => setPromptData(null)}
                className="bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg text-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-[#1E1E20]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ContextMenuItem 
            icon={files.find(f => f.id === contextMenu.id)?.isPinned ? PinOff : Pin}
            label={files.find(f => f.id === contextMenu.id)?.isPinned ? "Unpin Tab" : "Pin Tab"}
            onClick={() => togglePin(contextMenu.id)}
            variant={files.find(f => f.id === contextMenu.id)?.isPinned ? "default" : "blue"}
          />
          <div className="h-[1px] bg-white/5 my-1.5 mx-2" />
          <ContextMenuItem icon={X} label="Close Other Tabs" onClick={() => closeOther(contextMenu.id)} />
          <ContextMenuItem icon={X} label="Close All" onClick={closeAll} variant="red" />
        </div>
      )}
    </div>
  );
}

const ContextMenuItem = ({ icon: Icon, label, onClick, variant = 'default' }: any) => {
  const colors = {
    default: "text-gray-300 hover:bg-white/5",
    blue: "text-blue-400 hover:bg-blue-500 hover:text-white",
    red: "text-red-400 hover:bg-red-500 hover:text-white"
  };
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-[0.85rem] font-medium transition-all ${colors[variant as keyof typeof colors]}`}
    >
      <Icon className={`w-3.5 h-3.5 ${variant === 'blue' && "rotate-45"}`} />
      {label}
    </button>
  );
};
