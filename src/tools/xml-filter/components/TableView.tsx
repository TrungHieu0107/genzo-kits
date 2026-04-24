import React, { useMemo, useState } from 'react';
import { useXmlFilterStore } from '../store';
import { getAllNodesByTag, getUniqueParamNames } from '../utils/nodeUtils';
import { Tag, Hash, Box, Settings, ChevronDown, ChevronRight, Component } from 'lucide-react';
import { FilteredResult } from '../types';
import { fs } from '../../../hooks/useFontSize';
import { TableSkeleton } from './LoadingSystem';

export const TableView: React.FC = () => {
  const { filteredResults, isLoading } = useXmlFilterStore();

  const batchNodes = useMemo(() => getAllNodesByTag(filteredResults, 'Batch'), [filteredResults]);
  const paramNames = useMemo(() => getUniqueParamNames(batchNodes), [batchNodes]);

  if (isLoading && filteredResults.length === 0) {
    return <TableSkeleton />;
  }

  if (filteredResults.length === 0) {
    return (
      <div style={fs.caption} className="h-full flex items-center justify-center text-gray-600 italic select-none">
        No results to display. Try adjusting filters or opening a file.
      </div>
    );
  }

  // If we have Batch nodes, show the CSV-style table
  if (batchNodes.length > 0) {
    const fixedHeaders = [
      { id: 'Batch_id', label: 'Batch ID', icon: Hash, width: 'w-[180px]', left: 'left-[48px]' },
      { id: 'Batch_name', label: 'Batch Name', icon: Tag, width: 'w-[250px]', left: 'left-[228px]' },
      { id: 'Batch_class', label: 'Class', icon: Box, width: 'w-[300px]', left: 'left-[478px]' },
      { id: 'Batch_beanclass', label: 'Bean Class', icon: Settings, width: 'w-[300px]' },
    ];

    return (
      <div className="flex-1 overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        <table style={fs.caption} className="w-full border-separate border-spacing-0 text-left table-fixed">
          <thead className="sticky top-0 bg-[#252526] shadow-[0_1px_3px_rgba(0,0,0,0.3)] z-20 border-b border-gray-800">
            <tr className="text-gray-500 font-bold tracking-wider select-none whitespace-nowrap">
              <th className="px-4 py-2.5 w-[48px] border-r border-gray-800 text-center sticky left-0 bg-[#252526] z-30 shadow-[2px_0_0_rgba(0,0,0,0.3)]">#</th>
              {fixedHeaders.map((h, i) => (
                <th 
                  key={h.id} 
                  className={`px-4 py-2.5 border-r border-gray-800/50 ${h.width} ${i < 3 ? `sticky ${h.left} bg-[#252526] z-30 ${i === 2 ? 'shadow-[2px_0_0_rgba(0,0,0,0.3)]' : ''}` : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <h.icon className="w-3 h-3 opacity-50" />
                    <span className="truncate">{h.id}</span>
                  </div>
                </th>
              ))}
              {paramNames.map(name => (
                <th key={name} className="px-4 py-2.5 border-r border-gray-800/50 w-[250px]">
                  <div className="flex items-center gap-2">
                    <Settings className="w-3 h-3 opacity-30 text-blue-400" />
                    <span className="truncate">Param_{name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/30">
            {batchNodes.map((node, idx) => (
              <tr key={node.id} className="hover:bg-blue-900/10 transition-colors group">
                <td className="px-4 py-2 w-[48px] text-gray-600 font-mono border-r border-gray-800/50 text-center tabular-nums sticky left-0 bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors shadow-[2px_0_0_rgba(0,0,0,0.2)]">
                  {idx + 1}
                </td>
                <td className="px-4 py-2 w-[180px] border-r border-gray-800/30 font-mono text-gray-300 sticky left-[48px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors truncate">
                  {node.attributes.find(a => a.name === 'id')?.value || ''}
                </td>
                <td className="px-4 py-2 w-[250px] border-r border-gray-800/30 text-blue-400 font-bold sticky left-[228px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors truncate">
                  {node.attributes.find(a => a.name === 'name')?.value || ''}
                </td>
                <td style={fs.nano} className="px-4 py-2 w-[300px] border-r border-gray-800/30 text-gray-400 sticky left-[478px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors shadow-[2px_0_0_rgba(0,0,0,0.2)] truncate">
                  {node.attributes.find(a => a.name === 'class')?.value || ''}
                </td>
                <td style={fs.nano} className="px-4 py-2 w-[300px] border-r border-gray-800/30 text-gray-400 truncate">
                  {node.attributes.find(a => a.name === 'beanclass')?.value || ''}
                </td>
                {paramNames.map(name => {
                  const param = node.children.find(c => c.tag === 'Parameter' && c.attributes.find(a => a.name === 'name')?.value === name);
                  return (
                    <td key={name} className="px-4 py-2 w-[250px] border-r border-gray-800/30 text-gray-300 truncate">
                      {param?.text || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback to original TableView if no Batch nodes are present
  return (
    <div className="flex-1 overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
      <table style={fs.caption} className="w-full border-separate border-spacing-0 text-left min-w-[800px] table-fixed">
        <thead className="sticky top-0 bg-[#252526] shadow-[0_1px_3px_rgba(0,0,0,0.3)] z-20 border-b border-gray-800">
          <tr className="text-gray-500 font-bold tracking-wider select-none">
            <th className="px-4 py-2.5 w-[48px] border-r border-gray-800 text-center sticky left-0 bg-[#252526] z-30 shadow-[2px_0_0_rgba(0,0,0,0.3)]">#</th>
            <th className="px-4 py-2.5 w-[150px] border-r border-gray-800/50 sticky left-[48px] bg-[#252526] z-30">Tag</th>
            <th className="px-4 py-2.5 w-[250px] border-r border-gray-800/50 sticky left-[198px] bg-[#252526] z-30">ID / Name</th>
            <th className="px-4 py-2.5 w-[350px] border-r border-gray-800/50 sticky left-[448px] bg-[#252526] z-30 shadow-[2px_0_0_rgba(0,0,0,0.3)]">Attributes</th>
            <th className="px-4 py-2.5 min-w-[300px]">Text Content</th>
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

const getAttr = (node: any, name: string) => node.attributes.find((a: any) => a.name.toLowerCase() === name.toLowerCase())?.value || '';

const ResultRow = React.memo<{ result: FilteredResult; index: number }>(({ result, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { node, matched_by, matched_children } = result;

  const hasChildren = matched_children.length > 0;
  
  const displayId = getAttr(node, 'id') || getAttr(node, 'name');

  return (
    <>
      <tr 
        className={`group transition-all ${
          matched_by === 'child' ? 'bg-blue-900/5 border-l-2 border-l-blue-500/30' : 'hover:bg-blue-900/10 border-l-2 border-l-transparent'
        }`}
      >
        <td className="px-4 py-2.5 w-[48px] text-gray-600 font-mono border-r border-gray-800/50 text-center tabular-nums sticky left-0 bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors shadow-[2px_0_0_rgba(0,0,0,0.2)]">
          {index + 1}
        </td>
        <td className="px-4 py-2.5 w-[150px] border-r border-gray-800/30 sticky left-[48px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors truncate">
          <div className="flex items-center gap-2">
            <Tag className={`w-3.5 h-3.5 ${matched_by === 'self' ? 'text-blue-400' : 'text-gray-600'}`} />
            <span className={`font-bold tracking-tight ${matched_by === 'self' ? 'text-blue-400' : 'text-gray-400'}`}>
              {node.tag}
            </span>
            {matched_by === 'child' && (
              <span style={fs.nano} className="px-1 bg-[#1e1e1e] text-blue-400/50 rounded border border-blue-500/10 font-black uppercase">child</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 w-[250px] border-r border-gray-800/30 sticky left-[198px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors truncate">
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
        <td className="px-4 py-2.5 w-[350px] border-r border-gray-800/30 sticky left-[448px] bg-[#0F0F10] z-10 group-hover:bg-[#1a1b26] transition-colors shadow-[2px_0_0_rgba(0,0,0,0.2)] truncate">
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {node.attributes.length > 0 ? node.attributes.map((attr, i) => (
              <span key={i} style={fs.nano} className="px-2 py-0.5 bg-[#252526] border border-gray-800 rounded text-gray-500 shadow-sm group-hover:border-gray-700 transition-colors whitespace-nowrap">
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
              <div style={fs.nano} className="font-black text-gray-600 uppercase mb-2 flex items-center gap-2 tracking-widest">
                <Component className="w-3 h-3" />
                MATCHED SUB-ELEMENTS ({matched_children.length})
              </div>
              {matched_children.map((childResult) => {
                const childNode = childResult.node;
                return (
                  <div key={childNode.id} style={fs.nano} className="flex items-center gap-6 py-2 px-3 border-b border-gray-800/40 last:border-0 hover:bg-blue-500/5 rounded-md group/child transition-colors">
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
});

ResultRow.displayName = 'ResultRow';
