import { useRef } from 'react';
import { 
  FileText, FolderOpen, Copy, Check, RotateCw, 
  History, Search, AlertTriangle, FolderSearch 
} from 'lucide-react';
import { useVirtualizer, VirtualItem } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchResultItem } from '../hooks/useFolderSearch';
import { fs } from '../../../hooks/useFontSize';

interface ResultsTableProps {
  results: SearchResultItem[];
  isSearching: boolean;
  isRevalidating: boolean;
  isCached: boolean;
  hasSearched: boolean;
  errorMsg: string | null;
  selectedPaths: Set<string>;
  onToggleSelect: (path: string) => void;
  onToggleSelectAll: () => void;
  onOpenPath: (path: string) => void;
  onCopyToClipboard: (path: string) => void;
  copiedPath: string | null;
  sortKey: 'name' | 'base_path' | 'modified' | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: 'name' | 'base_path' | 'modified') => void;
  columnWidths: [number, number, number];
  onResizeStart: (colIndex: number, e: React.MouseEvent) => void;
}

export function ResultsTable({
  results,
  isSearching,
  isRevalidating,
  isCached,
  hasSearched,
  errorMsg,
  selectedPaths,
  onToggleSelect,
  onToggleSelectAll,
  onOpenPath,
  onCopyToClipboard,
  copiedPath,
  sortKey,
  sortDir,
  onSort,
  columnWidths,
  onResizeStart
}: ResultsTableProps) {

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 41,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  const SortIcon = ({ active, dir }: { active: boolean, dir: 'asc' | 'desc' }) => {
    if (!active) return <span className="text-gray-500 opacity-30 select-none ml-1">⇅</span>;
    return <span className="text-emerald-400 font-bold ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 style={fs.caption} className="font-bold text-gray-400 uppercase tracking-wider">Search Results</h3>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isRevalidating && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={fs.nano}
                className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1 animate-pulse"
              >
                <RotateCw className="w-3 h-3 animate-spin"/> Revalidating...
              </motion.span>
            )}
            {isCached && !isRevalidating && results.length > 0 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={fs.nano}
                className="font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20 flex items-center gap-1"
              >
                <History className="w-3 h-3"/> From Cache
              </motion.span>
            )}
          </AnimatePresence>
          {results.length > 0 && (
            <span style={fs.caption} className="font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 transition-all">
              Found {results.length} results
            </span>
          )}
        </div>
      </div>

      <div className="bg-[#252526]/50 backdrop-blur-md border border-[#333] rounded-xl flex-1 overflow-hidden flex flex-col shadow-inner">
        <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar relative">
          {isSearching ? (
            <div className="h-full flex items-center justify-center flex-col gap-3 text-gray-500">
              <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span style={fs.caption} className="font-medium animate-pulse text-gray-400">Searching file system...</span>
            </div>
          ) : errorMsg ? (
            <div className="h-full flex flex-col items-center justify-center text-red-400 gap-2 p-6 text-center">
              <AlertTriangle className="w-8 h-8 opacity-50 mb-2" />
              <p style={fs.body} className="font-bold">Search Error</p>
              <p style={fs.caption} className="opacity-70 font-mono bg-red-950/40 p-2 rounded max-w-md break-words">{errorMsg}</p>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
              <Search className="w-8 h-8 opacity-20" />
              <p style={fs.body}>No results found for your query.</p>
            </div>
          ) : !hasSearched ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
              <FolderSearch className="w-10 h-10 opacity-10" />
              <p style={fs.body}>Enter a search term to begin.</p>
            </div>
          ) : (
            <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
              <table className="w-full border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '40px' }} />
                  <col style={{ width: `${columnWidths[0]}px` }} />
                  <col />
                  <col style={{ width: `${columnWidths[2]}px` }} />
                </colgroup>
                <thead className="sticky top-0 z-50">
                  <tr style={fs.caption} className="bg-[#2d2d2d]/90 backdrop-blur-sm font-bold text-gray-500 uppercase tracking-wider">
                    <th className="sticky top-0 left-0 z-50 bg-[#2d2d2d] px-2 py-2.5 text-center border-b border-[#333]/50 shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={results.length > 0 && selectedPaths.size === results.length} 
                        onChange={onToggleSelectAll} 
                        className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer" 
                      />
                    </th>
                    <th 
                      className="sticky top-0 z-40 bg-[#2d2d2d] px-4 py-2.5 text-left border-r border-b border-[#333]/50 relative cursor-pointer select-none group/th shadow-sm"
                      onClick={() => onSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <SortIcon active={sortKey === 'name'} dir={sortDir} />
                      </div>
                      <div onMouseDown={(e) => onResizeStart(0, e)} className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize hover:bg-emerald-500/40 transition-colors z-50" />
                    </th>
                    <th 
                      className="sticky top-0 z-30 bg-[#2d2d2d] px-4 py-2.5 text-left border-b border-[#333]/50 relative cursor-pointer select-none group/th shadow-sm"
                      onClick={() => onSort('base_path')}
                    >
                      <div className="flex items-center gap-1">
                        Base Path
                        <SortIcon active={sortKey === 'base_path'} dir={sortDir} />
                      </div>
                      <div onMouseDown={(e) => onResizeStart(1, e)} className="absolute right-0 top-0 h-full w-[5px] cursor-col-resize hover:bg-emerald-500/40 transition-colors z-50" />
                    </th>
                    <th 
                      className="sticky top-0 z-30 bg-[#2d2d2d] px-4 py-2.5 text-left border-b border-[#333]/50 cursor-pointer select-none group/th shadow-sm" 
                      onClick={() => onSort('modified')}
                    >
                      <div className="flex items-center gap-1">
                        Last Modified
                        <SortIcon active={sortKey === 'modified'} dir={sortDir} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {virtualItems.length > 0 && virtualItems[0].start > 0 && (
                    <tr style={{ height: `${virtualItems[0].start}px` }}>
                      <td colSpan={4} />
                    </tr>
                  )}
                  {virtualItems.map((virtualRow: VirtualItem) => {
                    const item = results[virtualRow.index];
                    if (!item) return null;
                    const isSelected = selectedPaths.has(item.path);
                    
                    return (
                      <tr 
                        key={virtualRow.key} 
                        className={`group hover:bg-[#2a2a2b] transition-colors ${isSelected ? 'bg-emerald-500/5' : ''}`} 
                        style={{ ...fs.body, height: `${virtualRow.size}px` }}
                      >
                        <td className="px-2 py-2.5 border-b border-[#333]/30 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => onToggleSelect(item.path)} 
                            className="accent-emerald-500 w-3.5 h-3.5 rounded cursor-pointer" 
                          />
                        </td>
                        <td className="sticky left-0 z-20 bg-[#252526]/90 group-hover:bg-[#2a2a2b] transition-colors border-r border-[#333]/50 overflow-hidden" style={{ backgroundColor: isSelected ? '#242e2a' : undefined }}>
                          <button onDoubleClick={() => onOpenPath(item.path)} className="flex items-center gap-2.5 w-full text-left overflow-hidden px-4">
                            {item.is_dir ? <FolderOpen className="w-4 h-4 text-yellow-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                            <span className="text-gray-200 font-medium truncate hover:text-blue-400 hover:underline transition-all">{item.name}</span>
                          </button>
                        </td>
                        <td className="px-4 py-2.5 border-b border-[#333]/30 overflow-hidden">
                          <div className="flex items-center gap-2 group/path">
                            <span 
                              className="text-gray-400 font-mono truncate cursor-pointer hover:text-emerald-400 transition-colors" 
                              style={fs.bodySm}
                              title="Click to Copy Path" 
                              onClick={() => onCopyToClipboard(item.path)}
                            >
                              {item.base_path}
                            </span>
                            <button onClick={() => onCopyToClipboard(item.path)} className="opacity-0 group-hover/path:opacity-100 transition-opacity p-0.5 flex-shrink-0">
                               {copiedPath === item.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono whitespace-nowrap border-b border-[#333]/30" style={fs.caption}>{item.modified}</td>
                      </tr>
                    );
                  })}
                  {virtualItems.length > 0 && totalHeight - virtualItems[virtualItems.length - 1].end > 0 && (
                    <tr style={{ height: `${totalHeight - virtualItems[virtualItems.length - 1].end}px` }}>
                      <td colSpan={4} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
