import React from 'react';
import { useXmlFilterStore } from './store';
import { FileLoader } from './components/FileLoader';
import { FilterBar } from './components/FilterBar';
import { ResultSummary } from './components/ResultSummary';
import { TableView } from './components/TableView';
import { TreeView } from './components/TreeView';
import { LayoutList, TreePine, FileCode } from 'lucide-react';

export const XmlFilterTool: React.FC = () => {
  const { viewMode, setViewMode, isLoading, error } = useXmlFilterStore();

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-[#252526]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-600/20 rounded-lg">
            <FileCode className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-gray-100">Genzo XML Filter</h1>
            <p className="text-[10px] text-gray-400">Shift_JIS Support • Tree & Table View</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-[#1e1e1e] p-0.5 rounded-lg border border-gray-800">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
              viewMode === 'table' 
                ? 'bg-[#37373d] text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <LayoutList className="w-3 h-3" />
              Table View
            </div>
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${
              viewMode === 'tree' 
                ? 'bg-[#37373d] text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2a2d2e]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <TreePine className="w-3 h-3" />
              Tree View
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 space-y-3 bg-[#252526] border-b border-gray-800">
          <FileLoader />
          <FilterBar />
        </div>

        <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 z-20 bg-[#1e1e1e]/90">
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg max-w-md text-center shadow-xl">
                <p className="text-red-400 text-sm font-medium">Error Loading XML</p>
                <p className="text-red-300/80 text-xs mt-1 font-mono">{error}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#1e1e1e]/40 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">PROCESSING XML...</span>
              </div>
            </div>
          )}

          <div className="h-full flex flex-col">
            <ResultSummary />
            <div className="flex-1 overflow-hidden">
              {viewMode === 'table' ? <TableView /> : <TreeView />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
