import { 
  FileText, X, Trash2, PanelLeftClose, PanelLeftOpen, FolderOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogSidebarProps {
  files: any[];
  activeFileIndex: number | null;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  sidebarWidth: number;
  selectFile: (index: number) => void;
  removeFile: (index: number) => void;
  clear: () => void;
  setContextMenu: (menu: any) => void;
  setAliasModalProps: (props: any) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export function LogSidebar({
  files,
  activeFileIndex,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  sidebarWidth,
  selectFile,
  removeFile,
  clear,
  setContextMenu,
  isDragging,
  setIsDragging
}: LogSidebarProps) {
  return (
    <div 
      className="flex-shrink-0 bg-[#252526]/80 backdrop-blur-xl flex flex-col transition-all duration-200 border-r border-[#1E1E1E] relative"
      style={{ width: isSidebarCollapsed ? '40px' : `${sidebarWidth}px` }}
    >
      {isSidebarCollapsed ? (
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="p-1.5 hover:bg-[#3c3c3c] rounded-md transition-colors text-gray-400 hover:text-white"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180">
              Library
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="h-[40px] flex items-center px-4 font-bold text-xs uppercase text-gray-400 tracking-wider border-b border-[#3C3C3D]/50 justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">Log</span>
              <span>Library</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clear} title="Clear List" className="p-1 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                title="Collapse Sidebar" 
                className="p-1 hover:text-white transition-colors text-gray-500"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <AnimatePresence initial={false}>
              {files.map((file, fIdx) => (
                <motion.div 
                  key={file.path} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="mb-1 relative"
                >
                  <div 
                    onClick={() => selectFile(fIdx)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.clientX, y: e.clientY, fileIndex: fIdx });
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-all ${
                      activeFileIndex === fIdx 
                        ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-lg' 
                        : 'text-gray-400 hover:bg-[#2A2D2E]'
                    }`}
                  >
                    <FileText className={`w-4 h-4 flex-shrink-0 ${activeFileIndex === fIdx ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-[13px] font-medium truncate ${activeFileIndex === fIdx ? 'text-white' : 'text-gray-300'}`}>
                        {file.alias || file.name}
                      </span>
                      {(file.alias || activeFileIndex === fIdx) && (
                        <span className={`text-[10px] truncate mt-0.5 opacity-60 font-mono`} title={file.name}>
                          {file.name}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(fIdx); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {files.length === 0 && (
              <div className="p-8 flex flex-col items-center justify-center text-center opacity-30 h-full">
                <FolderOpen className="w-12 h-12 mb-4 text-gray-500" />
                <p className="text-sm font-medium">No Logs Loaded</p>
                <p className="text-[11px] mt-2 italic px-4 leading-relaxed">
                  Open a .log file to analyze database sessions.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Resizer */}
      {!isSidebarCollapsed && (
        <div 
          className={`absolute right-0 top-0 w-[4px] h-full cursor-col-resize z-50 transition-colors ${isDragging ? 'bg-blue-500' : 'hover:bg-blue-500/30'}`}
          onMouseDown={() => setIsDragging(true)}
        />
      )}
    </div>
  );
}
