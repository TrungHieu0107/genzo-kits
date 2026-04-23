import React from 'react';
import { useXmlFilterStore } from '../store';
import { Info } from 'lucide-react';

export const ResultSummary: React.FC = () => {
  const { filteredResults, rawNodes, filePath } = useXmlFilterStore();

  if (!filePath) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[#2d2d2d] border-b border-gray-800 text-[10px] text-gray-400 select-none shadow-sm">
      <div className="flex items-center gap-1.5">
        <Info className="w-3 h-3 text-blue-400/70" />
        <span className="font-bold text-gray-500 tracking-tighter">SUMMARY</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/10">
          <span className="text-blue-400 font-black tabular-nums">
            {filteredResults.length}
          </span>
          <span className="text-blue-400/60 font-medium">matches</span>
        </div>

        <div className="h-3 w-[1px] bg-gray-700 mx-1" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-300 font-bold tabular-nums">{rawNodes.length}</span>
          <span className="text-gray-500 font-medium">root elements</span>
        </div>
      </div>
    </div>
  );
};
