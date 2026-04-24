import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useXmlFilterStore } from '../store';
import { FolderOpen, ChevronDown, ChevronUp, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FileLoader: React.FC = () => {
  const { files, addFile, removeFile, updateFileEncoding, isLoading } = useXmlFilterStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddFile = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: 'XML', extensions: ['xml'] }]
    });
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      for (const path of paths) {
        await addFile(path, 'UTF-8');
      }
    }
  };

  const encodings: Array<'UTF-8' | 'Shift_JIS'> = ['UTF-8', 'Shift_JIS'];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleAddFile}
          disabled={isLoading}
          className="group flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-[0.85rem] font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 whitespace-nowrap"
        >
          <FolderOpen className="w-4 h-4 group-hover:rotate-6 transition-transform" />
          ADD XML FILE
        </button>

        {files.length > 0 && (
          <div 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] border border-gray-800 rounded-md cursor-pointer hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[0.77rem] font-black rounded-full shadow-lg shadow-blue-900/20">
                {files.length}
              </span>
              <span className="text-[0.77rem] text-gray-400 font-bold group-hover:text-blue-400">
                Files Selected
              </span>
            </div>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && files.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 p-2 bg-[#0d0d0d] border border-gray-800/50 rounded-lg max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
              {files.map((file) => (
                <div 
                  key={file.path}
                  className="flex items-center justify-between gap-4 p-2 bg-[#141414] border border-gray-800/30 rounded-md hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-blue-500/50 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[0.77rem] text-gray-200 font-bold truncate">{file.name}</span>
                      <span className="text-[0.62rem] text-gray-500 font-mono truncate opacity-60">{file.path}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex p-0.5 bg-[#0a0a0a] rounded-md border border-gray-800/50 scale-90">
                      {encodings.map((enc) => (
                        <button
                          key={enc}
                          onClick={() => updateFileEncoding(file.path, enc)}
                          className={`relative px-2 py-1 text-[0.62rem] font-black tracking-widest uppercase transition-all ${
                            file.encoding === enc ? 'text-white' : 'text-gray-500 hover:text-gray-400'
                          }`}
                        >
                          <span className="relative z-10">{enc}</span>
                          {file.encoding === enc && (
                            <motion.div
                              layoutId={`active-enc-${file.path}`}
                              className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-[3px]"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => removeFile(file.path)}
                      className="p-1.5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
