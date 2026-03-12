import { useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen, FileUp, Trash2, Search, Replace, Undo2, Eye, EyeOff,
  Check, X, AlertTriangle, Loader2, FileCode, ScanSearch
} from "lucide-react";
import { usePropertyRenamerStore } from "./store";
import { ScanResult, ScanOccurrence } from "./store";

// ===== Constants =====
const ENCODING_OPTIONS = [
  "UTF-8", "Shift_JIS", "EUC-JP", "windows-1252", "windows-1251",
  "windows-1258", "ISO-8859-1", "UTF-16LE", "UTF-16BE", "GBK", "Big5", "EUC-KR"
];

// ===== Types =====
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
  const {
    files, setFiles, addFiles, removeFile, toggleFileCheck, updateFileEncoding,
    scanResults, setScanResults,
    mappings, setMappings, updateMapping,
    selectedName, setSelectedName,
    showPreview, setShowPreview,
    isScanning, setIsScanning,
    isReplacing, setIsReplacing,
    isUndoing, setIsUndoing,
    statusMessage, setStatus, statusType,
    filter, setFilter,
    scanSourcePath, setScanSourcePath,
    clearResults
  } = usePropertyRenamerStore();

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
        addFiles(paths);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  }, [addFiles]);

  const handleAddFolder = useCallback(async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        setStatus("Collecting files...", "info");
        const foundPaths: string[] = await invoke("collect_files", { root: selected });
        addFiles(foundPaths);
        setStatus(`Found ${foundPaths.length} files.`, "success");
      }
    } catch (err) {
      console.error("Failed to open folder dialog:", err);
    }
  }, [addFiles, setStatus]);

  const toggleAll = useCallback((checked: boolean) => {
    setFiles(files.map(f => ({ ...f, checked })));
  }, [files, setFiles]);

  const clearFilesAction = useCallback(() => {
    setFiles([]);
    clearResults();
    setStatus(null, "info");
    setScanSourcePath(null);
  }, [setFiles, clearResults, setStatus, setScanSourcePath]);

  // ===== Scan =====
  const handleScan = useCallback(async () => {
    if (!scanSourcePath) {
      setStatus("Please designate a scan source file (click the ◎ icon).", "error");
      return;
    }
    setIsScanning(true);
    setStatus("Scanning scan source file...", "info");
    try {
      const results: ScanResult[] = await invoke("scan_files", { paths: [scanSourcePath] });
      setScanResults(results);
      const newMappings: Record<string, string> = {};
      for (const r of results) {
        newMappings[r.old_name] = mappings[r.old_name] || "";
      }
      setMappings(newMappings);
      const srcName = scanSourcePath.split(/[/\\]/).pop() || scanSourcePath;
      setStatus(`Found ${results.length} unique names from "${srcName}". Replace applies to all ${checkedPaths.length} checked files.`, "success");
    } catch (err) {
      setStatus(`Scan error: ${err}`, "error");
    } finally {
      setIsScanning(false);
    }
  }, [scanSourcePath, checkedPaths.length, mappings, setScanResults, setMappings, setStatus, setIsScanning]);

  // ===== Replace =====
  const handleReplace = useCallback(async () => {
    const validMappings = Object.entries(mappings)
      .filter(([_, v]) => v.trim() !== "")
      .map(([oldName, newName]) => ({ old_name: oldName, new_name: newName }));

    if (validMappings.length === 0) {
      setStatus("No mappings to apply. Fill in 'New Name' fields first.", "error");
      return;
    }

    setIsReplacing(true);
    setStatus("Replacing...", "info");
    try {
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
      setStatus(msg, result.errors.length > 0 ? "error" : "success");
    } catch (err) {
      setStatus(`Replace error: ${err}`, "error");
    } finally {
      setIsReplacing(false);
    }
  }, [mappings, checkedPaths, files, setStatus, setIsReplacing]);

  // ===== Undo =====
  const handleUndo = useCallback(async () => {
    setIsUndoing(true);
    setStatus("Undoing...", "info");
    try {
      const result: UndoResult = await invoke("undo_last_replace", { paths: checkedPaths });
      setStatus(`Restored ${result.files_restored} files.`, "success");
    } catch (err) {
      setStatus(`Undo error: ${err}`, "error");
    } finally {
      setIsUndoing(false);
    }
  }, [checkedPaths, setStatus, setIsUndoing]);

  const uniqueFileCount = (occs: ScanOccurrence[]) =>
    new Set(occs.map(o => o.file_path)).size;

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-[40px] bg-[#252526] border-b border-[#3C3C3D] flex items-center justify-between px-4 flex-shrink-0 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-gray-300 font-bold tracking-wider uppercase flex items-center gap-2">
            <Replace className="w-4 h-4 text-teal-400" /> Genzo Property Renamer
          </span>
          <span className="text-gray-500">
            {files.length} Files · {scanResults.length} Results · {pendingCount} Mappings
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

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: File Panel */}
        <div className="w-[300px] flex-shrink-0 bg-[#252526] border-r border-[#3C3C3D] flex flex-col">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[#3C3C3D]">
            <span className="text-[11px] font-bold uppercase text-gray-400">Target Files</span>
            <div className="flex items-center gap-1">
              <button onClick={handleAddFiles} className="p-1 hover:bg-[#3C3C3D] rounded" title="Add Files">
                <FileUp className="w-3.5 h-3.5 text-blue-400" />
              </button>
              <button onClick={handleAddFolder} className="p-1 hover:bg-[#3C3C3D] rounded" title="Add Folder">
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
              </button>
              <button onClick={clearFilesAction} className="p-1 hover:bg-[#3C3C3D] rounded" title="Clear List">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="px-3 py-1 flex items-center gap-2 text-[10px] text-gray-500 border-b border-[#3C3C3D]">
              <button onClick={() => toggleAll(true)} className="hover:text-gray-300">Select All</button>
              <span>|</span>
              <button onClick={() => toggleAll(false)} className="hover:text-gray-300">Deselect All</button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs gap-2 px-4 text-center">
                <FileCode className="w-8 h-8 opacity-30" />
                <span>Add source files to refactor</span>
              </div>
            ) : (
              files.map((file) => {
                const isScanSource = scanSourcePath === file.path;
                return (
                  <div
                    key={file.path}
                    className={`flex items-center gap-1 px-2 py-1.5 hover:bg-[#2A2D2E] text-[12px] ${isScanSource ? "bg-[#1a2e3a] border-l-2 border-teal-500" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={file.checked}
                      onChange={() => toggleFileCheck(file.path)}
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
                      onClick={() => toggleFileCheck(file.path)}
                    >
                      {file.name}
                    </span>
                    <select
                      value={file.encoding}
                      onChange={(e) => updateFileEncoding(file.path, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent text-[10px] text-gray-500 border border-[#3C3C3D] rounded px-0.5 py-0.5 outline-none cursor-pointer hover:border-gray-500 flex-shrink-0 max-w-[80px]"
                    >
                      {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
                    </select>
                    <button
                      onClick={() => {
                        if (isScanSource) setScanSourcePath(null);
                        removeFile(file.path);
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
              {isScanning ? "Scanning..." : scanSourcePath ? "Scan Source File" : "Select Scan Source"}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 flex items-center gap-3 border-b border-[#3C3C3D] bg-[#252526]">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by property name"
                className="w-full bg-[#3C3C3D] text-gray-200 text-xs pl-7 pr-3 py-1.5 rounded outline-none border border-transparent focus:border-teal-500"
              />
            </div>
            <button
              onClick={handleReplace}
              disabled={isReplacing || pendingCount === 0}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded transition"
            >
              {isReplacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Replace className="w-3.5 h-3.5" />}
              {isReplacing ? "Applying..." : "Apply Renames"}
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
                    <th className="text-left px-4 py-2 font-semibold w-[30%]">Original Name</th>
                    <th className="text-left px-4 py-2 font-semibold w-[30%]">Rename To</th>
                    <th className="text-center px-4 py-2 font-semibold w-[15%]">Occurrences</th>
                    <th className="text-center px-4 py-2 font-semibold w-[10%]">Files</th>
                    <th className="text-center px-4 py-2 font-semibold w-[15%]">Contexts</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => (
                    <tr
                      key={result.old_name}
                      className={`border-b border-[#3C3C3D] hover:bg-[#2A2D2E] ${selectedName === result.old_name ? "bg-[#37373D]" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <button
                          onClick={() => { setSelectedName(result.old_name); setShowPreview(true); }}
                          className="text-teal-400 hover:underline font-mono text-left"
                        >
                          {result.old_name}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={mappings[result.old_name] || ""}
                          onChange={(e) => updateMapping(result.old_name, e.target.value)}
                          placeholder="Enter new name..."
                          className="w-full bg-[#3C3C3D] text-gray-200 font-mono px-2 py-1 rounded outline-none border border-transparent focus:border-teal-500 text-xs"
                        />
                      </td>
                      <td className="text-center px-4 py-2">
                        <button
                          onClick={() => { setSelectedName(result.old_name); setShowPreview(true); }}
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
                          {[...new Set(result.occurrences.map(o => o.match_type))].map(t => (
                            <span key={t} className="bg-[#3C3C3D] text-gray-400 px-1.5 py-0.5 rounded text-[10px]">
                              {matchTypeLabel(t)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showPreview && (
          <div className="w-[350px] flex-shrink-0 bg-[#252526] border-l border-[#3C3C3D] flex flex-col">
            <div className="px-3 py-2 flex items-center justify-between border-b border-[#3C3C3D]">
              <span className="text-[11px] font-bold uppercase text-gray-400 truncate pr-2">
                Preview: <span className="text-teal-400 font-mono normal-case">{selectedName || "—"}</span>
              </span>
              <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-[#3C3C3D] rounded border border-transparent hover:border-[#555]">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedOccurrences.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs text-center px-4">
                  Click a name in the table to preview occurrences
                </div>
              ) : (
                selectedOccurrences.map((occ, i) => {
                  const newName = selectedName ? (mappings[selectedName] || "").trim() : "";
                  const hasMapping = newName !== "";
                  const afterLine = hasMapping && selectedName
                    ? occ.line_content.split(selectedName).join(newName)
                    : occ.line_content;

                  return (
                    <div key={i} className="border-b border-[#3C3C3D] px-3 py-2">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span className="truncate" title={occ.file_path}>{occ.file_path.split(/[/\\]/).pop()}</span>
                        <span className="flex-shrink-0 ml-2">L{occ.line_number} · {matchTypeLabel(occ.match_type)}</span>
                      </div>
                      <pre className="text-[11px] font-mono bg-[#1E1E1E] rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap break-all">
                        {hasMapping && selectedName
                          ? occ.line_content.split(selectedName).map((part, idx, arr) => (
                              <span key={idx}>
                                <span className="text-gray-400">{part}</span>
                                {idx < arr.length - 1 && <span className="bg-red-900/50 text-red-300 px-0.5 rounded">{selectedName}</span>}
                              </span>
                            ))
                          : <span className="text-gray-300">{occ.line_content}</span>
                        }
                      </pre>
                      {hasMapping && (
                        <>
                          <div className="text-[9px] text-gray-600 my-0.5 uppercase tracking-wider">→ Preview Replacement</div>
                          <pre className="text-[11px] font-mono bg-[#1a2e1a] rounded px-2 py-1 overflow-x-auto whitespace-pre-wrap break-all">
                            {afterLine.split(newName).map((part: string, idx: number, arr: string[]) => (
                              <span key={idx}>
                                <span className="text-gray-400">{part}</span>
                                {idx < arr.length - 1 && <span className="bg-green-900/50 text-green-300 px-0.5 rounded">{newName}</span>}
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

      {statusMessage && (
        <div className={`h-[30px] flex items-center px-4 text-xs border-t border-[#3C3C3D] flex-shrink-0 ${
          statusType === "success" ? "bg-green-900/30 text-green-400" :
          statusType === "error" ? "bg-red-900/30 text-red-400" : "bg-blue-900/30 text-blue-400"
        }`}>
          {statusType === "success" && <Check className="w-3.5 h-3.5 mr-2" />}
          {statusType === "error" && <AlertTriangle className="w-3.5 h-3.5 mr-2" />}
          {statusMessage}
        </div>
      )}
    </div>
  );
}
