import { useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { usePropertyRenamerStore, ScanResult } from "../store";

interface ReplaceResult {
  files_modified: number;
  total_replacements: number;
  errors: string[];
}

interface UndoResult {
  files_restored: number;
}

export function usePropertyRenamer() {
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
      setStatus(`Found ${results.length} unique names from "${srcName}".`, "success");
    } catch (err) {
      setStatus(`Scan error: ${err}`, "error");
    } finally {
      setIsScanning(false);
    }
  }, [scanSourcePath, mappings, setScanResults, setMappings, setStatus, setIsScanning]);

  const handleReplace = useCallback(async () => {
    const validMappings = Object.entries(mappings)
      .filter(([_, v]) => v.trim() !== "")
      .map(([oldName, newName]) => ({ old_name: oldName, new_name: newName }));

    if (validMappings.length === 0) {
      setStatus("No mappings to apply.", "error");
      return;
    }

    setIsReplacing(true);
    setStatus("Replacing...", "info");
    try {
      const encodingsMap: Record<string, string> = {};
      for (const f of files) {
        if (f.checked) encodingsMap[f.path] = f.encoding;
      }
      const result = await invoke<ReplaceResult>("replace_in_files", {
        mappings: validMappings,
        paths: checkedPaths,
        encodings: encodingsMap,
      });
      let msg = `✅ Modified ${result.files_modified} files, ${result.total_replacements} replacements.`;
      setStatus(msg, result.errors.length > 0 ? "error" : "success");
    } catch (err) {
      setStatus(`Replace error: ${err}`, "error");
    } finally {
      setIsReplacing(false);
    }
  }, [mappings, checkedPaths, files, setStatus, setIsReplacing]);

  const handleUndo = useCallback(async () => {
    setIsUndoing(true);
    setStatus("Undoing...", "info");
    try {
      const result = await invoke<UndoResult>("undo_last_replace", { paths: checkedPaths });
      setStatus(`Restored ${result.files_restored} files.`, "success");
    } catch (err) {
      setStatus(`Undo error: ${err}`, "error");
    } finally {
      setIsUndoing(false);
    }
  }, [checkedPaths, setStatus, setIsUndoing]);

  const clearFilesAction = useCallback(() => {
    setFiles([]);
    clearResults();
    setStatus(null, "info");
    setScanSourcePath(null);
  }, [setFiles, clearResults, setStatus, setScanSourcePath]);

  return {
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
    clearResults,
    checkedPaths,
    filteredResults,
    pendingCount,
    selectedOccurrences,
    handleAddFiles,
    handleAddFolder,
    handleScan,
    handleReplace,
    handleUndo,
    clearFilesAction
  };
}
