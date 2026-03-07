import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import Editor, { useMonaco } from "@monaco-editor/react";
import { FolderOpen, FileText, FileCode, Save, File } from "lucide-react";

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
}

export function NoteEditor() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFile, setActiveFile] = useState<FileEntry | null>(null);
  const [content, setContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const monaco = useMonaco();

  const loadFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === 'string') {
        setFolderPath(selected);
        refreshDir(selected);
      }
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  const refreshDir = async (path: string) => {
    try {
      const entries = await readDir(path);
      const filtered = entries
        .filter(e => !e.isDirectory && (e.name?.endsWith(".md") || e.name?.endsWith(".txt")))
        .map(e => ({
          name: e.name || "Unknown",
          path: `${path}\\${e.name}`, // simplistic join for windows, assuming windows due to env
          isDir: e.isDirectory
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setFiles(filtered);
    } catch (err) {
      console.error("Failed to read directory:", err);
    }
  };

  const openFile = async (file: FileEntry) => {
    try {
      const text = await readTextFile(file.path);
      setContent(text);
      setActiveFile(file);
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    try {
      await writeTextFile(activeFile.path, content);
      setIsDirty(false);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  };

  // Register Ctrl+S when Monaco loads
  useEffect(() => {
    if (monaco) {
      monaco.editor.addKeybindingRules([
        {
          keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
          command: "saveFile",
        }
      ]);
    }
  }, [monaco]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editor.addAction({
      id: "saveFile",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        saveFile();
      }
    });
  };

  const onChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setIsDirty(true);
    }
  };

  return (
    <div className="flex w-full h-full bg-[#1e1e1e] text-gray-300 font-sans">
      {/* Internal Explorer Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-[#2d2d2d] bg-[#181818] flex flex-col h-full">
        <div className="p-3 border-b border-[#2d2d2d] flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-500">
          <span>Explorer</span>
          <button onClick={loadFolder} className="hover:text-white transition group" title="Open Folder">
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {!folderPath ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-3 text-gray-500">
              <FolderOpen className="w-12 h-12 opacity-20" />
              <p className="text-sm">No folder opened</p>
              <button 
                onClick={loadFolder}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition"
              >
                Open Folder
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div className="text-xs px-2 py-1 text-gray-400 font-bold truncate mb-1">
                {folderPath.split('\\').pop() || folderPath}
              </div>
              {files.length === 0 ? (
                <div className="px-2 py-1 text-xs text-gray-600 italic">No .md or .txt files found.</div>
              ) : (
                files.map(f => (
                  <button
                    key={f.path}
                    onClick={() => openFile(f)}
                    className={`flex items-center gap-2 px-2 py-1 w-full text-left text-sm rounded transition-colors truncate ${
                      activeFile?.path === f.path 
                        ? "bg-[#37373d] text-white" 
                        : "hover:bg-[#2a2d2e] text-gray-400"
                    }`}
                  >
                    {f.name.endsWith('.md') ? <FileText className="w-4 h-4 text-blue-400" /> : <File className="w-4 h-4 text-gray-400" />}
                    <span className="truncate">{f.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#1e1e1e]">
        <div className="h-10 border-b border-[#2d2d2d] flex items-center px-4 justify-between select-none">
          <div className="flex items-center gap-2">
            {activeFile ? (
              <>
                <FileCode className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-200 font-medium">
                  {activeFile.name} {isDirty && <span className="text-white">*</span>}
                </span>
                <span className="text-xs text-gray-500 truncate ml-2 max-w-[300px]" title={activeFile.path}>
                  {activeFile.path}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-500 italic">No file opened</span>
            )}
          </div>
          {activeFile && (
            <button 
              onClick={saveFile}
              disabled={!isDirty}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                isDirty 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-transparent text-gray-500 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" /> Save
            </button>
          )}
        </div>

        <div className="flex-1">
          {activeFile ? (
            <Editor
              height="100%"
              theme="vs-dark"
              language={activeFile.name.endsWith('.md') ? "markdown" : "plaintext"}
              value={content}
              onChange={onChange}
              onMount={handleEditorDidMount}
              options={{
                wordWrap: 'on',
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "monospace",
                lineHeight: 22,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                formatOnPaste: true,
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <FileCode className="w-20 h-20 opacity-10 mx-auto mb-4" />
                <p className="text-xl font-light">Genzo Note Editor</p>
                <p className="text-sm mt-2 opacity-50">Select a file from the explorer to begin editing.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
