import { Search as SearchIcon, X, Edit3 } from 'lucide-react';
import { useSqlLogParser } from './hooks/useSqlLogParser';

// Components
import { LogSidebar } from './components/LogSidebar';
import { LogToolbar } from './components/LogToolbar';
import { LogQueryList } from './components/LogQueryList';
import { SqlFormatterModal } from './SqlFormatterModal';
import { FilterModal } from './FilterModal';
import { AliasModal } from './AliasModal';
import { StatusBar } from '../../components/StatusBar';

export default function SqlLogParser() {
  const {
    encoding,
    copiedId,
    selectedSql, setSelectedSql,
    isModalOpen, setIsModalOpen,
    isFilterModalOpen, setIsFilterModalOpen,
    contextMenu, setContextMenu,
    aliasModalProps, setAliasModalProps,
    sidebarWidth,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isDragging, setIsDragging,
    sortOrder, setSortOrder,
    isReloading,
    files, activeFileIndex,
    removeFile, selectFile, clear,
    filters, removeFilter, clearFilters, setFileAlias,
    activeFile,
    sqlLogs,
    handleCopy,
    handleOpenFile,
    handleEncodingChange,
    handleReload
  } = useSqlLogParser();

  const handleSqlClick = (sql: string) => {
    setSelectedSql(sql);
    setIsModalOpen(true);
  };

  return (
    <div className="flex w-full h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden flex-col">
      <div className="flex flex-1 overflow-hidden relative">
        <LogSidebar 
          files={files}
          activeFileIndex={activeFileIndex}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          sidebarWidth={sidebarWidth}
          selectFile={selectFile}
          removeFile={removeFile}
          clear={clear}
          setContextMenu={setContextMenu}
          setAliasModalProps={setAliasModalProps}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
        />

        {/* Sidebar Context Menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
            <div 
              className="fixed z-[101] bg-[#252526] border border-[#454545] rounded-lg shadow-2xl py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100 shadow-black/50"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button 
                className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2 font-medium"
                onClick={() => {
                  const f = files[contextMenu.fileIndex];
                  setAliasModalProps({ isOpen: true, index: contextMenu.fileIndex, initialValue: f.alias || '' });
                  setContextMenu(null);
                }}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Set Alias Name
              </button>
            </div>
          </>
        )}

        {/* Main Area: SQL View */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[#181818]">
          <LogToolbar 
            onOpenFile={handleOpenFile}
            onReload={handleReload}
            isReloading={isReloading}
            encoding={encoding}
            onEncodingChange={handleEncodingChange}
            onOpenFilter={() => setIsFilterModalOpen(true)}
            sortOrder={sortOrder}
            onToggleSort={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            activeFile={activeFile}
            queryCount={sqlLogs.length}
          />

          {/* Filter Tags Bar */}
          {filters.length > 0 && activeFile && (
            <div className="px-4 py-2 bg-[#222]/50 backdrop-blur-sm border-b border-[#333] flex flex-wrap gap-2 items-center min-h-[42px] shadow-inner">
              <span className="text-[0.77rem] uppercase font-bold text-gray-500 mr-2 flex items-center gap-1.5 opacity-80">
                <SearchIcon className="w-3 h-3 text-blue-400" /> Active Filters
              </span>
              {filters.map((f) => (
                <div key={f.id} className="flex items-center gap-2 bg-blue-600/15 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-[0.85rem] font-bold animate-in fade-in zoom-in-95 duration-200 shadow-sm">
                  <span className="opacity-60 text-[0.7rem] uppercase tracking-tighter">{f.type} {f.operator === 'equals' ? '==' : f.operator === 'not_equals' ? '!=' : f.operator === 'greater_than' ? '>' : f.operator === 'less_than' ? '<' : f.operator === 'not_contains' ? 'not in' : 'in'}</span>
                  <span className="max-w-[150px] truncate">{f.value}</span>
                  <button 
                    onClick={() => removeFilter(f.id)}
                    className="ml-1 p-0.5 hover:bg-blue-400 hover:text-black rounded-full transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={clearFilters}
                className="text-[0.77rem] text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider ml-auto hover:bg-red-400/10 px-2 py-1 rounded-md transition-all active:scale-95"
              >
                Clear All
              </button>
            </div>
          )}

          <LogQueryList 
            sqlLogs={sqlLogs}
            activeFile={activeFile}
            onSqlClick={handleSqlClick}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        </div>
      </div>

      <StatusBar 
        activeFileName={activeFile ? activeFile.name : "No File"}
        activeLanguage="sql"
        activeEncoding={activeFile ? activeFile.encoding : encoding}
        isCompareMode={false}
        onLanguageChange={() => {}}
        onEncodingChange={handleEncodingChange}
      />

      <SqlFormatterModal 
        isOpen={isModalOpen}
        sql={selectedSql || ''}
        onClose={() => setIsModalOpen(false)}
      />

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
      />

      <AliasModal
        isOpen={aliasModalProps.isOpen}
        initialValue={aliasModalProps.initialValue}
        onClose={() => setAliasModalProps(p => ({ ...p, isOpen: false }))}
        onSave={(alias) => setFileAlias(aliasModalProps.index, alias || undefined)}
      />
    </div>
  );
}
