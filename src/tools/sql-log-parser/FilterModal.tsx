
import { useState } from 'react';
import { X, Plus, Search, Database, Clock } from 'lucide-react';
import { useSqlLogStore, SqlFilter } from './store';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterModal({ isOpen, onClose }: FilterModalProps) {
  const { addFilter } = useSqlLogStore();
  const [type, setType] = useState<SqlFilter['type']>('query');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (value.trim()) {
      addFilter(type, value.trim());
      setValue('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
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
            <Search className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-gray-200 uppercase tracking-tight">Add SQL Filter</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#3c3c3c] rounded-md transition-colors text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Filter Type</label>
            <div className="flex gap-2">
              {[
                { id: 'query', label: 'Query', icon: Database },
                { id: 'dao', label: 'DAO Name', icon: Search },
                { id: 'time', label: 'Timestamp', icon: Clock }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as SqlFilter['type'])}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all text-xs font-medium ${
                    type === t.id 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm' 
                    : 'bg-[#1e1e1e] border-[#333] text-gray-400 hover:border-[#444] hover:text-gray-300'
                  }`}
                >
                  <t.icon className={`w-3.5 h-3.5 ${type === t.id ? 'text-blue-400' : 'text-gray-500'}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Value to Filter</label>
            <div className="relative group">
              <input
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Search ${type === 'query' ? 'SQL content...' : type === 'dao' ? 'DAO name...' : 'time (e.g. 21:44:08)'}`}
                className="w-full bg-[#1e1e1e] border border-[#333] text-gray-200 px-4 py-3 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
              />
            </div>
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
            onClick={handleAdd}
            disabled={!value.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10"
          >
            <Plus className="w-3.5 h-3.5" /> ADD FILTER
          </button>
        </div>
      </div>
    </div>
  );
}
