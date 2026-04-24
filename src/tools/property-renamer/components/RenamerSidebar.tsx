import { 
  FileUp, FolderOpen, Trash2, X, FileCode, ScanSearch, Loader2, Search 
} from "lucide-react";

const ENCODING_OPTIONS = [
  "UTF-8", "Shift_JIS", "EUC-JP", "windows-1252", "windows-1251",
  "windows-1258", "ISO-8859-1", "UTF-16LE", "UTF-16BE", "GBK", "Big5", "EUC-KR"
];

interface RenamerSidebarProps {
  files: any[];
  onAddFiles: () => void;
  onAddFolder: () => void;
  onClear: () => void;
  onToggleCheck: (path: string) => void;
  onToggleAll: (checked: boolean) => void;
  onSetScanSource: (path: string | null) => void;
  scanSourcePath: string | null;
  onUpdateEncoding: (path: string, enc: string) => void;
  onRemoveFile: (path: string) => void;
  onScan: () => void;
  isScanning: boolean;
}

export function RenamerSidebar({
  files,
  onAddFiles,
  onAddFolder,
  onClear,
  onToggleCheck,
  onToggleAll,
  onSetScanSource,
  scanSourcePath,
  onUpdateEncoding,
  onRemoveFile,
  onScan,
  isScanning
}: RenamerSidebarProps) {
  return (
    <div className="w-[320px] flex-shrink-0 bg-[#252526]/80 backdrop-blur-xl border-r border-[#3C3C3D] flex flex-col shadow-xl">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#3C3C3D]/50 bg-[#2d2d2d]/30">
        <span className="text-[0.85rem] font-black uppercase text-gray-400 tracking-widest">Target Library</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onAddFiles} className="p-1.5 hover:bg-[#3C3C3D] rounded-lg transition" title="Add Files">
            <FileUp className="w-4 h-4 text-blue-400" />
          </button>
          <button onClick={onAddFolder} className="p-1.5 hover:bg-[#3C3C3D] rounded-lg transition" title="Add Folder">
            <FolderOpen className="w-4 h-4 text-yellow-500" />
          </button>
          <button onClick={onClear} className="p-1.5 hover:bg-[#3C3C3D] rounded-lg transition" title="Clear All">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="px-4 py-2 flex items-center justify-between text-[0.77rem] text-gray-500 bg-[#1e1e1e]/30 border-b border-[#3C3C3D]/50">
          <div className="flex gap-3">
            <button onClick={() => onToggleAll(true)} className="hover:text-blue-400 font-bold uppercase transition-colors">Select All</button>
            <button onClick={() => onToggleAll(false)} className="hover:text-gray-300 font-bold uppercase transition-colors">None</button>
          </div>
          <span className="font-mono opacity-50">{files.length} items</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs gap-4 px-6 text-center opacity-40 italic">
            <FileCode className="w-12 h-12 mb-2" />
            <span>Add source files (.java, .jsp, .js) to begin refactoring property names.</span>
          </div>
        ) : (
          files.map((file) => {
            const isScanSource = scanSourcePath === file.path;
            return (
              <div
                key={file.path}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#2A2D2E] text-[0.92rem] group transition-all mb-1 border border-transparent ${
                  isScanSource ? "bg-blue-600/10 border-blue-500/30 shadow-lg shadow-blue-500/5" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={file.checked}
                  onChange={() => onToggleCheck(file.path)}
                  className="accent-blue-500 cursor-pointer flex-shrink-0 w-3.5 h-3.5"
                />
                <button
                  onClick={() => onSetScanSource(isScanSource ? null : file.path)}
                  className={`flex-shrink-0 p-1 rounded-md transition ${isScanSource ? "text-blue-400 bg-blue-400/10" : "text-gray-600 hover:text-gray-400"}`}
                  title={isScanSource ? "Remove as scan source" : "Set as scan source"}
                >
                  <ScanSearch className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`truncate flex-1 min-w-0 cursor-pointer font-medium ${file.checked ? "text-gray-200" : "text-gray-500"}`}
                  title={file.path}
                  onClick={() => onToggleCheck(file.path)}
                >
                  {file.name}
                </span>
                <select
                  value={file.encoding}
                  onChange={(e) => onUpdateEncoding(file.path, e.target.value)}
                  className="bg-[#1e1e1e] text-[0.7rem] font-bold text-gray-500 border border-[#3C3C3D] rounded px-1 py-0.5 outline-none cursor-pointer hover:border-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
                </select>
                <button
                  onClick={() => onRemoveFile(file.path)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-[#3C3C3D] bg-[#2d2d2d]/30">
        {scanSourcePath && (
          <div className="text-[0.77rem] font-bold text-blue-400 mb-2 truncate bg-blue-500/10 px-2 py-1 rounded flex items-center gap-2">
            <ScanSearch className="w-3 h-3" />
            Source: {scanSourcePath.split(/[/\\]/).pop()}
          </div>
        )}
        <button
          onClick={onScan}
          disabled={isScanning || !scanSourcePath}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
        >
          {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {isScanning ? "SCANNING..." : "SCAN SOURCE FILE"}
        </button>
      </div>
    </div>
  );
}
