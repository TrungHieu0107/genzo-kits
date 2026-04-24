import { X } from "lucide-react";

interface RenamerPreviewPanelProps {
  selectedName: string | null;
  selectedOccurrences: any[];
  mappings: Record<string, string>;
  onClose: () => void;
}

const matchTypeLabel = (t: string) => {
  switch (t) {
    case "jsp_property": return "JSP property";
    case "jsp_name": return "JSP name";
    case "java_getter": return "Java getter";
    case "java_setter": return "Java setter";
    case "java_string": return "Java string";
    case "js_getelementbyid": return "JS getElementById";
    case "js_value": return "JS .value";
    default: return t;
  }
};

export function RenamerPreviewPanel({
  selectedName,
  selectedOccurrences,
  mappings,
  onClose
}: RenamerPreviewPanelProps) {
  return (
    <div className="w-[380px] flex-shrink-0 bg-[#252526]/90 backdrop-blur-xl border-l border-[#3C3C3D] flex flex-col shadow-2xl relative z-30">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#3C3C3D]/50 bg-[#2d2d2d]/30">
        <span className="text-[0.85rem] font-black uppercase text-gray-400 truncate pr-2 tracking-widest">
          Refactor Preview: <span className="text-blue-400 font-mono normal-case">{selectedName || "—"}</span>
        </span>
        <button onClick={onClose} className="p-1.5 hover:bg-[#3C3C3D] rounded-lg border border-transparent hover:border-[#555] transition-all">
          <X className="w-4 h-4 text-gray-500 hover:text-white" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#181818]/50">
        {selectedOccurrences.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-[0.85rem] font-bold uppercase tracking-widest text-center px-8 italic opacity-30">
            Click a property name to inspect matches and preview renames
          </div>
        ) : (
          selectedOccurrences.map((occ, i) => {
            const newName = selectedName ? (mappings[selectedName] || "").trim() : "";
            const hasMapping = newName !== "";
            const afterLine = hasMapping && selectedName
              ? occ.line_content.split(selectedName).join(newName)
              : occ.line_content;

            return (
              <div key={i} className="border-b border-[#3C3C3D]/30 px-4 py-4 hover:bg-[#222]/50 transition-colors">
                <div className="flex items-center justify-between text-[0.77rem] text-gray-500 mb-2 font-bold uppercase tracking-tighter">
                  <span className="truncate text-blue-400/70" title={occ.file_path}>{occ.file_path.split(/[/\\]/).pop()}</span>
                  <span className="flex-shrink-0 ml-2 bg-[#2d2d2d] px-1.5 py-0.5 rounded border border-[#333]">
                    L{occ.line_number} · {matchTypeLabel(occ.match_type)}
                  </span>
                </div>
                <pre className="text-[0.85rem] font-mono bg-[#1E1E1E] rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all border border-[#333] shadow-inner mb-2">
                  {hasMapping && selectedName
                    ? occ.line_content.split(selectedName).map((part: string, idx: number, arr: string[]) => (
                        <span key={idx}>
                          <span className="text-gray-400">{part}</span>
                          {idx < arr.length - 1 && <span className="bg-red-900/50 text-red-300 px-0.5 rounded-sm font-black">{selectedName}</span>}
                        </span>
                      ))
                    : <span className="text-gray-400">{occ.line_content}</span>
                  }
                </pre>
                {hasMapping && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-[0.7rem] text-emerald-500/70 mb-1 font-black uppercase tracking-widest pl-1">→ Potential Result</div>
                    <pre className="text-[0.85rem] font-mono bg-[#1a2e1a] rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                      {afterLine.split(newName).map((part: string, idx: number, arr: string[]) => (
                        <span key={idx}>
                          <span className="text-gray-400">{part}</span>
                          {idx < arr.length - 1 && <span className="bg-emerald-500/30 text-emerald-300 px-0.5 rounded-sm font-black">{newName}</span>}
                        </span>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
