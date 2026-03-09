import { useState, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen, FileUp, Trash2, Search, Replace, Undo2, Eye, EyeOff,
  Check, X, AlertTriangle, Loader2, FileCode, ScanSearch
} from "lucide-react";

// ===== Types =====
interface FileEntry {
  path: string;
  name: string;
  checked: boolean;
  encoding: string;
}

const ENCODING_OPTIONS = [
  "UTF-8", "Shift_JIS", "EUC-JP", "windows-1252", "windows-1251",
  "windows-1258", "ISO-8859-1", "UTF-16LE", "UTF-16BE", "GBK", "Big5", "EUC-KR"
];

interface ScanOccurrence {
  file_path: string;
  line_number: number;
  line_content: string;
  match_type: string;
}

interface ScanResult {
  old_name: string;
  occurrences: ScanOccurrence[];
}

interface ReplaceResult {
  files_modified: number;
  total_replacements: number;
  errors: string[];
}

interface UndoResult {
  files_restored: number;
  errors: string[];
}

// ===== Helper: match_type label =====
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

export function PropertyRenamer() {
  // File list state
  const [files, setFiles] = useState<FileEntry[]>([]);
  // Scan results
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  // Mappings: oldName -> newName
  const [mappings, setMappings] = useState<Record<string, string>>({});
  // Selected name for preview
  const [selectedName, setSelectedName] = useState<string | null>(null);
  // Preview panel visibility
  const [showPreview, setShowPreview] = useState(false);
  // Loading states
  const [isScanning, setIsScanning] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  // Result/status messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info">("info");
  // Filter
  const [filter, setFilter] = useState("");
  // Scan source: only this file is scanned for property names
  const [scanSourcePath, setScanSourcePath] = useState<string | null>(null);

  // Derived
  const checkedPaths = useMemo(() => files.filter(f => f.checked).map(f => f.path), [files]);
  const filteredResults = useMemo(() =>
    scanResults.filter(r => r.old_name.toLowerCase().includes(filter.toLowerCase())),
    [scanResults, filter]
  );
  const pendingCount = useMemo(() =>
    Object.values(mappings).filter(v => v.trim() !== "").length,
    [mappings]
  );
  const selectedOccurrences = useMemo(() =>
    scanResults.find(r => r.old_name === selectedName)?.occurrences || [],
    [scanResults, selectedName]
  );

  // ===== File Management =====
  const handleAddFiles = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: "Source Files", extensions: ["jsp", "java", "js"] }],
      });
      if (selected) {
        const paths = Array.isArray(selected) ? selected : [selected];
        setFiles(prev => {
          const existing = new Set(prev.map(f => f.path));
          const newEntries = paths
            .filter(p => !existing.has(p))
            .map(p => ({
              path: p,
              name: p.split(/[/\\]/).pop() || p,
              checked: true,
              encoding: "UTF-8",
            }));
          return [...prev, ...newEntries];
        });
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  }, []);

  const handleAddFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        setStatusMessage("Collecting files...");
        setStatusType("info");
        const foundPaths: string[] = await invoke("collect_files", { root: selected });
        setFiles(prev => {
          const existing = new Set(prev.map(f => f.path));
          const newEntries = foundPaths
            .filter(p => !existing.has(p))
            .map(p => ({
              path: p,
              name: p.split(/[/\\]/).pop() || p,
              checked: true,
              encoding: "UTF-8",
            }));
          return [...prev, ...newEntries];
        });
        setStatusMessage(`Found ${foundPaths.length} files.`);
        setStatusType("success");
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  }, []);

  const toggleFile = useCallback((index: number) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, checked: !f.checked } : f));
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    setFiles(prev => prev.map(f => ({ ...f, checked })));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setScanResults([]);
    setMappings({});
    setSelectedName(null);
    setStatusMessage(null);
    setScanSourcePath(null);
  }, []);

  // ===== Scan =====
  const handleScan = useCallback(async () => {
    if (!scanSourcePath) {
      setStatusMessage("Please designate a scan source file (click the ◎ icon).");
      setStatusType("error");
      return;
    }
    setIsScanning(true);
    setStatusMessage("Scanning scan source file...");
    setStatusType("info");
    try {
      // Scan ONLY the designated source file
      const results: ScanResult[] = await invoke("scan_files", { paths: [scanSourcePath] });
      setScanResults(results);
      // Initialize mappings with empty strings
      const newMappings: Record<string, string> = {};
      for (const r of results) {
        newMappings[r.old_name] = mappings[r.old_name] || "";
      }
      setMappings(newMappings);
      const srcName = scanSourcePath.split(/[/\\]/).pop() || scanSourcePath;
      setStatusMessage(`Found ${results.length} unique names from "${srcName}". Replace applies to all ${checkedPaths.length} checked files.`);
      setStatusType("success");
    } catch (err) {
      setStatusMessage(`Scan error: ${err}`);
      setStatusType("error");
    } finally {
      setIsScanning(false);
    }
  }, [scanSourcePath, checkedPaths.length, mappings]);

  // ===== Replace =====
  const handleReplace = useCallback(async () => {
    const validMappings = Object.entries(mappings)
      .filter(([_, v]) => v.trim() !== "")
      .map(([oldName, newName]) => ({ old_name: oldName, new_name: newName }));

    if (validMappings.length === 0) {
      setStatusMessage("No mappings to apply. Fill in 'New Name' fields first.");
      setStatusType("error");
      return;
    }

    setIsReplacing(true);
    setStatusMessage("Replacing...");
    setStatusType("info");
    try {
      // Build per-file encoding map from checked files
      const encodingsMap: Record<string, string> = {};
      for (const f of files) {
        if (f.checked) encodingsMap[f.path] = f.encoding;
      }
      const result: ReplaceResult = await invoke("replace_in_files", {
        mappings: validMappings,
        paths: checkedPaths,
        encodings: encodingsMap,
      });
      let msg = `✅ Modified ${result.files_modified} files, ${result.total_replacements} replacements.`;
      if (result.errors.length > 0) {
        msg += ` ⚠️ ${result.errors.length} errors.`;
      }
      setStatusMessage(msg);
      setStatusType(result.errors.length > 0 ? "error" : "success");
    } catch (err) {
      setStatusMessage(`Replace error: ${err}`);
      setStatusType("error");
    } finally {
      setIsReplacing(false);
    }
  }, [mappings, checkedPaths]);

  // ===== Undo =====
  const handleUndo = useCallback(async () => {
    setIsUndoing(true);
    setStatusMessage("Undoing...");
    setStatusType("info");
    try {
      const result: UndoResult = await invoke("undo_last_replace", { paths: checkedPaths });
      setStatusMessage(`Restored ${result.files_restored} files.`);
      setStatusType("success");
    } catch (err) {
      setStatusMessage(`Undo error: ${err}`);
      setStatusType("error");
    } finally {
      setIsUndoing(false);
    }
  }, [checkedPaths]);

  // Unique file count for an occurrence list
  const uniqueFileCount = (occs: ScanOccurrence[]) =>
    new Set(occs.map(o => o.file_path)).size;

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-[40px] bg-[#252526] border-b border-[#3C3C3D] flex items-center justify-between px-4 flex-shrink-0 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-300 font-bold tracking-wider uppercase flex items-center gap-2">
            <Replace className="w-4 h-4 text-teal-400" /> Property Renamer
          </span>
          <span className="text-gray-500">
            {files.length} files loaded · {scanResults.length} names found · {pendingCount} pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 hover:bg-[#3C3C3D] rounded transition"
            title={showPreview ? "Hide Preview" : "Show Preview"}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: File Panel */}
        <div className="w-[300px] flex-shrink-0 bg-[#252526] border-r border-[#3C3C3D] flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[#3C3C3D]">
            <span className="text-[11px] font-bold uppercase text-gray-400">Files</span>
            <div className="flex items-center gap-1">
              <button onClick={handleAddFiles} className="p-1 hover:bg-[#3C3C3D] rounded" title="Add Files">
                <FileUp className="w-3.5 h-3.5 text-blue-400" />
              </button>
              <button onClick={handleAddFolder} className="p-1 hover:bg-[#3C3C3D] rounded" title="Add Folder">
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
              </button>
              <button onClick={clearFiles} className="p-1 hover:bg-[#3C3C3D] rounded" title="Clear All">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {/* Select All / Deselect */}
          {files.length > 0 && (
            <div className="px-3 py-1 flex items-center gap-2 text-[10px] text-gray-500 border-b border-[#3C3C3D]">
              <button onClick={() => toggleAll(true)} className="hover:text-gray-300">Select All</button>
              <span>|</span>
              <button onClick={() => toggleAll(false)} className="hover:text-gray-300">Deselect All</button>
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-y-auto">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs gap-2 px-4 text-center">
                <FileCode className="w-8 h-8 opacity-30" />
                <span>Add .jsp, .java, .js files</span>
              </div>
            ) : (
              files.map((file, i) => {
                const isScanSource = scanSourcePath === file.path;
                return (
                <div
                  key={file.path}
                  className={`flex items-center gap-1 px-2 py-1.5 hover:bg-[#2A2D2E] text-[12px] ${isScanSource ? "bg-[#1a2e3a] border-l-2 border-teal-500" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={file.checked}
                    onChange={() => toggleFile(i)}
                    className="accent-teal-500 cursor-pointer flex-shrink-0"
                  />
                  <button
                    onClick={() => setScanSourcePath(isScanSource ? null : file.path)}
                    className={`flex-shrink-0 p-0.5 rounded transition ${isScanSource ? "text-teal-400" : "text-gray-600 hover:text-gray-400"}`}
                    title={isScanSource ? "Remove as scan source" : "Set as scan source"}
                  >
                    <ScanSearch className="w-3 h-3" />
                  </button>
                  <span
                    className={`truncate flex-1 min-w-0 cursor-pointer ${file.checked ? "text-gray-300" : "text-gray-600"}`}
                    title={file.path}
                    onClick={() => toggleFile(i)}
                  >
                    {file.name}
                  </span>
                  <select
                    value={file.encoding}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, encoding: e.target.value } : f));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent text-[10px] text-gray-500 border border-[#3C3C3D] rounded px-0.5 py-0.5 outline-none cursor-pointer hover:border-gray-500 flex-shrink-0 max-w-[80px]"
                    title="Save Encoding"
                  >
                    {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      if (isScanSource) setScanSourcePath(null);
                      setFiles(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="flex-shrink-0 p-0.5 rounded text-gray-600 hover:text-red-400 transition"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                );
              })
            )}
          </div>

          {/* Scan button */}
          <div className="p-3 border-t border-[#3C3C3D]">
            {scanSourcePath && (
              <div className="text-[10px] text-teal-400 mb-1.5 truncate" title={scanSourcePath}>
                Scan source: {scanSourcePath.split(/[/\\]/).pop()}
              </div>
            )}
            <button
              onClick={handleScan}
              disabled={isScanning || !scanSourcePath}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded transition"
            >
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isScanning ? "Scanning..." : scanSourcePath ? "Scan Source File" : "Set Scan Source ◎"}
            </button>
          </div>
        </div>

        {/* CENTER: Mapping Table */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Filter & Replace controls */}
          <div className="px-4 py-2 flex items-center gap-3 border-b border-[#3C3C3D] bg-[#252526]">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by old name..."
                className="w-full bg-[#3C3C3D] text-gray-200 text-xs pl-7 pr-3 py-1.5 rounded outline-none border border-transparent focus:border-teal-500"
              />
            </div>
            <button
              onClick={handleReplace}
              disabled={isReplacing || pendingCount === 0}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded transition"
            >
              {isReplacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Replace className="w-3.5 h-3.5" />}
              Replace All
            </button>
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="flex items-center gap-1.5 bg-gray-600 hover:bg-gray-500 disabled:opacity-40 text-white text-xs font-bold px-3 py-1.5 rounded transition"
            >
              {isUndoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
              Undo
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {scanResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs gap-2">
                <Search className="w-10 h-10 opacity-20" />
                <span>Scan files to find renameable properties</span>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#2D2D2D] z-10">
                  <tr className="text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-semibold w-[30%]">Old Name</th>
                    <th className="text-left px-4 py-2 font-semibold w-[30%]">New Name</th>
                    <th className="text-center px-4 py-2 font-semibold w-[15%]">Occurrences</th>
                    <th className="text-center px-4 py-2 font-semibold w-[10%]">Files</th>
                    <th className="text-center px-4 py-2 font-semibold w-[15%]">Types</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => {
                    const types = [...new Set(result.occurrences.map(o => o.match_type))];
                    return (
                      <tr
                        key={result.old_name}
                        className={`border-b border-[#3C3C3D] hover:bg-[#2A2D2E] ${
                          selectedName === result.old_name ? "bg-[#37373D]" : ""
                        }`}
                      >
                        <td className="px-4 py-2">
                          <button
                            onClick={() => {
                              setSelectedName(result.old_name);
                              setShowPreview(true);
                            }}
                            className="text-teal-400 hover:underline font-mono text-left"
                          >
                            {result.old_name}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={mappings[result.old_name] || ""}
                            onChange={(e) =>
                              setMappings(prev => ({ ...prev, [result.old_name]: e.target.value }))
                            }
                            placeholder="Enter new name..."
                            className="w-full bg-[#3C3C3D] text-gray-200 font-mono px-2 py-1 rounded outline-none border border-transparent focus:border-teal-500 text-xs"
                          />
                        </td>
                        <td className="text-center px-4 py-2">
                          <button
                            onClick={() => {
                              setSelectedName(result.old_name);
                              setShowPreview(true);
                            }}
                            className="text-blue-400 hover:underline"
                          >
                            {result.occurrences.length}
                          </button>
                        </td>
                        <td className="text-center px-4 py-2 text-gray-400">
                          {uniqueFileCount(result.occurrences)}
                        </td>
                        <td className="text-center px-4 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {types.map(t => (
                              <span key={t} className="bg-[#3C3C3D] text-gray-400 px-1.5 py-0.5 rounded text-[10px]">
                                {matchTypeLabel(t)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Preview Panel */}
        {showPreview && (
          <div className="w-[350px] flex-shrink-0 bg-[#252526] border-l border-[#3C3C3D] flex flex-col">
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#3C3C3D]">
              <span className="text-[11px] font-bold uppercase text-gray-400">
                Preview: <span className="text-teal-400 font-mono normal-case">{selectedName || "—"}</span>
              </span>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-[#3C3C3D] rounded">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedOccurrences.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  Click a name to preview occurrences
                </div>
              ) : (
                selectedOccurrences.map((occ, i) => {
                  const newName = selectedName ? (mappings[selectedName] || "").trim() : "";
                  const hasMapping = newName !== "";
                  // Compute the preview "after" line by replacing oldName with newName in context
                  const afterLine = hasMapping && selectedName
                    ? occ.line_content.split(selectedName).join(newName)
                    : occ.line_content;

                  return (
                    <div key={i} className="border-b border-[#3C3C3D] px-3 py-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span className="truncate" title={occ.file_path}>
                          {occ.file_path.split(/[/\\]/).pop()}
                        </span>
                        <span className="flex-shrink-0 ml-2">
                          L{occ.line_number} · {matchTypeLabel(occ.match_type)}
                        </span>
                      </div>
                      {/* Before line — highlight old name in red */}
                      <pre className="text-[11px] font-mono bg-[#1E1E1E] rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {hasMapping && selectedName
                          ? occ.line_content.split(selectedName).map((part, idx, arr) => (
                              <span key={idx}>
                                <span className="text-gray-400">{part}</span>
                                {idx < arr.length - 1 && (
                                  <span className="bg-red-900/50 text-red-300 px-0.5 rounded">{selectedName}</span>
                                )}
                              </span>
                            ))
                          : <span className="text-gray-300">{occ.line_content}</span>
                        }
                      </pre>
                      {/* After line — show only when a new name is mapped */}
                      {hasMapping && (
                        <>
                          <div className="text-[9px] text-gray-600 my-0.5 uppercase tracking-wider">→ after</div>
                          <pre className="text-[11px] font-mono bg-[#1a2e1a] rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap break-all">
                            {afterLine.split(newName).map((part: string, idx: number, arr: string[]) => (
                              <span key={idx}>
                                <span className="text-gray-400">{part}</span>
                                {idx < arr.length - 1 && (
                                  <span className="bg-green-900/50 text-green-300 px-0.5 rounded">{newName}</span>
                                )}
                              </span>
                            ))}
                          </pre>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status */}
      {statusMessage && (
        <div
          className={`h-[30px] flex items-center px-4 text-xs border-t border-[#3C3C3D] flex-shrink-0 ${
            statusType === "success"
              ? "bg-green-900/30 text-green-400"
              : statusType === "error"
              ? "bg-red-900/30 text-red-400"
              : "bg-blue-900/30 text-blue-400"
          }`}
        >
          {statusType === "success" && <Check className="w-3.5 h-3.5 mr-2" />}
          {statusType === "error" && <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
          {statusMessage}
        </div>
      )}
    </div>
  );
}
