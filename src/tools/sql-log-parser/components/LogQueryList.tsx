import { 
  Clock, FileText, Database, Copy, Check 
} from 'lucide-react';

interface LogQueryListProps {
  sqlLogs: any[];
  activeFile: any;
  onSqlClick: (sql: string) => void;
  onCopy: (id: string, text: string) => void;
  copiedId: string | null;
}

export function LogQueryList({
  sqlLogs,
  activeFile,
  onSqlClick,
  onCopy,
  copiedId
}: LogQueryListProps) {
  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-30 select-none">
        <Database className="w-20 h-20 mb-6 text-gray-400" />
        <div className="h-px w-24 bg-gray-500 mb-6"></div>
        <p className="text-lg font-light tracking-tight italic">Select a log file to view formatted SQL queries</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative w-full h-full min-h-0 bg-[#1E1E1E] overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Table Header */}
        <div className="flex-shrink-0 bg-[#252526] border-b border-[#3C3C3D] flex text-[11px] font-bold text-gray-500 uppercase tracking-wider shadow-sm z-10">
          <div className="w-[180px] px-4 py-2.5 border-r border-[#3C3C3D] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400/50"/> Timestamp
          </div>
          <div className="w-[220px] px-4 py-2.5 border-r border-[#3C3C3D] flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-blue-400/50"/> DAO Name
          </div>
          <div className="flex-1 px-4 py-2.5 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400/50"/> Reconstructed SQL Query
          </div>
          <div className="w-[70px] px-4 py-2.5 text-center select-none">Action</div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1a1a]">
          {sqlLogs.length > 0 ? (
            sqlLogs.map((log, idx) => (
              <div 
                key={`${log.logIndex}-${idx}`} 
                className="flex border-b border-[#2d2d2d] hover:bg-[#252526] transition-colors group group-last:border-none items-stretch animate-in fade-in slide-in-from-left-2 duration-300"
                style={{ animationDelay: `${Math.min(idx * 30, 600)}ms` }}
              >
                <div className="w-[180px] flex-shrink-0 px-4 py-4 text-[12px] text-gray-400 font-mono border-r border-[#2d2d2d] flex items-center">
                  {log.timestamp || '--/--/-- --:--:--'}
                </div>
                <div className="w-[220px] flex-shrink-0 px-4 py-4 text-[12px] text-blue-400/80 font-bold border-r border-[#2d2d2d] flex items-center" title={log.daoName}>
                  <span className="truncate">{log.daoName}</span>
                </div>
                <div 
                  className="flex-1 px-4 py-4 text-[13px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed lining-nums border-r border-[#2d2d2d] cursor-pointer hover:bg-[#2a2a2e] transition-colors relative"
                  onClick={() => onSqlClick(log.reconstructedSql || '')}
                  title="Click to view formatted SQL"
                >
                   <span className="text-gray-300 group-hover:text-blue-300 transition-colors">{log.reconstructedSql}</span>
                </div>
                <div className="w-[70px] flex-shrink-0 flex items-center justify-center bg-[#1e1e1e] group-hover:bg-[#242e2a] transition-colors">
                   <button 
                     onClick={() => onCopy(`${log.logIndex}-${idx}`, log.reconstructedSql || '')}
                     className={`p-2 rounded-lg transition-all active:scale-90 ${
                       copiedId === `${log.logIndex}-${idx}` 
                         ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 shadow-lg shadow-emerald-500/10' 
                         : 'text-gray-500 hover:text-white hover:bg-[#3d3d3d] border border-transparent'
                     }`}
                     title="Copy SQL to Clipboard"
                   >
                     {copiedId === `${log.logIndex}-${idx}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center opacity-20 italic text-sm text-gray-500 flex flex-col items-center gap-4">
              <Database className="w-12 h-12" />
              No queries detected or matching filters in this session.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
