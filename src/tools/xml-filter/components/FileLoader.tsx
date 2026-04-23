import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useXmlFilterStore } from '../store';
import { FileUp, FolderOpen } from 'lucide-react';

export const FileLoader: React.FC = () => {
  const { filePath, loadFile, isLoading } = useXmlFilterStore();

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'XML', extensions: ['xml'] }]
    });
    if (selected && typeof selected === 'string') {
      await loadFile(selected);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleOpenFile}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-[11px] font-semibold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        SELECT XML FILE
      </button>
      
      {filePath && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] border border-gray-800 rounded-md text-[10px] text-gray-400 font-mono truncate max-w-lg shadow-inner">
          <FileUp className="w-3.5 h-3.5 text-blue-500/50 flex-shrink-0" />
          <span className="truncate">{filePath}</span>
        </div>
      )}
    </div>
  );
};
