import { 
  FolderOpen, Search, RotateCw, Plus, ChevronDown, 
  ChevronRight, Trash2 
} from 'lucide-react';
import { open } from "@tauri-apps/plugin-dialog";
import { motion, AnimatePresence } from 'framer-motion';

interface SearchOptionsProps {
  rootDirs: string[];
  setRootDirs: (roots: string[]) => void;
  query: string;
  setQuery: (q: string) => void;
  mode: 'all' | 'file' | 'folder';
  setMode: (m: 'all' | 'file' | 'folder') => void;
  useRegex: boolean;
  setUseRegex: (u: boolean) => void;
  useCache: boolean;
  setUseCache: (u: boolean) => void;
  isOptionsCollapsed: boolean;
  setIsOptionsCollapsed: (i: boolean) => void;
  isSearching: boolean;
  handleSearch: (force?: boolean) => void;
}

export function SearchOptions({
  rootDirs, setRootDirs,
  query, setQuery,
  mode, setMode,
  useRegex, setUseRegex,
  useCache, setUseCache,
  isOptionsCollapsed, setIsOptionsCollapsed,
  isSearching,
  handleSearch
}: SearchOptionsProps) {

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
          const next = [...rootDirs];
          next[index] = paths[0];
          setRootDirs(next);
        } else {
          const newPaths = paths.filter(p => !rootDirs.includes(p));
          setRootDirs([...rootDirs, ...newPaths]);
        }
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

  const handleUpdateDir = (index: number, value: string) => {
    const next = [...rootDirs];
    next[index] = value;
    setRootDirs(next);
  };

  const handleAddRow = () => {
    setRootDirs([...rootDirs, '']);
  };

  const handleRemoveDir = (index: number) => {
    if (rootDirs.length <= 1) return;
    setRootDirs(rootDirs.filter((_, i) => i !== index));
  };

  const handleClearDirs = () => {
    setRootDirs(['']);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#252526]/50 backdrop-blur-md border border-[#333] rounded-xl p-5 shadow-lg flex flex-col gap-5"
    >
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
            className="flex-1 min-w-0 bg-[#1e1e1e]/60 border border-[#333] group-hover:border-[#444] focus:border-emerald-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 outline-none transition-colors"
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
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              {isSearching ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => handleSearch(true)}
              disabled={!query.trim() || isSearching}
              className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#444] text-gray-200 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-[#333]/50">
        <div 
          className="flex items-center justify-between group/header cursor-pointer select-none" 
          onClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
        >
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
              <button onClick={() => handleSelectRoot()} className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95">
                <Plus className="w-3 h-3" /> Add Folders
              </button>
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {!isOptionsCollapsed && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-2 py-1">
                {rootDirs.length === 0 ? (
                  <div className="bg-[#1e1e1e]/50 border border-dashed border-[#333] rounded-lg p-4 flex items-center justify-center" onClick={() => handleSelectRoot()}>
                    <p className="text-[11px] text-gray-500 italic">No search roots selected. Defaulting to system-wide search.</p>
                  </div>
                ) : rootDirs.map((dir, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-2 group/row items-center"
                  >
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={dir} 
                        onChange={(e) => handleUpdateDir(i, e.target.value)} 
                        placeholder="Project folder path..." 
                        className="w-full bg-[#1e1e1e]/60 border border-[#333] group-hover/row:border-[#444] rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-emerald-500/50 outline-none" 
                      />
                      <button onClick={() => handleSelectRoot(i)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"><FolderOpen className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => handleRemoveDir(i)} disabled={rootDirs.length <= 1} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-20"><Trash2 className="w-4 h-4" /></button>
                  </motion.div>
                ))}
                {rootDirs.length > 0 && (
                  <button onClick={handleAddRow} className="flex items-center justify-center gap-2 py-2 border border-dashed border-[#333] hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-lg text-gray-500 hover:text-emerald-400 transition-all text-[10px] font-bold uppercase tracking-wider mt-1 active:scale-[0.98]">
                    <Plus className="w-3 h-3" /> Add Root
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
