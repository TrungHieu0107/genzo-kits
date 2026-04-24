import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  Plus, FolderOpen, Save, Link as LinkIcon, 
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { EditorFile } from "../store";
import { FileItem } from "./FileItem";

interface SidebarProps {
  files: EditorFile[];
  activeFileId: string | null;
  isSidebarCollapsed: boolean;
  sidebarWidth: number;
  draggedIndex: number | null;
  onToggleCollapse: () => void;
  onResize: (e: React.MouseEvent) => void;
  onCreateFile: () => void;
  onOpenFile: () => void;
  onOpenPath: () => void;
  onSaveActive: () => void;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files, activeFileId, isSidebarCollapsed, sidebarWidth, draggedIndex,
  onToggleCollapse, onResize, onCreateFile, onOpenFile, onOpenPath, onSaveActive,
  onSelect, onClose, onContextMenu, onDragStart, onDragOver, onDrop
}) => {
  const pinnedFiles = files.filter(f => f.isPinned);
  const unpinnedFiles = files.filter(f => !f.isPinned);
  const displayFiles = [...pinnedFiles, ...unpinnedFiles];
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div 
      className={`
        flex-shrink-0 bg-[#0F0F10]/80 backdrop-blur-xl flex flex-col relative 
        border-r border-white/5 transition-all duration-500 ease-in-out
        ${isSidebarCollapsed ? "w-[60px] items-center" : ""}
      `}
      style={!isSidebarCollapsed ? { width: `${sidebarWidth}px` } : {}}
    >
      {/* Header */}
      <div className={`h-[45px] flex items-center px-4 border-b border-white/5 ${isSidebarCollapsed ? "justify-center w-full px-0" : "justify-between"}`}>
        {!isSidebarCollapsed && (
          <span className="text-[0.77rem] font-bold text-gray-500 uppercase tracking-[0.2em]">Explorer</span>
        )}
        <button 
          onClick={onToggleCollapse} 
          className="hover:bg-white/10 p-1.5 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto w-full hide-scrollbar">
        {/* Actions Section */}
        <div className={`flex flex-col w-full py-2 ${isSidebarCollapsed ? "items-center" : "px-2"}`}>
          <div className={`flex items-center mb-2 ${isSidebarCollapsed ? "justify-center flex-col gap-3" : "justify-between px-2"}`}>
            {!isSidebarCollapsed && (
              <span className="text-[0.85rem] font-bold text-gray-400 uppercase tracking-wider">Note Kit</span>
            )}
            <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? "flex-col border-b border-white/5 pb-4 w-full" : ""}`}>
              <SidebarAction icon={Plus} onClick={onCreateFile} title="New File" />
              <SidebarAction icon={FolderOpen} onClick={onOpenFile} title="Open File" />
              <SidebarAction icon={LinkIcon} onClick={onOpenPath} title="Open by Path" />
              {!isSidebarCollapsed && (
                <SidebarAction 
                  icon={Save} 
                  onClick={onSaveActive} 
                  disabled={!activeFile?.isDirty} 
                  title="Save Active"
                  active={activeFile?.isDirty}
                />
              )}
            </div>
          </div>

          {/* File List */}
          <div className="flex flex-col w-full gap-[1px]">
            <AnimatePresence mode="popLayout">
              {displayFiles.map((file, idx) => (
                <FileItem
                  key={file.id}
                  file={file}
                  isActive={activeFileId === file.id}
                  isSidebarCollapsed={isSidebarCollapsed}
                  index={idx}
                  draggedIndex={draggedIndex}
                  onSelect={onSelect}
                  onClose={onClose}
                  onContextMenu={onContextMenu}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                />
              ))}
            </AnimatePresence>
            
            {files.length === 0 && !isSidebarCollapsed && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center opacity-30">
                <Plus className="w-8 h-8 mb-2" />
                <p className="text-[0.85rem]">No active notes. Create or open a file to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      {!isSidebarCollapsed && (
        <div 
          className="absolute top-0 right-[-2px] w-[4px] h-full cursor-col-resize hover:bg-blue-500/30 transition-colors z-20" 
          onMouseDown={onResize}
        />
      )}
    </div>
  );
};

interface SidebarActionProps {
  icon: any;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  active?: boolean;
}

const SidebarAction: React.FC<SidebarActionProps> = ({ icon: Icon, onClick, title, disabled, active }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    title={title}
    className={`
      p-1.5 rounded-lg transition-all duration-200
      ${disabled ? "opacity-20 cursor-not-allowed" : "hover:bg-white/10 text-gray-400 hover:text-white hover:scale-110 active:scale-95"}
      ${active ? "text-blue-400" : ""}
    `}
  >
    <Icon className="w-4 h-4" />
  </button>
);
