import React from 'react';
import { motion } from 'framer-motion';
import { X, Pin } from "lucide-react";
import { EditorFile } from "../store";
import { getFileIcon } from "../utils";

interface FileItemProps {
  file: EditorFile;
  isActive: boolean;
  isSidebarCollapsed: boolean;
  index: number;
  draggedIndex: number | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  file, isActive, isSidebarCollapsed, index, draggedIndex,
  onSelect, onClose, onContextMenu, onDragStart, onDragOver, onDrop
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      draggable={!isSidebarCollapsed}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onClick={() => onSelect(file.id)}
      onContextMenu={(e) => onContextMenu(e, file.id)}
      className={`
        group flex items-center cursor-pointer text-[1rem] relative
        transition-all duration-200 ease-out
        ${isSidebarCollapsed ? "justify-center py-2.5" : "px-4 py-1.5"}
        ${isActive ? "bg-blue-600/20 text-blue-100 border-l-2 border-blue-500" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"}
        ${draggedIndex === index ? "opacity-30 scale-95" : "opacity-100"}
      `}
    >
      <div className={`flex-shrink-0 ${isSidebarCollapsed ? "relative" : "mr-2"}`}>
        {getFileIcon(file.language)}
        {isSidebarCollapsed && file.isDirty && (
          <div className="absolute top-0 -right-2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        )}
        {isSidebarCollapsed && file.isPinned && (
          <Pin className="absolute -top-1 -right-2 w-2.5 h-2.5 text-blue-400 rotate-45" />
        )}
      </div>

      {!isSidebarCollapsed && (
        <>
          {file.isPinned && <Pin className="w-3 h-3 text-blue-400 rotate-45 mr-1.5 opacity-70" />}
          <span className={`truncate flex-1 ${isActive ? "font-medium" : "font-normal"}`}>
            {file.name}
          </span>
          
          <div className="flex items-center ml-2">
            {file.isDirty && (
              <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:hidden transition-all shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(file.id); }}
              className="opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-white rounded-md p-1 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute left-0 w-[2px] h-3/5 bg-blue-500 rounded-r-full"
        />
      )}
    </motion.div>
  );
};
