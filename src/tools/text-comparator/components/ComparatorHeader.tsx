import { 
  FileUp, ClipboardPaste, ArrowRightLeft, Trash2, CheckSquare, Square, Rows 
} from "lucide-react";

const ENCODING_OPTIONS = [
  "UTF-8", "UTF-16", "UTF-16LE", "UTF-16BE", "Shift_JIS", "EUC-JP", "ISO-8859-1", 
  "windows-1250", "windows-1251", "windows-1252", "windows-1258",
  "GBK", "GB18030", "EUC-KR", "Big5", "koi8-r"
];

interface ComparatorHeaderProps {
  leftEncoding: string;
  rightEncoding: string;
  onEncodingChange: (side: 'left' | 'right', enc: string) => void;
  onLoadFile: (side: 'left' | 'right') => void;
  onPaste: (side: 'left' | 'right') => void;
  showRowHighlight: boolean;
  onToggleHighlight: () => void;
  onClearAll: () => void;
}

export function ComparatorHeader({
  leftEncoding,
  rightEncoding,
  onEncodingChange,
  onLoadFile,
  onPaste,
  showRowHighlight,
  onToggleHighlight,
  onClearAll
}: ComparatorHeaderProps) {
  return (
    <div className="h-[55px] bg-[#252526]/80 backdrop-blur-xl border-b border-[#3C3C3D] flex items-center justify-between px-6 flex-shrink-0 shadow-lg z-50 relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#1e1e1e] border border-[#3C3C3D] rounded-lg px-2 py-1 gap-2">
           <select 
             value={leftEncoding} 
             onChange={(e) => onEncodingChange('left', e.target.value)}
             className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer hover:text-blue-400 transition-colors"
           >
             {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
           </select>
           <div className="w-px h-3 bg-[#333]" />
           <button onClick={() => onLoadFile('left')} className="p-1 hover:bg-[#3C3C3D] text-gray-300 rounded transition flex items-center gap-2 text-xs font-bold" title="Open Left File">
             <FileUp className="w-3.5 h-3.5 text-blue-400" />
           </button>
           <button onClick={() => onPaste('left')} className="p-1 hover:bg-[#3C3C3D] text-gray-300 rounded transition" title="Paste to Left">
             <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
           </button>
        </div>
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-2">Original</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-1.5 bg-[#1e1e1e]/50 rounded-full border border-[#333] shadow-inner">
          <ArrowRightLeft className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-gray-200 font-black tracking-[0.2em] text-xs uppercase">
            Genzo Comparator
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
             onClick={onToggleHighlight}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${
               showRowHighlight 
                 ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/5' 
                 : 'bg-[#2a2a2b] border-transparent text-gray-400 hover:text-gray-200'
             }`}
          >
             {showRowHighlight ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
             <Rows className="w-4 h-4 opacity-70" /> Highlighting
          </button>
          
          <button 
            onClick={onClearAll} 
            className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-lg shadow-red-500/5"
          >
             <Trash2 className="w-4 h-4" /> Clear All
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-2 text-right">Modified</span>
        <div className="flex items-center bg-[#1e1e1e] border border-[#3C3C3D] rounded-lg px-2 py-1 gap-2">
           <button onClick={() => onPaste('right')} className="p-1 hover:bg-[#3C3C3D] text-gray-300 rounded transition" title="Paste to Right">
             <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
           </button>
           <button onClick={() => onLoadFile('right')} className="p-1 hover:bg-[#3C3C3D] text-gray-300 rounded transition flex items-center gap-2 text-xs font-bold" title="Open Right File">
             <FileUp className="w-3.5 h-3.5 text-orange-400" />
           </button>
           <div className="w-px h-3 bg-[#333]" />
           <select 
             value={rightEncoding} 
             onChange={(e) => onEncodingChange('right', e.target.value)}
             className="bg-transparent text-[10px] font-bold text-gray-400 outline-none cursor-pointer hover:text-orange-400 transition-colors"
           >
             {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
           </select>
        </div>
      </div>
    </div>
  );
}
