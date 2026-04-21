import { 
  FolderOpen, RefreshCw, Filter, Clock 
} from 'lucide-react';

interface LogToolbarProps {
  onOpenFile: () => void;
  onReload: () => void;
  isReloading: boolean;
  encoding: string;
  onEncodingChange: (enc: string) => void;
  onOpenFilter: () => void;
  sortOrder: 'asc' | 'desc';
  onToggleSort: () => void;
  activeFile: any;
  queryCount: number;
}

export function LogToolbar({
  onOpenFile,
  onReload,
  isReloading,
  encoding,
  onEncodingChange,
  onOpenFilter,
  sortOrder,
  onToggleSort,
  activeFile,
  queryCount
}: LogToolbarProps) {
  return (
    <div className="h-[45px] bg-[#2d2d2d]/80 backdrop-blur-md flex items-center justify-between px-4 gap-2 border-b border-[#1E1E1E] shadow-sm relative z-10">
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenFile}
          className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/5"
        >
          <FolderOpen className="w-3.5 h-3.5" /> Open Log File
        </button>

        <button 
          onClick={onReload}
          disabled={!activeFile || isReloading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
            activeFile 
              ? 'bg-[#3c3c3c] hover:bg-[#444] text-gray-200 border border-[#444]' 
              : 'bg-[#222] text-gray-600 border border-transparent cursor-not-allowed'
          } ${isReloading ? 'opacity-70' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${activeFile ? 'text-emerald-400' : ''} ${isReloading ? 'animate-spin' : ''}`} /> 
          {isReloading ? 'Reloading...' : 'Refresh'}
        </button>

        <div className="h-6 w-px bg-[#444] mx-1" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tight">Encoding:</span>
          <select 
            value={encoding}
            onChange={(e) => onEncodingChange(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3C3C3D] text-[11px] text-gray-300 px-2 py-1 rounded-md outline-none hover:border-blue-500/50 transition-colors cursor-pointer"
          >
            <option value="UTF-8">UTF-8</option>
            <option value="Shift_JIS">Shift_JIS</option>
            <option value="EUC-JP">EUC-JP</option>
            <option value="UTF-16LE">UTF-16LE</option>
            <option value="Windows-1252">Windows-1252</option>
          </select>
        </div>

        <button 
          onClick={onOpenFilter}
          disabled={!activeFile}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ml-2 ${
            activeFile 
              ? 'bg-[#3c3c3c] hover:bg-[#444] text-gray-200 border border-blue-500/20' 
              : 'bg-[#222] text-gray-600 border border-transparent cursor-not-allowed'
          }`}
        >
          <Filter className={`w-3.5 h-3.5 ${activeFile ? 'text-blue-400' : ''}`} /> Filter
        </button>

        <button 
          onClick={onToggleSort}
          disabled={!activeFile}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ml-1 ${
            activeFile 
              ? 'bg-[#3c3c3c] hover:bg-[#444] text-gray-200 border border-purple-500/20' 
              : 'bg-[#222] text-gray-600 border border-transparent cursor-not-allowed'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeFile ? 'text-purple-400' : ''}`} />
          {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
        </button>
      </div>
      
      {activeFile && (
        <div className="flex items-center gap-3">
          <div className="text-[11px] font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20 shadow-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            {queryCount} SQL Queries
          </div>
        </div>
      )}
    </div>
  );
}
