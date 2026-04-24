import { useRef } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { usePropertyRenamer } from "./hooks/usePropertyRenamer";

// Components
import { RenamerSidebar } from "./components/RenamerSidebar";
import { RenamerToolbar } from "./components/RenamerToolbar";
import { RenamerMainTable } from "./components/RenamerMainTable";
import { RenamerPreviewPanel } from "./components/RenamerPreviewPanel";

export function PropertyRenamer() {
  const {
    files, setFiles, toggleFileCheck, updateFileEncoding, removeFile,
    mappings, updateMapping,
    selectedName, setSelectedName,
    showPreview, setShowPreview,
    isScanning, isReplacing, isUndoing,
    statusMessage, statusType,
    filter, setFilter,
    scanSourcePath, setScanSourcePath,
    filteredResults,
    pendingCount,
    selectedOccurrences,
    handleAddFiles,
    handleAddFolder,
    handleScan,
    handleReplace,
    handleUndo,
    clearFilesAction
  } = usePropertyRenamer();

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#CCCCCC] font-sans overflow-hidden">
      {/* Top Status Bar */}
      <div className="h-[45px] bg-[#252526] border-b border-[#3C3C3D] flex items-center justify-between px-6 flex-shrink-0 shadow-md relative z-30">
        <div className="flex items-center gap-4">
          <span className="text-gray-200 font-black tracking-[0.2em] uppercase text-xs">
            Property Refactor
          </span>
          <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1 rounded-full border border-[#333] shadow-inner">
            <span className="text-[0.77rem] font-bold text-gray-500 uppercase">Status:</span>
            <span className="text-[0.77rem] font-mono text-blue-400">{files.length} Files · {filteredResults.length} Results</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <RenamerSidebar 
          files={files}
          onAddFiles={handleAddFiles}
          onAddFolder={handleAddFolder}
          onClear={clearFilesAction}
          onToggleCheck={toggleFileCheck}
          onToggleAll={(checked) => setFiles(files.map(f => ({ ...f, checked })))}
          onSetScanSource={setScanSourcePath}
          scanSourcePath={scanSourcePath}
          onUpdateEncoding={updateFileEncoding}
          onRemoveFile={removeFile}
          onScan={handleScan}
          isScanning={isScanning}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-[#181818] relative">
          <RenamerToolbar 
            filter={filter}
            onFilterChange={setFilter}
            onReplace={handleReplace}
            onUndo={handleUndo}
            isReplacing={isReplacing}
            isUndoing={isUndoing}
            pendingCount={pendingCount}
          />

          <RenamerMainTable 
            filteredResults={filteredResults}
            virtualItems={virtualItems}
            totalHeight={totalHeight}
            parentRef={parentRef}
            selectedName={selectedName}
            onSelectName={(name) => { setSelectedName(name); setShowPreview(true); }}
            mappings={mappings}
            onUpdateMapping={updateMapping}
          />

          <AnimatePresence>
            {statusMessage && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full flex items-center gap-3 text-xs font-bold shadow-2xl z-[100] border border-white/10 backdrop-blur-xl ${
                  statusType === "success" ? "bg-emerald-600/90 text-white" :
                  statusType === "error" ? "bg-red-600/90 text-white" : "bg-blue-600/90 text-white"
                }`}
              >
                {statusType === "success" && <Check className="w-4 h-4" />}
                {statusType === "error" && <AlertTriangle className="w-4 h-4" />}
                {statusMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full"
            >
              <RenamerPreviewPanel 
                selectedName={selectedName}
                selectedOccurrences={selectedOccurrences}
                mappings={mappings}
                onClose={() => setShowPreview(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
