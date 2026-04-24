import { useState, useRef, useCallback, useMemo } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import React from 'react';

// Components
import { SearchHeader } from './components/SearchHeader';
import { SearchOptions } from './components/SearchOptions';
import { ResultsTable } from './components/ResultsTable';
import { ActionBar } from './components/ActionBar';

// Hooks
import { useFolderSearch } from './hooks/useFolderSearch';

// Stores
import { useAppStore } from '../../store/appStore';
import { useNoteEditorStore } from '../note-editor/store';
import { usePropertyRenamerStore } from '../property-renamer/store';

export default function FolderSearcher() {
  const {
    rootDirs, setRootDirs,
    query, setQuery,
    mode, setMode,
    useRegex, setUseRegex,
    useCache, setUseCache,
    isOptionsCollapsed, setIsOptionsCollapsed,
    results,
    isSearching,
    isRevalidating,
    hasSearched,
    errorMsg,
    isCached,
    handleSearch
  } = useFolderSearch();

  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  
  // Sort state
  const [sortKey, setSortKey] = useState<'name' | 'base_path' | 'modified' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Stores
  const { setActiveTool } = useAppStore();
  const { openFileByPath } = useNoteEditorStore();
  const { addFiles: addToRenamer } = usePropertyRenamerStore();

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<[number, number, number]>([250, 0, 180]);
  const resizingCol = useRef<number | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleResizeStart = useCallback((colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = colIndex;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[colIndex];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (resizingCol.current === null) return;
      const delta = moveEvent.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + delta);
      setColumnWidths(prev => {
        const next: [number, number, number] = [...prev] as [number, number, number];
        next[resizingCol.current!] = newWidth;
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingCol.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  const sortedResults = useMemo(() => {
    if (!sortKey) return results;
    return [...results].sort((a, b) => {
      const valA = (a[sortKey] || '').toString().toLowerCase();
      const valB = (b[sortKey] || '').toString().toLowerCase();
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortKey, sortDir]);

  const handleSort = useCallback((key: 'name' | 'base_path' | 'modified') => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const copyToClipboard = useCallback(async (path: string) => {
    try {
      await writeText(path);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }, []);

  const handleOpenPath = useCallback(async (path: string) => {
    try {
      await invoke('open_path', { path });
    } catch (err) {
      console.error("Failed to open path:", err);
    }
  }, []);

  const handleToggleSelect = useCallback((path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    if (results.length > 0 && selectedPaths.size === results.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(results.map(r => r.path)));
    }
  }, [results, selectedPaths.size]);

  const handleOpenInNoteAction = useCallback(async () => {
    const filesOnly = results.filter(r => selectedPaths.has(r.path) && !r.is_dir);
    if (filesOnly.length === 0) return;

    for (const file of filesOnly) {
      await openFileByPath(file.path, 'UTF-8');
    }
    setActiveTool('note-editor');
  }, [results, selectedPaths, openFileByPath, setActiveTool]);

  const handleAddToRenamerAction = useCallback(() => {
    const paths = Array.from(selectedPaths);
    addToRenamer(paths);
    setActiveTool('property-renamer');
  }, [selectedPaths, addToRenamer, setActiveTool]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-gray-200 font-sans overflow-hidden">
      <SearchHeader />

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-6 w-full relative custom-scrollbar">
        <SearchOptions 
          rootDirs={rootDirs}
          setRootDirs={setRootDirs}
          query={query}
          setQuery={setQuery}
          mode={mode}
          setMode={setMode}
          useRegex={useRegex}
          setUseRegex={setUseRegex}
          useCache={useCache}
          setUseCache={setUseCache}
          isOptionsCollapsed={isOptionsCollapsed}
          setIsOptionsCollapsed={setIsOptionsCollapsed}
          isSearching={isSearching}
          handleSearch={handleSearch}
        />

        <ResultsTable 
          results={sortedResults}
          isSearching={isSearching}
          isRevalidating={isRevalidating}
          isCached={isCached}
          hasSearched={hasSearched}
          errorMsg={errorMsg}
          selectedPaths={selectedPaths}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onOpenPath={handleOpenPath}
          onCopyToClipboard={copyToClipboard}
          copiedPath={copiedPath}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columnWidths={columnWidths}
          onResizeStart={handleResizeStart}
        />
      </div>

      <ActionBar 
        selectedCount={selectedPaths.size}
        onOpenInNote={handleOpenInNoteAction}
        onAddToRenamer={handleAddToRenamerAction}
        onClearSelection={() => setSelectedPaths(new Set())}
      />
    </div>
  );
}
