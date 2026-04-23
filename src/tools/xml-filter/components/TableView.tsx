import React, { useState } from 'react';
import { useXmlFilterStore } from '../store';
import { FilteredResult } from '../types';
import { ChevronDown, ChevronRight, Hash, Tag, Component } from 'lucide-react';

export const TableView: React.FC = () => {
  const { filteredResults } = useXmlFilterStore();

  if (filteredResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 italic text-[11px] select-none">
        No results to display. Try adjusting filters or opening a file.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <table className="w-full border-collapse text-[11px] text-left min-w-[800px]">
        <thead className="sticky top-0 bg-[#252526] shadow-[0_1px_3px_rgba(0,0,0,0.3)] z-10 border-b border-gray-800">
          <tr className="text-gray-500 font-bold uppercase tracking-wider select-none">
            <th className="px-4 py-2.5 w-12 border-r border-gray-800/50 text-center">#</th>
            <th className="px-4 py-2.5 w-40 border-r border-gray-800/50">Tag</th>
            <th className="px-4 py-2.5 w-56 border-r border-gray-800/50">ID / Name</th>
            <th className="px-4 py-2.5 border-r border-gray-800/50">Attributes</th>
            <th className="px-4 py-2.5 w-64">Text Content</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/30">
          {filteredResults.map((result, idx) => (
            <ResultRow key={result.node.id} result={result} index={idx} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResultRow: React.FC<{ result: FilteredResult; index: number }> = ({ result, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { node, matched_by, matched_children } = result;

  const hasChildren = matched_children.length > 0;
  
  const nameAttr = node.attributes.find(a => a.name.toLowerCase() === 'name');
  const idAttr = node.attributes.find(a => a.name.toLowerCase() === 'id');
  const displayId = idAttr?.value || nameAttr?.value || '';

  return (
    <>
      <tr 
        className={`group transition-all ${
          matched_by === 'child' ? 'bg-blue-900/5 border-l-2 border-l-blue-500/30' : 'hover:bg-blue-900/10 border-l-2 border-l-transparent'
        }`}
      >
        <td className="px-4 py-2.5 text-gray-600 font-mono border-r border-gray-800/30 text-center tabular-nums">
          {index + 1}
        </td>
        <td className="px-4 py-2.5 border-r border-gray-800/30">
          <div className="flex items-center gap-2">
            <Tag className={`w-3.5 h-3.5 ${matched_by === 'self' ? 'text-blue-400' : 'text-gray-600'}`} />
            <span className={`font-bold tracking-tight ${matched_by === 'self' ? 'text-blue-400' : 'text-gray-400'}`}>
              {node.tag}
            </span>
            {matched_by === 'child' && (
              <span className="text-[8px] px-1 bg-[#1e1e1e] text-blue-400/50 rounded border border-blue-500/10 font-black uppercase">child</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 border-r border-gray-800/30">
          <div className="flex items-center gap-2 overflow-hidden">
            {displayId ? (
                <>
                    <Hash className="w-3 h-3 text-gray-700 flex-shrink-0" />
                    <span className="text-gray-300 font-mono truncate select-all">{displayId}</span>
                </>
            ) : (
                <span className="text-gray-700 italic">none</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 border-r border-gray-800/30">
          <div className="flex flex-wrap gap-1.5">
            {node.attributes.length > 0 ? node.attributes.map((attr, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#252526] border border-gray-800 rounded text-[9px] text-gray-500 shadow-sm group-hover:border-gray-700 transition-colors">
                <span className="text-blue-400/50 font-bold">{attr.name}</span>
                <span className="mx-1 text-gray-700">=</span>
                <span className="text-gray-300 font-medium">"{attr.value}"</span>
              </span>
            )) : <span className="text-gray-700 italic">no attributes</span>}
          </div>
        </td>
        <td className="px-4 py-2.5 relative">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500 line-clamp-1 italic font-medium tracking-tight">
                {node.text || ''}
            </span>
            {hasChildren && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1 hover:bg-[#37373d] rounded transition-all active:scale-90 ${isExpanded ? 'bg-[#37373d] text-blue-400' : 'text-gray-500'}`}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </td>
      </tr>
      
      {isExpanded && matched_children.length > 0 && (
        <tr>
          <td colSpan={5} className="bg-[#161616] p-0 border-b border-gray-900 shadow-inner overflow-hidden">
            <div className="pl-16 pr-6 py-3 border-l-2 border-blue-600/20 my-1 flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <div className="text-[9px] font-black text-gray-600 uppercase mb-2 flex items-center gap-2 tracking-widest">
                <Component className="w-3 h-3" />
                MATCHED SUB-ELEMENTS ({matched_children.length})
              </div>
              {matched_children.map((childResult) => {
                const childNode = childResult.node;
                return (
                  <div key={childNode.id} className="flex items-center gap-6 py-2 px-3 text-[10px] border-b border-gray-800/40 last:border-0 hover:bg-blue-500/5 rounded-md group/child transition-colors">
                    <div className="flex items-center gap-2 w-36 flex-shrink-0">
                      <Tag className="w-3 h-3 text-blue-500/30 group-hover/child:text-blue-400 transition-colors" />
                      <span className="font-bold text-gray-400 group-hover/child:text-gray-200 transition-colors">{childNode.tag}</span>
                    </div>
                    <div className="flex items-center gap-2 w-48 flex-shrink-0">
                      <Hash className="w-2.5 h-2.5 text-gray-700" />
                      <span className="text-gray-500 font-mono truncate group-hover/child:text-gray-400 transition-colors">
                        {childNode.attributes.find(a => a.name.toLowerCase() === 'name')?.value || 
                         childNode.attributes.find(a => a.name.toLowerCase() === 'id')?.value || '-'}
                      </span>
                    </div>
                    <div className="text-gray-600 italic truncate flex-1 group-hover/child:text-gray-500 transition-colors">
                      {childNode.text || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
