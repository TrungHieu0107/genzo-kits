import React from 'react';
import { useXmlFilterStore } from '../store';
import { Search, RotateCcw, Filter } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { query, setQuery, applyFilter, resetFilter, isLoading, files } = useXmlFilterStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  };

  const hasFiles = files.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[0.77rem] font-bold text-gray-500 uppercase tracking-wider mb-1">
        <Filter className="w-3 h-3 text-blue-500/60" />
        Filter Configuration
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.77rem] text-gray-500 font-medium ml-1">Tag Name</label>
          <input
            type="text"
            value={query.tag || ''}
            onChange={(e) => setQuery({ tag: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Batch|Param"
            className="bg-[#1e1e1e] border border-gray-800 rounded px-2.5 py-1.5 text-[0.85rem] text-gray-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.77rem] text-gray-500 font-medium ml-1">Attribute Name</label>
          <input
            type="text"
            value={query.attr_name || ''}
            onChange={(e) => setQuery({ attr_name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. name"
            className="bg-[#1e1e1e] border border-gray-800 rounded px-2.5 py-1.5 text-[0.85rem] text-gray-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.77rem] text-gray-500 font-medium ml-1">Attribute Value</label>
          <input
            type="text"
            value={query.attr_value || ''}
            onChange={(e) => setQuery({ attr_value: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. id|shimeTm"
            className="bg-[#1e1e1e] border border-gray-800 rounded px-2.5 py-1.5 text-[0.85rem] text-gray-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.77rem] text-gray-500 font-medium ml-1">Inner Text</label>
          <input
            type="text"
            value={query.text || ''}
            onChange={(e) => setQuery({ text: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g. value text"
            className="bg-[#1e1e1e] border border-gray-800 rounded px-2.5 py-1.5 text-[0.85rem] text-gray-200 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={applyFilter}
          disabled={isLoading || !hasFiles}
          className="flex items-center gap-2 px-5 py-1.5 bg-[#37373d] hover:bg-[#45454d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-[0.77rem] font-bold transition-all border border-gray-700 active:scale-95 shadow-sm"
        >
          <Search className="w-3 h-3" />
          APPLY FILTER
        </button>
        <button
          onClick={resetFilter}
          disabled={isLoading || !hasFiles}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e] disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-[0.77rem] font-semibold transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          RESET
        </button>
      </div>
    </div>
  );
};
