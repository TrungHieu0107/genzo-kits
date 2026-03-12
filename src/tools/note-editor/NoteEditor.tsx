import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import Editor from "@monaco-editor/react";
import {
  FileCode, X, Plus, File,
  FileJson, FileType, ChevronLeft, ChevronRight, FolderOpen, Save,
  Terminal, Database, Globe, FileText, Pin, PinOff, Link as LinkIcon
} from "lucide-react";
import { useNoteEditorStore, EditorFile, getLanguageFromPath } from "./store";
import { useTextCompareStore } from "../text-comparator/store";
import { useSettingsStore } from "../settings/store";
import { useToastStore } from "../../components/toastStore";
import { StatusBar } from "../../components/StatusBar";
import { useEditorConfig } from "../../components/useEditorConfig";
import { useConfigStore } from "../../components/configStore";

// Helper for file icons based on language mode
const getFileIcon = (language: string) => {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'json':
      return <FileJson className="w-4 h-4 text-green-400" />;
    case 'html':
    case 'css':
    case 'scss':
      return <Globe className="w-4 h-4 text-orange-400" />;
    case 'markdown':
      return <FileType className="w-4 h-4 text-blue-400" />;
    case 'python':
    case 'java':
    case 'csharp':
    case 'cpp':
    case 'ruby':
    case 'php':
    case 'swift':
    case 'kotlin':
    case 'rust':
    case 'go':
      return <FileCode className="w-4 h-4 text-purple-400" />;
    case 'sql':
      return <Database className="w-4 h-4 text-pink-400" />;
    case 'shell':
    case 'dockerfile':
      return <Terminal className="w-4 h-4 text-gray-300" />;
    case 'plaintext':
      return <FileText className="w-4 h-4 text-gray-400" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
};

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
    togglePin, reorderFiles, hydrateSession
  } = useNoteEditorStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const pinnedFiles = files.filter(f => f.isPinned);
  const unpinnedFiles = files.filter(f => !f.isPinned);
  const displayFiles = [...pinnedFiles, ...unpinnedFiles];

  const { setLeftText, setRightText } = useTextCompareStore();
  const { tools: toolSettings } = useSettingsStore();
  const noteSettings = toolSettings['note-editor'];
  
  const { getCommonOptions, config } = useEditorConfig();

  const { showToast } = useToastStore();

  const activeFile = files.find(f => f.id === activeFileId);
  const activeFileRef = useRef(activeFile);
  useEffect(() => {
    activeFileRef.current = activeFile;
  }, [activeFile]);

  const [isRestoring, setIsRestoring] = useState(true);
  const isFirstMount = useRef(true);

  const { isHydrated } = useNoteEditorStore();

  // Restore session from Rust backend
  useEffect(() => {
    if (isHydrated) {
      setIsRestoring(false);
      return;
    }

    const loadSession = async () => {
      try {
        const sessionStr: string = await invoke('load_note_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          hydrateSession(session);
        }
      } catch (err) {
        console.log("No previous session found.");
      } finally {
        setIsRestoring(false);
      }
    };
    loadSession();
  }, [hydrateSession, isHydrated]);

  // Debounce save session to Rust backend
  useEffect(() => {
    if (isRestoring) return;
    if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
    }
    const timer = setTimeout(() => {
       const session = { files, activeFileId };
       invoke('save_note_session', { stateJson: JSON.stringify(session) }).catch(err => {
         console.error("Failed to save session:", err);
       });
    }, 1000);
    return () => clearTimeout(timer);
  }, [files, activeFileId, isRestoring]);

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
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

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); createFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') { e.preventDefault(); if (activeFileId) closeFile(activeFileId); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); handleOpenFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (activeFile) handleSaveFile(activeFile); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') { 
        e.preventDefault(); 
        if (activeFile && activeFile.path) {
          import('@tauri-apps/plugin-clipboard-manager').then(({ writeText }) => {
            writeText(activeFile.path as string).then(() => {
              showToast("Path copied to clipboard!", "success");
            }).catch(err => {
              console.error("Failed to copy path:", err);
              showToast("Failed to copy path", "error");
            });
          });
        } else if (activeFile) {
          showToast("File not saved yet.", "info");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, activeFile]);

  const handleOpenFile = async () => {
    try {
      const selected = await open({ multiple: false });
      if (typeof selected === 'string') {
        const defaultEnc = noteSettings.defaultEncoding;
        await openFileByPath(selected, defaultEnc);
      }
    } catch (err) { console.error("Failed to open file dialog:", err); }
  };

  const handleOpenPath = async () => {
    const path = window.prompt("Enter the full file path to open (e.g. C:\\temp\\file.txt):");
    if (!path || path.trim() === "") return;

    try {
      const defaultEnc = noteSettings.defaultEncoding;
      await openFileByPath(path, defaultEnc);
      showToast("File opened by path!", "success");
    } catch (err) {
      console.error("Failed to open path:", err);
      showToast(`Failed to open path: ${err}`, "error");
    }
  };

  const handleEncodingChange = async (file: EditorFile, newEncoding: string) => {
    if (!file.path) { updateEncoding(file.id, newEncoding); return; }
    try {
      const response: SafeFileResponse = await invoke('read_file_encoded', { path: file.path, encoding: newEncoding });
      if (response.error) return;
      if (!response.is_binary) {
        updateEncoding(file.id, newEncoding);
        updateContent(file.id, response.content || "");
        markClean(file.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveFile = async (file: EditorFile) => {
    if (!file.isDirty) return;
    try {
      if (file.path) {
        await invoke('save_file_encoded', { path: file.path, content: file.content, encoding: file.encoding });
        markClean(file.id);
      } else {
        const savePath = await save({ title: "Save File As", defaultPath: file.name });
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
  };

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editor.addAction({
      id: "save-action", label: "Save File",
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS],
      run: () => { if (activeFileRef.current) handleSaveFile(activeFileRef.current); }
    });
    editor.addAction({
      id: "close-action", label: "Close File",
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyW],
      run: () => { if (activeFileRef.current) closeFile(activeFileRef.current.id); }
    });
    editor.addAction({
      id: "set-compare-first", label: "Set as Left Comparison File",
      keybindings: [monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Digit1],
      run: () => {
        const text = editor.getValue();
        setLeftText(text || "");
        showToast("First text set.");
      }
    });
    editor.addAction({
      id: "set-compare-second", label: "Set as Right Comparison File",
      keybindings: [monacoInstance.KeyMod.Alt | monacoInstance.KeyCode.Digit2],
      run: () => {
        const text = editor.getValue();
        setRightText(text || "");
        showToast("Second text set.");
      }
    });

    // Toggle Whitespace via Context Menu
    editor.addAction({
      id: "toggle-whitespace",
      label: "Toggle Whitespace Visibility",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: () => {
        useConfigStore.getState().updateConfig({
           renderWhitespace: useConfigStore.getState().renderWhitespace === 'all' ? 'none' : 'all'
        });
      }
    });

    // Change Language via Context Menu
    editor.addAction({
      id: "change-language",
      label: "Change Language Mode",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: () => {
        if (!activeFileRef.current) return;
        const newLang = window.prompt("Enter new language (e.g. javascript, rust, json):", activeFileRef.current.language);
        if (newLang && newLang.trim() !== '') {
          updateLanguage(activeFileRef.current.id, newLang.trim().toLowerCase());
        }
      }
    });
    
    // Copy active file path to clipboard
    editor.addAction({
      id: "copy-path-action", label: "Copy File Path",
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyC],
      run: () => {
        if (activeFileRef.current && activeFileRef.current.path) {
          import('@tauri-apps/plugin-clipboard-manager').then(({ writeText }) => {
            writeText(activeFileRef.current!.path as string).then(() => {
              showToast("Path copied to clipboard!", "success");
            }).catch(err => {
              console.error("Failed to copy path:", err);
              showToast("Failed to copy path", "error");
            });
          });
        } else if (activeFileRef.current) {
          showToast("File not saved yet.", "info");
        }
      }
    });
  };

  const isBinaryTab = activeFile?.content === "Binary file or unsupported encoding.";

  if (isRestoring) return <div className="flex w-full h-full bg-[#1E1E1E] items-center justify-center text-gray-500">Restoring Session...</div>;

  return (
    <div className="flex w-full h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden">
      <div 
        className={`flex-shrink-0 bg-[#252526] flex flex-col relative border-r border-[#1E1E1E] transition-all duration-300 ${isSidebarCollapsed ? "w-[48px] items-center overflow-hidden" : ""}`}
        style={!isSidebarCollapsed ? { width: `${sidebarWidth}px` } : {}}
      >
        <div className={`h-[35px] flex items-center px-4 text-xs text-gray-400 uppercase tracking-widest ${isSidebarCollapsed ? "justify-center w-full px-0" : "justify-between"}`}>
          {!isSidebarCollapsed && <span>Explorer</span>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hover:bg-[#3C3C3D] p-1 rounded">
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto w-full hide-scrollbar">
          <div className="flex flex-col w-full">
            <div className={`flex items-center py-1 group/header cursor-pointer hover:bg-[#2A2D2E] ${isSidebarCollapsed ? "justify-center flex-col gap-1 mt-2" : "justify-between px-2"}`}>
              {!isSidebarCollapsed && <span className="text-[11px] font-bold text-gray-300 uppercase">Open Editors</span>}
              <div className={`flex items-center gap-1 transition-opacity ${isSidebarCollapsed ? "flex-col opacity-100 mb-2 border-b border-[#3C3C3D] pb-3 w-full" : "opacity-0 group-hover/header:opacity-100"}`}>
                <button onClick={() => createFile()} className="p-1 hover:bg-[#3C3C3D] rounded"><Plus className="w-4 h-4" /></button>
                <button onClick={() => handleOpenFile()} className="p-1 hover:bg-[#3C3C3D] rounded" title="Open File"><FolderOpen className="w-4 h-4" /></button>
                <button onClick={() => handleOpenPath()} className="p-1 hover:bg-[#3C3C3D] rounded" title="Open by Path"><LinkIcon className="w-4 h-4" /></button>
                {!isSidebarCollapsed && (
                  <button onClick={() => { if (activeFile) handleSaveFile(activeFile); }} disabled={!activeFile?.isDirty} className={`p-1 rounded ${activeFile?.isDirty ? "hover:bg-[#3C3C3D] text-gray-400" : "opacity-30"}`}>
                    <Save className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col pb-2 w-full gap-[2px]">
              {displayFiles.map((file, index) => (
                <div 
                  key={file.id} 
                  draggable={!isSidebarCollapsed}
                  onDragStart={(e) => {
                    if (isSidebarCollapsed) return;
                    setDraggedIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex === null || draggedIndex === index) return;
                    
                    // Find actual indices in the 'files' array
                    const sourceFile = displayFiles[draggedIndex];
                    const targetFile = displayFiles[index];
                    
                    const oldFilesIndex = files.findIndex(f => f.id === sourceFile.id);
                    const newFilesIndex = files.findIndex(f => f.id === targetFile.id);
                    
                    if (oldFilesIndex !== -1 && newFilesIndex !== -1) {
                      reorderFiles(oldFilesIndex, newFilesIndex);
                    }
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  onClick={() => setActiveFile(file.id)} 
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                  className={`group flex items-center cursor-pointer text-[13px] ${isSidebarCollapsed ? "justify-center py-2.5" : "px-4 py-1.5"} ${activeFileId === file.id ? "bg-[#37373D] text-white" : "text-gray-400 hover:bg-[#2A2D2E]"} ${draggedIndex === index ? "opacity-50" : ""}`}
                >
                  <div className={`flex-shrink-0 ${isSidebarCollapsed ? "relative" : "mr-2"}`}>
                    {getFileIcon(file.language)}
                    {isSidebarCollapsed && file.isDirty && <div className="absolute top-0 -right-2 w-1.5 h-1.5 rounded-full bg-white"></div>}
                    {isSidebarCollapsed && file.isPinned && <Pin className="absolute -top-1 -right-2 w-2.5 h-2.5 text-blue-400 rotate-45" />}
                  </div>
                  {!isSidebarCollapsed && (
                    <>
                      {file.isPinned && <Pin className="w-3 h-3 text-blue-400 rotate-45 mr-1" />}
                      <span className="truncate flex-1">{file.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); closeFile(file.id); }} className="opacity-0 group-hover:opacity-100 hover:bg-[#4C4C4C] rounded-sm p-0.5"><X className="w-3 h-3" /></button>
                      {file.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-white group-hover:hidden ml-1"></div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {!isSidebarCollapsed && <div className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50" onMouseDown={handleMouseDown}></div>}
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#1E1E1E]">
        <div className="flex-1 relative">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20"><Plus className="w-12 h-12 mb-4" /> No files open</div>
          ) : isBinaryTab ? (
            <div className="flex items-center justify-center h-full text-gray-500 uppercase tracking-widest text-xs">Binary file</div>
          ) : activeFile ? (
            <Editor
              height="100%"
              theme={config.theme}
              language={activeFile.language}
              value={activeFile.content}
              onChange={(v) => updateContent(activeFile.id, v || "")}
              onMount={handleEditorDidMount}
              options={getCommonOptions({
                readOnly: false
              })}
            />
          ) : null}
        </div>


        <StatusBar 
           activeFileName={activeFile?.name || "No File"}
           activeLanguage={activeFile?.language || "plaintext"}
           activeEncoding={activeFile?.encoding || "UTF-8"}
           isCompareMode={false}
           onLanguageChange={(lang) => { if(activeFile) updateLanguage(activeFile.id, lang); }}
           onEncodingChange={(enc) => { if(activeFile) handleEncodingChange(activeFile, enc); }}
        />
      </div>

      {contextMenu && (
        <div 
          className="fixed z-50 bg-[#252526] border border-[#3C3C3D] rounded-md shadow-lg py-1 min-w-[200px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button 
            onClick={() => {
              togglePin(contextMenu.id);
              setContextMenu(null);
            }} 
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
          >
            {files.find(f => f.id === contextMenu.id)?.isPinned ? (
              <><PinOff className="w-3.5 h-3.5 text-gray-400" /> Unpin Tab</>
            ) : (
              <><Pin className="w-3.5 h-3.5 text-blue-400 rotate-45" /> Pin Tab</>
            )}
          </button>
          
          <div className="h-[1px] bg-[#3C3C3D] my-1 mx-2"></div>
          
          <button 
            onClick={() => {
              closeOther(contextMenu.id);
              setContextMenu(null);
            }} 
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5 text-orange-400" /> Close Other Tabs
          </button>

          <button 
            onClick={() => {
              closeAll();
              setContextMenu(null);
            }} 
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5 text-red-400" /> Close All (Keep Pinned)
          </button>
        </div>
      )}
    </div>
  );
}
