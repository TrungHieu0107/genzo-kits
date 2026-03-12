import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { 
  FolderOpen, Search, Copy, Check, FolderSearch, AlertTriangle, 
  FileText, RotateCw, History, Trash2, Plus, ChevronDown, 
  ChevronRight, Replace
} from 'lucide-react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { LazyStore } from '@tauri-apps/plugin-store';

// Stores
import { useAppStore } from '../../store/appStore';
import { useNoteEditorStore } from '../note-editor/store';
import { usePropertyRenamerStore } from '../property-renamer/store';

export interface SearchResultItem {
  path: string;
  name: string;
  base_path: string;
  modified: string;
  is_dir: boolean;
}

const store = new LazyStore('folder_searcher.json');

export default function FolderSearcher() {
  const [rootDirs, setRootDirs] = useState<string[]>(['']);
  const [query, setQuery] = useState<string>('');
  const [mode, setMode] = useState<'all' | 'file' | 'folder'>('all');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [isOptionsCollapsed, setIsOptionsCollapsed] = useState<boolean>(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Sort state
  const [sortKey, setSortKey] = useState<'name' | 'base_path' | 'modified' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Selection state
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  // Stores
  const { setActiveTool } = useAppStore();
  const { openFileByPath } = useNoteEditorStore();
  const { addFiles: addToRenamer } = usePropertyRenamerStore();

  // In-memory cache for search results
  const searchCache = useRef<Map<string, SearchResultItem[]>>(new Map());

  // Column resize state (px widths)
  const [columnWidths, setColumnWidths] = useState<[number, number, number]>([250, 0, 180]);
  const resizingCol = useRef<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleResizeStart = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = colIndex;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[colIndex];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (resizingCol.current === null) return;
      const delta = moveEvent.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + delta);
      setColumnWidths(prev => {
        const next: [number, number, number] = [...prev] as [number, number, number];
        next[resizingCol.current!] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingCol.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  // Load persistence
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedRoots = await store.get<string[]>('rootDirs');
        const savedQuery = await store.get<string>('query');
        const savedMode = await store.get<'all' | 'file' | 'folder'>('mode');
        const savedRegex = await store.get<boolean>('useRegex');
        const savedUseCache = await store.get<boolean>('useCache');
        const savedOptionsCollapsed = await store.get<boolean>('isOptionsCollapsed');

        if (savedRoots && savedRoots.length > 0) {
          setRootDirs(savedRoots);
        } else {
          setRootDirs(['']);
        }
        if (savedQuery) setQuery(savedQuery);
        if (savedMode) setMode(savedMode);
        if (savedRegex !== undefined) setUseRegex(savedRegex);
        if (savedUseCache !== undefined) setUseCache(savedUseCache);
        if (savedOptionsCollapsed !== undefined) setIsOptionsCollapsed(savedOptionsCollapsed);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsInitialLoad(false);
      }
    };
    loadSettings();
  }, []);

  // Save persistence (debounced)
  useEffect(() => {
    if (isInitialLoad) return;

    const saveTimeout = setTimeout(async () => {
      try {
        await store.set('rootDirs', rootDirs);
        await store.set('query', query);
        await store.set('mode', mode);
        await store.set('useRegex', useRegex);
        await store.set('useCache', useCache);
        await store.set('isOptionsCollapsed', isOptionsCollapsed);
        await store.save();
      } catch (err) {
        console.error("Failed to save settings:", err);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [rootDirs, query, mode, useRegex, useCache, isOptionsCollapsed, isInitialLoad]);



  const handleSelectRoot = async (index?: number) => {
    try {
      const selected = await open({
        directory: true,
        multiple: index === undefined,
        title: index === undefined ? "Select Root Directories to Search" : "Select Target Directory"
      });

      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        if (index !== undefined) {
          setRootDirs(prev => {
            const next = [...prev];
            next[index] = paths[0];
            return next;
          });
        } else {
          setRootDirs(prev => {
            const newPaths = paths.filter(p => !prev.includes(p));
            return [...prev, ...newPaths];
          });
        }
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

  const handleUpdateDir = (index: number, value: string) => {
    setRootDirs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddRow = () => {
    setRootDirs(prev => [...prev, '']);
  };

  const handleRemoveDir = (index: number) => {
    setRootDirs(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearDirs = () => {
    setRootDirs(['']);
  };



  const performBackendSearch = async (cacheKey: string): Promise<SearchResultItem[]> => {
    const found: SearchResultItem[] = await invoke('search_system', { 
      roots: rootDirs.filter(r => r.trim() !== ''),
      query: query.trim(),
      mode: mode,
      useRegex: useRegex 
    });
    const data = found || [];
    searchCache.current.set(cacheKey, data);
    setSelectedPaths(new Set()); // Reset selection
    return data;
  };





  const handleSearch = async (forceRefresh: boolean = false) => {
    if (!query.trim()) return;

    const cacheKey = JSON.stringify({
      roots: rootDirs.filter(r => r.trim() !== ''),
      query: query.trim(),
      mode,
      useRegex
    });

    if (!forceRefresh && useCache && searchCache.current.has(cacheKey)) {
      setResults(searchCache.current.get(cacheKey) || []);
      setHasSearched(true);
      setIsCached(true);
      setErrorMsg(null);
      setIsRevalidating(true);
      try {
        const freshData = await performBackendSearch(cacheKey);
        setResults(freshData);
        setIsCached(false);
      } catch (err: unknown) {
        console.error("Background refresh failed:", err);
      } finally {
        setIsRevalidating(false);
      }
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
    setSelectedPaths(new Set());
    setIsCached(false);
    setErrorMsg(null);

    try {
      const data = await performBackendSearch(cacheKey);
      setResults(data);
    } catch (err: unknown) {
      console.error("Search failed:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSearching(false);
    }
  };

  const sortedResults = useMemo(() => {
    if (!sortKey) return results;
    return [...results].sort((a, b) => {
      const valA = (a[sortKey] || '').toString().toLowerCase();
      const valB = (b[sortKey] || '').toString().toLowerCase();
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortKey, sortDir]);

  const handleSort = (key: 'name' | 'base_path' | 'modified') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean, dir: 'asc' | 'desc' }) => {
    if (!active) return <span className="text-gray-500 opacity-30 select-none ml-1">⇅</span>;
    return <span className="text-emerald-400 font-bold ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const copyToClipboard = async (path: string) => {
    try {
      await writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleOpenPath = async (path: string) => {
    try {
      await invoke('open_path', { path });
    } catch (err) {
      console.error("Failed to open path:", err);
    }
  };

  const handleToggleSelect = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (results.length > 0 && selectedPaths.size === results.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(results.map(r => r.path)));
    }
  };

  const handleOpenInNoteAction = async () => {
    const filesOnly = results.filter(r => selectedPaths.has(r.path) && !r.is_dir);
    if (filesOnly.length === 0) return;

    for (const file of filesOnly) {
      await openFileByPath(file.path, 'UTF-8');
    }
    setActiveTool('note-editor');
  };

  const handleAddToRenamerAction = () => {
    const paths = Array.from(selectedPaths);
    addToRenamer(paths);
    setActiveTool('property-renamer');
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <div className="h-[48px] min-h-[48px] bg-[#252526] border-b border-[#333] flex items-center px-4 justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <FolderSearch className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">Genzo Folder Searcher</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Search Mode</span>
            <span className="text-[9px] text-gray-500 italic">Select target directories below</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 w-full relative">
        <div className="bg-[#252526] border border-[#333] rounded-xl p-5 shadow-lg flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search Target</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  <input type="checkbox" checked={useCache} onChange={e => setUseCache(e.target.checked)} className="accent-emerald-500 w-3 h-3" />
                  <span>Enable Cache</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 hover:text-gray-200 transition-colors">
                  <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} className="accent-emerald-500 w-3 h-3" />
                  <span>Use Regex (.*)</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 relative group w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={useRegex ? "e.g. ^module_.*\\.ts$" : "Search for files or folders (e.g., *.ico, main.rs)"}
                className="flex-1 min-w-0 bg-[#1e1e1e] border border-[#333] group-hover:border-[#444] focus:border-emerald-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 outline-none transition-colors"
                autoFocus
              />
              <select 
                value={mode}
                onChange={e => setMode(e.target.value as any)}
                className="w-[140px] flex-shrink-0 bg-[#2d2d2d] border border-[#444] text-gray-200 px-3 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer focus:border-emerald-500 transition-colors"
              >
                <option value="all">Files & Folders</option>
                <option value="file">Files Only</option>
                <option value="folder">Folders Only</option>
              </select>
              <div className="flex gap-1.5 flex-shrink-0">
                <button 
                  onClick={() => handleSearch(false)}
                  disabled={!query.trim() || isSearching}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {isSearching ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
                <button
                  onClick={() => handleSearch(true)}
                  disabled={!query.trim() || isSearching}
                  className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#444] text-gray-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-[#333]/50">
            <div className="flex items-center justify-between group/header cursor-pointer select-none" onClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}>
              <div className="flex items-center gap-2">
                <div className="text-gray-500 group-hover/header:text-gray-300 transition-colors">
                  {isOptionsCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-400" /> {isOptionsCollapsed ? "Settings" : "Target Directories"}
                </label>
              </div>
              {!isOptionsCollapsed && (
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <button onClick={handleClearDirs} className="text-[10px] font-bold text-red-400/70 hover:text-red-400 transition-colors uppercase tracking-wider">Clear Roots</button>
                  <button onClick={() => handleSelectRoot()} className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Add Folders
                  </button>
                </div>
              )}
            </div>
            {!isOptionsCollapsed && (
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                {rootDirs.length === 0 ? (
                  <div className="bg-[#1e1e1e]/50 border border-dashed border-[#333] rounded-lg p-4 flex items-center justify-center" onClick={() => handleSelectRoot()}>
                    <p className="text-[11px] text-gray-500 italic">No search roots selected. Defaulting to system-wide search.</p>
                  </div>
                ) : rootDirs.map((dir, i) => (
                  <div key={i} className="flex gap-2 group/row items-center">
                    <div className="flex-1 relative">
                      <input type="text" value={dir} onChange={(e) => handleUpdateDir(i, e.target.value)} placeholder="Project folder path..." className="w-full bg-[#1e1e1e] border border-[#333] group-hover/row:border-[#444] rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-emerald-500/50 outline-none" />
                      <button onClick={() => handleSelectRoot(i)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"><FolderOpen className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => handleRemoveDir(i)} disabled={rootDirs.length <= 1} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-20"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {!isOptionsCollapsed && rootDirs.length > 0 && <button onClick={handleAddRow} className="flex items-center justify-center gap-2 py-2 border border-dashed border-[#333] hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-lg text-gray-500 hover:text-emerald-400 transition-all text-[10px] font-bold uppercase tracking-wider mt-1"><Plus className="w-3 h-3" /> Add Root</button>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Search Results</h3>
            <div className="flex items-center gap-2">
              {isRevalidating && <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1 animate-pulse"><RotateCw className="w-3 h-3 animate-spin"/> Revalidating...</span>}
              {isCached && !isRevalidating && results.length > 0 && <span className="text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20 flex items-center gap-1"><History className="w-3 h-3"/> From Cache</span>}
              {results.length > 0 && <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Found {results.length} results</span>}
            </div>
          </div>
          <div className="bg-[#252526] border border-[#333] rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar">
              {isSearching ? (
                <div className="h-[300px] flex items-center justify-center flex-col gap-3 text-gray-500">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs font-medium animate-pulse">Searching file system...</span>
                </div>
              ) : errorMsg ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-red-400 gap-2 p-6 text-center">
                  <AlertTriangle className="w-8 h-8 opacity-50 mb-2" />
                  <p className="text-sm font-bold">Search Error</p>
                  <p className="text-xs opacity-70 font-mono bg-red-950/40 p-2 rounded max-w-md break-words">{errorMsg}</p>
                </div>
              ) : hasSearched && results.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-500 gap-2">
                  <Search className="w-8 h-8 opacity-20" />
                  <p className="text-sm">No results found for your query.</p>
                </div>
              ) : !hasSearched ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-600 gap-2">
                  <FolderSearch className="w-10 h-10 opacity-10" />
                  <p className="text-sm">Enter a search term to begin.</p>
                </div>
              ) : (
                <table className="w-full border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '40px' }} />
                    <col style={{ width: `${columnWidths[0]}px` }} />
                    <col />
                    <col style={{ width: `${columnWidths[2]}px` }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#2d2d2d] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="sticky top-0 left-0 z-50 bg-[#2d2d2d] px-2 py-2.5 text-center border-b border-[#333]/50">
                        <input type="checkbox" checked={results.length > 0 && selectedPaths.size === results.length} onChange={handleToggleSelectAll} className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer" />
                      </th>
                      <th 
                        className="sticky top-0 z-40 bg-[#2d2d2d] px-4 py-2.5 text-left border-r border-b border-[#333]/50 relative cursor-pointer select-none group/th"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          <SortIcon active={sortKey === 'name'} dir={sortDir} />
                        </div>
                        <div onMouseDown={(e) => handleResizeStart(0, e)} className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize hover:bg-emerald-500/40 transition-colors z-50" />
                      </th>
                      <th 
                        className="sticky top-0 z-30 bg-[#2d2d2d] px-4 py-2.5 text-left border-b border-[#333]/50 relative cursor-pointer select-none group/th"
                        onClick={() => handleSort('base_path')}
                      >
                        <div className="flex items-center gap-1">
                          Base Path
                          <SortIcon active={sortKey === 'base_path'} dir={sortDir} />
                        </div>
                        <div onMouseDown={(e) => handleResizeStart(2, e)} className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize hover:bg-emerald-500/40 transition-colors z-50" />
                      </th>
                      <th 
                        className="sticky top-0 z-30 bg-[#2d2d2d] px-4 py-2.5 text-left border-b border-[#333]/50 cursor-pointer select-none group/th" 
                        style={{ width: `${columnWidths[2]}px` }}
                        onClick={() => handleSort('modified')}
                      >
                        <div className="flex items-center gap-1">
                          Last Modified
                          <SortIcon active={sortKey === 'modified'} dir={sortDir} />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {sortedResults.map((item: SearchResultItem, idx: number) => (
                      <tr key={idx} className={`group hover:bg-[#2a2a2b] transition-colors text-sm ${selectedPaths.has(item.path) ? 'bg-emerald-500/5' : ''}`}>
                        <td className="px-2 py-2.5 border-b border-[#333]/30 text-center">
                          <input type="checkbox" checked={selectedPaths.has(item.path)} onChange={() => handleToggleSelect(item.path)} className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer" />
                        </td>
                        <td className="sticky left-0 z-20 bg-[#252526] group-hover:bg-[#2a2a2b] transition-colors border-r border-[#333]/50 overflow-hidden" style={{ backgroundColor: selectedPaths.has(item.path) ? '#242e2a' : undefined }}>
                          <button onDoubleClick={() => handleOpenPath(item.path)} className="flex items-center gap-2.5 w-full text-left overflow-hidden">
                            {item.is_dir ? <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                            <span className="text-gray-200 font-medium truncate hover:text-blue-400 hover:underline transition-all">{item.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 border-b border-[#333]/30 overflow-hidden">
                          <div className="flex items-center gap-2 group/path">
                            <span className="text-gray-400 font-mono text-[12px] truncate cursor-pointer hover:text-emerald-400 transition-colors" title="Click to Copy Path" onClick={() => copyToClipboard(item.path)}>{item.base_path}</span>
                            <button onClick={() => copyToClipboard(item.path)} className="opacity-0 group-hover/path:opacity-100 transition-opacity p-0.5 flex-shrink-0">
                               {copiedPath === item.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px] whitespace-nowrap border-b border-[#333]/30">{item.modified}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPaths.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#2d2d2d] border border-emerald-500/50 rounded-full px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 pr-4 border-r border-[#444]">
            <span className="bg-emerald-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedPaths.size}</span>
            <span className="text-xs font-medium text-gray-300">Selected Items</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenInNoteAction} className="flex items-center gap-2 hover:bg-[#3c3c3c] px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 transition-all active:scale-95"><FileText className="w-4 h-4" />Open in Note Editor</button>
            <button onClick={handleAddToRenamerAction} className="flex items-center gap-2 hover:bg-[#3c3c3c] px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 transition-all active:scale-95"><Replace className="w-4 h-4" />Add to Property Renamer</button>
            <button onClick={() => setSelectedPaths(new Set())} className="ml-2 p-1.5 hover:bg-gray-700/50 rounded-full text-gray-500 transition-colors" title="Clear Selection"><Trash2 className="w-4 h-4 hover:text-red-400" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
