
import { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';

interface AliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (alias: string) => void;
}

export function AliasModal({ isOpen, onClose, initialValue, onSave }: AliasModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-[450px] bg-[#252526] border border-[#454545] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="h-[50px] flex items-center justify-between px-5 border-b border-[#333] bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-gray-200 uppercase tracking-tight">Set File Alias</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#3c3c3c] rounded-md transition-colors text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Alias Name</label>
            <div className="relative group">
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. Prod Logs, Main Server"
                className="w-full bg-[#1e1e1e] border border-[#333] text-gray-200 px-4 py-3 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">If empty, the original file name will be used.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#2d2d2d] border-t border-[#333] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
          >
             Cancel
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10"
          >
            <Save className="w-3.5 h-3.5" /> SAVE ALIAS
          </button>
        </div>
      </div>
    </div>
  );
}
