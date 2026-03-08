import { useState } from 'react';
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen, Search, Copy, Check, FolderSearch, AlertTriangle, FileText } from 'lucide-react';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

export interface SearchResultItem {
  path: string;
  is_dir: boolean;
}

export default function FolderSearcher() {
  const [rootDir, setRootDir] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [mode, setMode] = useState<'all' | 'file' | 'folder'>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleSelectRoot = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Root Directory to Search"
      });
      if (selected && !Array.isArray(selected)) {
        setRootDir(selected);
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

  const handleSearch = async () => {
    if (!rootDir || !query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    try {
      const found: SearchResultItem[] = await invoke('search_system', { 
        root: rootDir, 
        query: query.trim(),
        mode: mode
      });
      setResults(found);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
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
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <div className="h-[48px] min-h-[48px] bg-[#252526] border-b border-[#333] flex items-center px-4 justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
          <FolderSearch className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">System File & Folder Searcher</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* Search Controls Card */}
        <div className="bg-[#252526] border border-[#333] rounded-xl p-5 shadow-lg flex flex-col gap-5">
          
          {/* Root Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Target Directory</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={rootDir} 
                placeholder="Click 'Browse' to select a starting folder..."
                className="flex-1 bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-300 outline-none cursor-not-allowed"
              />
              <button 
                onClick={handleSelectRoot}
                className="bg-[#2d2d2d] hover:bg-[#3c3c3c] border border-[#444] text-gray-200 px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4 text-blue-400" /> Browse
              </button>
            </div>
            {!rootDir && <p className="text-[10px] text-amber-500/80 flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3"/> A root directory is required to limit search scope.</p>}
          </div>

          {/* Query Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search Target</label>
            <div className="flex gap-2 relative group w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. node_modules, target, logs, main.rs..."
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
              <button 
                onClick={handleSearch}
                disabled={!rootDir || !query.trim() || isSearching}
                className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#333] disabled:text-gray-500 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>Search</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {hasSearched && (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                 Search Results
               </h3>
               {results.length > 0 && (
                  <span className="text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    {results.length} {results.length >= 500 ? 'matches (Limit reached)' : 'matches found'}
                  </span>
               )}
            </div>

            <div className="bg-[#252526] border border-[#333] rounded-xl flex-1 overflow-auto">
              {isSearching ? (
                <div className="h-[200px] flex items-center justify-center flex-col gap-3 text-gray-500">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-xs font-medium animate-pulse">Scanning file system recursively...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-gray-500 gap-2">
                   <Search className="w-8 h-8 opacity-20" />
                   <p className="text-sm">No folders matched your query.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[#333]">
                  {results.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between px-4 py-3 hover:bg-[#2a2a2b] transition-colors group">
                       <div className="flex items-center gap-3 overflow-hidden">
                         {item.is_dir ? (
                           <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                         ) : (
                           <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                         )}
                         <span className="text-sm text-gray-300 truncate font-mono" title={item.path}>
                            {item.path}
                         </span>
                       </div>
                       <button
                         onClick={() => copyToClipboard(item.path)}
                         className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#3c3c3c] rounded text-gray-400 hover:text-white transition-all ml-2 flex-shrink-0"
                         title="Copy Path"
                       >
                         {copiedPath === item.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                       </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
