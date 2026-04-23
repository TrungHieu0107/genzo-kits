import { useState, useEffect, useCallback, useMemo } from 'react';
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useSqlLogStore } from '../store';
import { useConfigStore } from '../../../components/configStore';

export function useSqlLogParser() {
  const { encoding, updateConfig } = useConfigStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSql, setSelectedSql] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileIndex: number } | null>(null);
  const [aliasModalProps, setAliasModalProps] = useState({ isOpen: false, index: 0, initialValue: '' });

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isReloading, setIsReloading] = useState(false);

  const { 
    files, activeFileIndex,
    addFile, removeFile, selectFile, updateFileContent, loadFiles, clear,
    filters, removeFilter, clearFilters, setFileAlias
  } = useSqlLogStore();

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const activeFile = activeFileIndex !== null ? files[activeFileIndex] : null;

  const sqlLogs = useMemo(() => {
    if (!activeFile) return [];
    return activeFile.sessions.flatMap(
      sess => sess.logs.filter(l => l.type === 'sql' && l.reconstructedSql).map(l => ({ ...l, daoName: sess.daoName }))
    ).sort((a, b) => sortOrder === 'asc' ? a.logIndex - b.logIndex : b.logIndex - a.logIndex)
     .filter(log => {
        if (filters.length === 0) return true;
        return filters.every(f => {
          let textValue = '';
          if (f.type === 'query') textValue = log.reconstructedSql || '';
          if (f.type === 'dao') textValue = log.daoName;
          if (f.type === 'time') textValue = log.timestamp || '';

          const target = textValue.toLowerCase();
          const search = f.value.toLowerCase();

          switch (f.operator) {
            case 'equals': return target === search;
            case 'not_equals': return target !== search;
            case 'greater_than': return f.type === 'time' ? target > search : target.localeCompare(search) > 0;
            case 'less_than': return f.type === 'time' ? target < search : target.localeCompare(search) < 0;
            case 'not_contains': return !target.includes(search);
            case 'contains':
            default: return target.includes(search);
          }
        });
     });
  }, [activeFile, sortOrder, filters]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
      });
      if (typeof selected === 'string') {
        const response: { content: string | null; is_binary: boolean; error: string | null } = 
          await invoke('read_file_encoded', { path: selected, encoding: encoding });
        
        if (response.error) {
          console.error("Error reading log file:", response.error);
          return;
        }
        
        if (response.content) {
          const name = selected.split(/[/\\]/).pop() || selected;
          addFile(selected, name, response.content, encoding);
        }
      }
    } catch (err) {
      console.error("Failed to open log file:", err);
    }
  };

  const handleEncodingChange = async (newEncoding: string) => {
    updateConfig({ encoding: newEncoding });
    if (activeFile && activeFileIndex !== null) {
      try {
        const response: { content: string | null; is_binary: boolean; error: string | null } = 
          await invoke('read_file_encoded', { path: activeFile.path, encoding: newEncoding });
        
        if (response.error) {
          console.error("Error reloading log file:", response.error);
          return;
        }
        
        if (response.content) {
          updateFileContent(activeFileIndex, response.content, newEncoding);
        }
      } catch (err) {
        console.error("Failed to reload log file:", err);
      }
    }
  };

  const handleReload = async () => {
    if (!activeFile || activeFileIndex === null || isReloading) return;
    setIsReloading(true);
    try {
      const response: { content: string | null; is_binary: boolean; error: string | null } = 
        await invoke('read_file_encoded', { path: activeFile.path, encoding: activeFile.encoding });
      
      if (response.error) {
        console.error("Error reloading log file:", response.error);
        setIsReloading(false);
        return;
      }
      
      if (response.content) {
        updateFileContent(activeFileIndex, response.content, activeFile.encoding);
      }
      setTimeout(() => setIsReloading(false), 600);
    } catch (err) {
      console.error("Failed to reload log file:", err);
      setIsReloading(false);
    }
  };

  return {
    encoding,
    copiedId,
    selectedSql, setSelectedSql,
    isModalOpen, setIsModalOpen,
    isFilterModalOpen, setIsFilterModalOpen,
    contextMenu, setContextMenu,
    aliasModalProps, setAliasModalProps,
    sidebarWidth, setSidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isDragging, setIsDragging,
    sortOrder, setSortOrder,
    isReloading,
    files, activeFileIndex,
    addFile, removeFile, selectFile, clear,
    filters, removeFilter, clearFilters, setFileAlias,
    activeFile,
    sqlLogs,
    handleCopy,
    handleOpenFile,
    handleEncodingChange,
    handleReload
  };
}
