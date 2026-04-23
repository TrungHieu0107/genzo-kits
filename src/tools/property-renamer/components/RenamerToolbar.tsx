import { 
  Search, Replace, Undo2, Loader2 
} from "lucide-react";

interface RenamerToolbarProps {
  filter: string;
  onFilterChange: (v: string) => void;
  onReplace: () => void;
  onUndo: () => void;
  isReplacing: boolean;
  isUndoing: boolean;
  pendingCount: number;
}

export function RenamerToolbar({
  filter,
  onFilterChange,
  onReplace,
  onUndo,
  isReplacing,
  isUndoing,
  pendingCount
}: RenamerToolbarProps) {
  return (
    <div className="h-[55px] px-6 py-2 flex items-center gap-4 border-b border-[#3C3C3D] bg-[#252526]/80 backdrop-blur-xl shadow-sm z-20">
      <div className="flex-1 relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Filter property names..."
          className="w-full bg-[#1e1e1e] text-gray-200 text-xs pl-10 pr-4 py-2 rounded-xl outline-none border border-transparent focus:border-blue-500/50 transition-all shadow-inner"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onReplace}
          disabled={isReplacing || pendingCount === 0}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-black px-5 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-600/10"
        >
          {isReplacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Replace className="w-4 h-4" />}
          APPLY RENAMES ({pendingCount})
        </button>
        <button
          onClick={onUndo}
          disabled={isUndoing}
          className="flex items-center gap-2 bg-[#3c3c3c] hover:bg-[#444] disabled:opacity-30 text-gray-200 text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 border border-[#444]"
        >
          {isUndoing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
          UNDO
        </button>
      </div>
    </div>
  );
}
