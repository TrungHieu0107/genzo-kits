import { FileText, Replace, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionBarProps {
  selectedCount: number;
  onOpenInNote: () => void;
  onAddToRenamer: () => void;
  onClearSelection: () => void;
}

export function ActionBar({
  selectedCount,
  onOpenInNote,
  onAddToRenamer,
  onClearSelection
}: ActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-8 left-1/2 flex items-center gap-4 bg-[#2d2d2d]/90 backdrop-blur-xl border border-emerald-500/50 rounded-full px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-[100]"
        >
          <div className="flex items-center gap-2 pr-4 border-r border-[#444]">
            <motion.span 
              key={selectedCount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-emerald-500 text-black text-[0.77rem] font-bold px-2 py-0.5 rounded-full"
            >
              {selectedCount}
            </motion.span>
            <span className="text-xs font-medium text-gray-300">Selected Items</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onOpenInNote} 
              className="flex items-center gap-2 hover:bg-[#3c3c3c] px-3 py-1.5 rounded-lg text-xs font-bold text-blue-400 transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" /> Open in Note Editor
            </button>
            <button 
              onClick={onAddToRenamer} 
              className="flex items-center gap-2 hover:bg-[#3c3c3c] px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 transition-all active:scale-95"
            >
              <Replace className="w-4 h-4" /> Add to Property Renamer
            </button>
            <button 
              onClick={onClearSelection} 
              className="ml-2 p-1.5 hover:bg-gray-700/50 rounded-full text-gray-500 transition-colors" 
              title="Clear Selection"
            >
              <Trash2 className="w-4 h-4 hover:text-red-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
