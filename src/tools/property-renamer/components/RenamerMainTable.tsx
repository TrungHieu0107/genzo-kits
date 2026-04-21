import { VirtualItem } from "@tanstack/react-virtual";

interface RenamerMainTableProps {
  filteredResults: any[];
  virtualItems: VirtualItem[];
  totalHeight: number;
  parentRef: React.RefObject<HTMLDivElement>;
  selectedName: string | null;
  onSelectName: (name: string) => void;
  mappings: Record<string, string>;
  onUpdateMapping: (name: string, value: string) => void;
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

const uniqueFileCount = (occs: any[]) =>
  new Set(occs.map(o => o.file_path)).size;

export function RenamerMainTable({
  filteredResults,
  virtualItems,
  totalHeight,
  parentRef,
  selectedName,
  onSelectName,
  mappings,
  onUpdateMapping
}: RenamerMainTableProps) {
  return (
    <div ref={parentRef} className="flex-1 overflow-auto relative custom-scrollbar bg-[#1a1a1a]">
      <div style={{ height: `${totalHeight}px`, width: '100%', position: 'relative' }}>
        <table className="w-full text-xs border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 bg-[#252526] z-30 shadow-md">
            <tr className="text-gray-500 uppercase tracking-widest text-[10px] font-black">
              <th className="text-left px-6 py-3 border-b border-[#3C3C3D]">Original Name</th>
              <th className="text-left px-6 py-3 border-b border-[#3C3C3D]">Rename To</th>
              <th className="text-center px-4 py-3 border-b border-[#3C3C3D] w-[100px]">Occurrences</th>
              <th className="text-center px-4 py-3 border-b border-[#3C3C3D] w-[80px]">Files</th>
              <th className="text-center px-4 py-3 border-b border-[#3C3C3D] w-[180px]">Contexts</th>
            </tr>
          </thead>
          <tbody>
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr style={{ height: `${virtualItems[0].start}px` }}>
                <td colSpan={5} />
              </tr>
            )}
            {virtualItems.map((virtualRow: VirtualItem) => {
              const result = filteredResults[virtualRow.index];
              if (!result) return null;
              const isSelected = selectedName === result.old_name;
              
              return (
                <tr
                  key={virtualRow.key}
                  className={`group border-b border-[#2d2d2d] hover:bg-[#252526] transition-all ${isSelected ? "bg-blue-600/5 shadow-inner" : ""}`}
                  style={{ height: `${virtualRow.size}px` }}
                >
                  <td className="px-6 py-2 truncate">
                    <button
                      onClick={() => onSelectName(result.old_name)}
                      className={`text-left truncate w-full font-mono font-medium transition-colors ${isSelected ? 'text-blue-400 underline' : 'text-gray-300 hover:text-blue-400'}`}
                    >
                      {result.old_name}
                    </button>
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="text"
                      value={mappings[result.old_name] || ""}
                      onChange={(e) => onUpdateMapping(result.old_name, e.target.value)}
                      placeholder="Type target name..."
                      className="w-full bg-[#1e1e1e] text-gray-200 font-mono px-3 py-1.5 rounded-lg outline-none border border-[#3C3C3D] focus:border-blue-500/50 transition-all text-[11px] shadow-inner"
                    />
                  </td>
                  <td className="text-center px-4 py-2">
                    <button
                      onClick={() => onSelectName(result.old_name)}
                      className="text-blue-400 font-bold hover:underline bg-blue-400/10 px-2 py-0.5 rounded-full"
                    >
                      {result.occurrences.length}
                    </button>
                  </td>
                  <td className="text-center px-4 py-2 text-gray-500 font-mono">
                    {uniqueFileCount(result.occurrences)}
                  </td>
                  <td className="text-center px-4 py-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {[...new Set(result.occurrences.map((o: any) => o.match_type))].map((t: any) => (
                        <span key={t} className="bg-[#2d2d2d] text-gray-500 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border border-[#333]">
                          {matchTypeLabel(t as string)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {virtualItems.length > 0 && totalHeight - virtualItems[virtualItems.length - 1].end > 0 && (
              <tr style={{ height: `${totalHeight - virtualItems[virtualItems.length - 1].end}px` }}>
                <td colSpan={5} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
