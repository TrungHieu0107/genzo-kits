import { FolderSearch } from 'lucide-react';
import { motion } from 'framer-motion';

export function SearchHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[48px] min-h-[48px] bg-[#252526]/80 backdrop-blur-xl border-b border-[#333] flex items-center px-4 justify-between shadow-sm z-10"
    >
      <div className="flex items-center gap-2">
        <FolderSearch className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-bold text-gray-200 tracking-wide uppercase">Genzo Folder Searcher</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Search Mode</span>
          <span className="text-[9px] text-gray-500 italic">Select target directories below</span>
        </div>
      </div>
    </motion.div>
  );
}
