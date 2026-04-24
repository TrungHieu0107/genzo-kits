import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useXmlFilterStore } from '../store';
import { FileUp, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export const FileLoader: React.FC = () => {
  const { filePath, loadFile, isLoading, encoding, setEncoding } = useXmlFilterStore();

  const handleOpenFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'XML', extensions: ['xml'] }]
    });
    if (selected && typeof selected === 'string') {
      await loadFile(selected);
    }
  };

  const encodings: Array<'UTF-8' | 'Shift_JIS'> = ['UTF-8', 'Shift_JIS'];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 p-1 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-2xl">
        <button
          onClick={handleOpenFile}
          disabled={isLoading}
          className="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-[11px] font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <FolderOpen className="w-4 h-4 group-hover:rotate-6 transition-transform" />
          OPEN XML
        </button>

        <div className="w-[1px] h-5 bg-gray-800/50 mx-1" />

        <div className="flex p-0.5 bg-[#0a0a0a] rounded-md border border-gray-800/50">
          {encodings.map((enc) => (
            <button
              key={enc}
              onClick={() => setEncoding(enc)}
              disabled={isLoading}
              className={`relative px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-colors duration-300 ${
                encoding === enc ? 'text-white' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <span className="relative z-10">{enc}</span>
              {encoding === enc && (
                <motion.div
                  layoutId="active-enc"
                  className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-[4px]"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {filePath && (
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[10px] text-blue-400/70 font-mono shadow-inner group overflow-hidden max-w-xl transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
            <FileUp className="w-4 h-4 opacity-50" />
          </div>
          <span className="truncate group-hover:text-blue-300 transition-colors">{filePath}</span>
        </div>
      )}
    </div>
  );
};
