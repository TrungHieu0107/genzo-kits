import React, { useState } from 'react';
import { useXmlFilterStore } from '../store';
import { FilteredResult } from '../types';
import { ChevronDown, ChevronRight, Tag, Hash } from 'lucide-react';

export const TreeView: React.FC = () => {
  const { filteredResults, query } = useXmlFilterStore();

  const isFiltering = !!(query.tag || query.attr_name || query.attr_value || query.text);

  if (filteredResults.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 italic text-[0.85rem] select-none">
        {isFiltering ? "No matches found." : "No XML data loaded."}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto h-full p-4 font-mono text-[0.85rem] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <div className="space-y-0.5">
        {filteredResults.map(result => (
          <TreeNode 
            key={result.node.id} 
            result={result} 
            depth={0} 
            isFiltering={isFiltering}
          />
        ))}
      </div>
    </div>
  );
};

const TreeNode: React.FC<{ result: FilteredResult; depth: number; isFiltering: boolean }> = ({ result, depth, isFiltering }) => {
  const { node, matched_by, matched_children } = result;
  const [isExpanded, setIsExpanded] = useState(isFiltering); // Default expanded when filtering
  const hasChildren = matched_children.length > 0;

  const nameAttr = node.attributes.find(a => a.name.toLowerCase() === 'name');
  const idAttr = node.attributes.find(a => a.name.toLowerCase() === 'id');
  const displayId = idAttr?.value || nameAttr?.value || '';

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-1.5 py-1 px-2 rounded-md transition-all group cursor-default select-none ${
          matched_by === 'self' && isFiltering ? 'bg-blue-600/20 border border-blue-500/30' : 
          matched_by === 'child' && isFiltering ? 'bg-blue-600/5' : 'hover:bg-gray-800/40'
        }`}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center justify-center w-4 h-4">
          {hasChildren && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-gray-700 rounded text-gray-500 transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
        </div>

        <Tag className={`w-3.5 h-3.5 flex-shrink-0 ${matched_by === 'self' && isFiltering ? 'text-blue-400' : 'text-gray-600'}`} />
        
        <span className={`font-bold tracking-tight ${
          matched_by === 'self' && isFiltering ? 'text-blue-400' : 
          matched_by === 'child' && isFiltering ? 'text-blue-300/70' : 'text-gray-400'
        }`}>
          {node.tag}
        </span>

        {displayId && (
          <span className="text-[0.77rem] text-gray-500 font-mono flex items-center gap-1 bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-gray-800/50 shadow-sm">
             <Hash className="w-2.5 h-2.5 text-gray-700" />
             <span className="text-blue-400/60 font-bold">{displayId}</span>
          </span>
        )}

        <div className="flex gap-2 overflow-hidden opacity-30 group-hover:opacity-100 transition-opacity">
          {node.attributes.filter(a => a.name.toLowerCase() !== 'name' && a.name.toLowerCase() !== 'id').map((attr, i) => (
            <span key={i} className="text-[0.7rem] text-gray-600 truncate bg-gray-900/50 px-1 rounded">
               <span className="text-gray-500">{attr.name}=</span>
               <span className="text-gray-400">"{attr.value}"</span>
            </span>
          ))}
        </div>

        {node.text && (
          <span className="text-[0.77rem] text-gray-600 italic truncate max-w-sm ml-2 border-l border-gray-800 pl-2">
            {node.text}
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {matched_children.map(childResult => (
            <TreeNode 
              key={childResult.node.id} 
              result={childResult} 
              depth={depth + 1} 
              isFiltering={isFiltering}
            />
          ))}
        </div>
      )}
    </div>
  );
};
