import React, { useState } from 'react';
import { useXmlFilterStore } from '../store';
import { Info, Clipboard, Check } from 'lucide-react';
import { buildCsvString } from '../utils/exportCsv';
import { useToastStore } from '../../../components/toastStore';
import { getAllNodesByTag, findNodesRecursive } from '../utils/nodeUtils';

export const ResultSummary: React.FC = () => {
  const { filteredResults, rawNodes, filePath, query } = useXmlFilterStore();
  const { showToast } = useToastStore();
  const [isCopied, setIsCopied] = useState(false);

  if (!filePath) return null;

  const isFilterActive = !!(query.tag || query.attr_name || query.attr_value || query.text);
  
  // As per requirements: use filteredResults if filter active, otherwise rawNodes.
  // We use recursive search because Batch nodes might be nested under a root element (e.g. BatchConfig).
  const nodesToExport = isFilterActive 
    ? getAllNodesByTag(filteredResults, 'Batch')
    : findNodesRecursive(rawNodes, 'Batch');

  const handleCopyCsv = async () => {
    if (nodesToExport.length === 0) return;

    try {
      const csvString = buildCsvString(nodesToExport);
      await navigator.clipboard.writeText(csvString);
      
      setIsCopied(true);
      showToast(`Copied ${nodesToExport.length} Batch nodes to clipboard`, 'success');
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy CSV:', err);
      showToast('Copy failed', 'error');
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-800 text-[10px] text-gray-400 select-none shadow-sm">
      <div className="flex items-center gap-4">
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

      <button
        onClick={handleCopyCsv}
        disabled={nodesToExport.length === 0}
        className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all active:scale-95 border ${
          isCopied 
            ? 'bg-green-600/20 border-green-500/30 text-green-400' 
            : 'bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 disabled:grayscale'
        }`}
      >
        {isCopied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-tight">Copied!</span>
          </>
        ) : (
          <>
            <Clipboard className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-tight">Copy CSV</span>
          </>
        )}
      </button>
    </div>
  );
};
