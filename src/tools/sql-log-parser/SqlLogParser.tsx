import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from 'react';
import { 
  Database, Trash2, FolderOpen, FileText, X, Clock, Copy, Check, RefreshCw, Filter, Search as SearchIcon, Edit3, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';
import { useSqlLogStore } from './store';
import { useConfigStore } from '../../components/configStore';
import { StatusBar } from '../../components/StatusBar';
import { SqlFormatterModal } from './SqlFormatterModal';
import { FilterModal } from './FilterModal';
import { AliasModal } from './AliasModal';

export default function SqlLogParser() {
   const { encoding, updateConfig } = useConfigStore();
   const [copiedId, setCopiedId] = useState<string | null>(null);
   const [selectedSql, setSelectedSql] = useState<string | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
   const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileIndex: number } | null>(null);
   const [aliasModalProps, setAliasModalProps] = useState({ isOpen: false, index: 0, initialValue: '' });

   const [sidebarWidth, setSidebarWidth] = useState(300);
   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
 
   const { 
     files, activeFileIndex,
     addFile, removeFile, selectFile, updateFileContent, loadFiles, clear,
     filters, removeFilter, clearFilters, setFileAlias
   } = useSqlLogStore();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isDragging]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  const sqlLogs = activeFile ? activeFile.sessions.flatMap(
    sess => sess.logs.filter(l => l.type === 'sql' && l.reconstructedSql).map(l => ({ ...l, daoName: sess.daoName }))
  ).sort((a, b) => sortOrder === 'asc' ? a.logIndex - b.logIndex : b.logIndex - a.logIndex)
   .filter(log => {
      if (filters.length === 0) return true;
      return filters.every(f => {
        let textValue = '';
        if (f.type === 'query') textValue = log.reconstructedSql || '';
        if (f.type === 'dao') textValue = log.daoName;
        if (f.type === 'time') textValue = log.timestamp || '';

        const target = textValue.toLowerCase();
        const search = f.value.toLowerCase();

        switch (f.operator) {
          case 'equals':
            return target === search;
          case 'greater_than':
            if (f.type === 'time') return target > search;
            return target.localeCompare(search) > 0;
          case 'less_than':
            if (f.type === 'time') return target < search;
            return target.localeCompare(search) < 0;
          case 'contains':
          default:
            return target.includes(search);
        }
      });
   })
   : [];

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSqlClick = (sql: string) => {
    setSelectedSql(sql);
    setIsModalOpen(true);
  };

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
      });
      if (typeof selected === 'string') {
        const response: { content: string | null; is_binary: boolean; error: string | null } = 
          await invoke('read_file_encoded', { path: selected, encoding: encoding });
        
        if (response.error) {
          console.error("Error reading log file:", response.error);
          return;
        }
        
        if (response.content) {
          const name = selected.split(/[/\\]/).pop() || selected;
          addFile(selected, name, response.content, encoding);
        }
      }
    } catch (err) {
      console.error("Failed to open log file:", err);
    }
  };

  const handleEncodingChange = async (newEncoding: string) => {
    updateConfig({ encoding: newEncoding });
    if (activeFile && activeFileIndex !== null) {
      try {
        const response: { content: string | null; is_binary: boolean; error: string | null } = 
          await invoke('read_file_encoded', { path: activeFile.path, encoding: newEncoding });
        
        if (response.error) {
          console.error("Error reloading log file:", response.error);
          return;
        }
        
        if (response.content) {
          updateFileContent(activeFileIndex, response.content, newEncoding);
        }
      } catch (err) {
        console.error("Failed to reload log file:", err);
      }
    }
  };

  const handleReload = async () => {
    if (!activeFile || activeFileIndex === null) return;
    
    try {
      const response: { content: string | null; is_binary: boolean; error: string | null } = 
        await invoke('read_file_encoded', { path: activeFile.path, encoding: activeFile.encoding });
      
      if (response.error) {
        console.error("Error reloading log file:", response.error);
        return;
      }
      
      if (response.content) {
        updateFileContent(activeFileIndex, response.content, activeFile.encoding);
      }
    } catch (err) {
      console.error("Failed to reload log file:", err);
    }
  };

  return (
    <div className="flex w-full h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Log Files & DAO Sessions */}
        <div 
          className="flex-shrink-0 bg-[#252526] flex flex-col transition-all duration-200 border-r border-[#1E1E1E]"
          style={{ width: isSidebarCollapsed ? '32px' : `${sidebarWidth}px`, borderRight: (isDragging || isSidebarCollapsed) ? 'none' : '1px solid #1E1E1E' }}
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
              <div className="h-[35px] flex items-center px-4 font-bold text-xs uppercase text-gray-400 tracking-wider border-b border-[#3C3C3D] justify-between">
                <div className="flex items-center gap-2">
                  <span>Library</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={clear} title="Clear Library" className="hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setIsSidebarCollapsed(true)} 
                    title="Collapse Sidebar" 
                    className="hover:text-white transition-colors text-gray-500"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar p-1">
                {files.map((file, fIdx) => (
                  <div key={fIdx} className="mb-1 relative">
                    <div 
                      onClick={() => selectFile(fIdx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, fileIndex: fIdx });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer group transition-colors ${activeFileIndex === fIdx ? 'bg-[#37373D] text-white shadow-sm' : 'text-gray-400 hover:bg-[#2A2D2E]'}`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${activeFileIndex === fIdx ? 'text-blue-400' : 'text-gray-500'}`} />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className={`text-[13px] font-medium truncate ${activeFileIndex === fIdx ? 'text-white' : 'text-gray-300'}`}>{file.alias || file.name}</span>
                        {file.alias && (
                          <span 
                            className={`text-[9.5px] truncate mt-0.5 leading-tight ${activeFileIndex === fIdx ? 'text-blue-200/70' : 'text-gray-500'}`} 
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(fIdx); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {contextMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
                    <div 
                      className="fixed z-50 bg-[#252526] border border-[#454545] rounded-md shadow-xl py-1 min-w-[150px] animate-in fade-in zoom-in-95 duration-100"
                      style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                      <button 
                        className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        onClick={() => {
                          const f = files[contextMenu.fileIndex];
                          setAliasModalProps({ isOpen: true, index: contextMenu.fileIndex, initialValue: f.alias || '' });
                          setContextMenu(null);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Set Alias Name
                      </button>
                    </div>
                  </>
                )}

                {files.length === 0 && (
                  <div className="p-8 flex flex-col items-center justify-center text-center opacity-30 h-full">
                    <FolderOpen className="w-12 h-12 mb-4" />
                    <p className="text-sm font-medium">Empty Library</p>
                    <p className="text-xs mt-2 italic px-4">Open a .log file using the toolbar to analyze its DAO sessions.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Draggable Divider */}
        {!isSidebarCollapsed && (
          <div 
            className={`w-[4px] cursor-col-resize z-10 transition-colors ${isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-[#3C3C3D]'}`}
            onMouseDown={() => setIsDragging(true)}
          />
        )}

        {/* Main Area: SQL View */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Toolbar */}
          <div className="h-[35px] bg-[#333333] flex items-center justify-between px-4 gap-2 border-b border-[#1E1E1E]">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleOpenFile}
                className="flex items-center gap-1.5 bg-[#444] hover:bg-[#555] text-gray-200 px-3 py-1 rounded text-xs transition-colors shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> Open Log File
              </button>

              <button 
                onClick={handleReload}
                disabled={!activeFile}
                title="Reload current log file from disk"
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors shadow-sm ${activeFile ? 'bg-[#444] hover:bg-[#555] text-gray-200' : 'bg-[#333] text-gray-600 cursor-not-allowed'}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${activeFile ? 'text-green-400' : 'text-gray-600'}`} /> Reload Results
              </button>

              <div className="flex items-center gap-2 border-l border-[#444] pl-3 ml-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tight">Encoding:</span>
                <select 
                  value={encoding}
                  onChange={(e) => handleEncodingChange(e.target.value)}
                  className="bg-[#252526] border border-[#3C3C3D] text-[11px] text-gray-300 px-2 py-0.5 rounded outline-none hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <option value="UTF-8">UTF-8</option>
                  <option value="Shift_JIS">Shift_JIS</option>
                  <option value="EUC-JP">EUC-JP</option>
                  <option value="UTF-16LE">UTF-16LE</option>
                  <option value="Windows-1252">Windows-1252</option>
                </select>
              </div>

              <button 
                onClick={() => setIsFilterModalOpen(true)}
                disabled={!activeFile}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors shadow-sm ml-2 ${activeFile ? 'bg-[#444] hover:bg-[#555] text-gray-200 border border-blue-500/30' : 'bg-[#333] text-gray-600 cursor-not-allowed'}`}
              >
                <Filter className={`w-3.5 h-3.5 ${activeFile ? 'text-blue-400' : 'text-gray-600'}`} /> Filter
              </button>

              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                disabled={!activeFile}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors shadow-sm ml-2 ${activeFile ? 'bg-[#444] hover:bg-[#555] text-gray-200' : 'bg-[#333] text-gray-600 cursor-not-allowed'}`}
                title="Toggle Time Sort Order"
              >
                <Clock className={`w-3.5 h-3.5 ${activeFile ? 'text-purple-400' : 'text-gray-600'}`} />
                {sortOrder === 'asc' ? 'Time: Asc' : 'Time: Desc'}
              </button>
            </div>
            
            {activeFile && (
              <div className="flex items-center gap-3">
                <div className="text-[11px] text-gray-400 bg-[#252526] px-2 py-1 rounded border border-[#3C3C3D] shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-gray-300 font-bold tracking-tight">{sqlLogs.length} SQL Queries</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter Tags Bar */}
          {filters.length > 0 && activeFile && (
            <div className="px-4 py-2 bg-[#1e1e1e] border-b border-[#333] flex flex-wrap gap-2 items-center min-h-[40px]">
              <span className="text-[10px] uppercase font-bold text-gray-500 mr-2 flex items-center gap-1">
                <SearchIcon className="w-3 h-3" /> Filters:
              </span>
              {filters.map((f) => (
                <div key={f.id} className="flex items-center gap-1.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full text-[11px] font-medium animate-in fade-in zoom-in-95 duration-200">
                  <span className="opacity-60 text-[9px] uppercase font-bold">{f.type} {f.operator === 'equals' ? '==' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : 'in'}:</span>
                  <span className="max-w-[150px] truncate">{f.value}</span>
                  <button 
                    onClick={() => removeFilter(f.id)}
                    className="ml-0.5 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={clearFilters}
                className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider ml-auto hover:underline"
              >
                Clear All
              </button>
            </div>
          )}

          <div className="flex-1 flex flex-col relative w-full h-full min-h-0 bg-[#1E1E1E] overflow-hidden">
            {activeFile ? (
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 bg-[#252526] border-b border-[#3C3C3D] flex text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <div className="w-[160px] px-4 py-2 border-r border-[#3C3C3D] flex items-center gap-1.5"><Clock className="w-3 h-3"/> Time</div>
                  <div className="w-[200px] px-4 py-2 border-r border-[#3C3C3D] flex items-center gap-1.5"><FileText className="w-3 h-3"/> DAO</div>
                  <div className="flex-1 px-4 py-2 flex items-center gap-1.5"><Database className="w-3 h-3"/> Reconstructed SQL Query</div>
                  <div className="w-[60px] px-4 py-2 text-center select-none">Action</div>
                </div>
                
                <div className="flex-1 overflow-y-auto hide-scrollbar bg-[#1a1a1a]">
                  {sqlLogs.length > 0 ? (
                    sqlLogs.map((log, idx) => (
                      <div key={idx} className="flex border-b border-[#2d2d2d] hover:bg-[#252526] transition-colors group group-last:border-none items-stretch">
                        <div className="w-[160px] flex-shrink-0 px-4 py-3 text-[12px] text-gray-400 font-mono border-r border-[#2d2d2d] flex items-center">
                          {log.timestamp || '--/--/-- --:--:--'}
                        </div>
                        <div className="w-[200px] flex-shrink-0 px-4 py-3 text-[12px] text-blue-400/80 font-semibold border-r border-[#2d2d2d] flex items-center truncate" title={log.daoName}>
                          {log.daoName}
                        </div>
                        <div 
                          className="flex-1 px-4 py-3 text-[13px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed lining-nums border-r border-[#2d2d2d] cursor-pointer hover:bg-[#2a2a2e] transition-colors"
                          onClick={() => handleSqlClick(log.reconstructedSql || '')}
                          title="Click to view formatted SQL"
                        >
                           <span className="text-blue-300">{log.reconstructedSql}</span>
                        </div>
                        <div className="w-[60px] flex-shrink-0 flex items-center justify-center bg-[#1e1e1e] group-hover:bg-[#2a2a2e] transition-colors">
                           <button 
                             onClick={() => handleCopy(`${idx}`, log.reconstructedSql || '')}
                             className={`p-2 rounded-md transition-all ${copiedId === `${idx}` ? 'text-green-500 bg-green-500/10' : 'text-gray-500 hover:text-white hover:bg-[#3d3d3d]'}`}
                             title="Copy SQL to Clipboard"
                           >
                             {copiedId === `${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-20 text-center opacity-20 italic text-sm">No queries detected in this session.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 select-none">
                <Database className="w-20 h-20 mb-6 text-gray-400" />
                <div className="h-px w-24 bg-gray-500 mb-6"></div>
                <p className="text-lg font-light tracking-tight italic">Select a log file from the library to view reconstructed SQL</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <StatusBar 
        activeFileName={activeFile ? activeFile.name : "No File"}
        activeLanguage="sql"
        activeEncoding={activeFile ? activeFile.encoding : encoding}
        isCompareMode={false}
        onLanguageChange={() => {}}
        onEncodingChange={handleEncodingChange}
      />

      <SqlFormatterModal 
        isOpen={isModalOpen}
        sql={selectedSql || ''}
        onClose={() => setIsModalOpen(false)}
      />

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <AliasModal
        isOpen={aliasModalProps.isOpen}
        initialValue={aliasModalProps.initialValue}
        onClose={() => setAliasModalProps(p => ({ ...p, isOpen: false }))}
        onSave={(alias) => setFileAlias(aliasModalProps.index, alias || undefined)}
      />
    </div>
  );
}
