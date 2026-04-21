import { useEffect } from "react";
import { useNoteEditorStore } from "../store";
import { useToastStore } from "../../../components/toastStore";
import { useFileSystem } from "../../../hooks/useFileSystem";

interface CommandHandlers {
  handleOpenFile: () => Promise<void>;
  handleSaveFile: (file: any) => Promise<void>;
}

/**
 * Hook to handle global keyboard commands for NoteEditor
 */
export function useNoteEditorCommands({ handleOpenFile, handleSaveFile }: CommandHandlers) {
  const { createFile, closeFile, activeFileId, files } = useNoteEditorStore();
  const { showToast } = useToastStore();
  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // New File
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { 
        e.preventDefault(); 
        createFile(); 
      }
      
      // Close File
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') { 
        e.preventDefault(); 
        if (activeFileId) closeFile(activeFileId); 
      }
      
      // Open File
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { 
        e.preventDefault(); 
        handleOpenFile(); 
      }
      
      // Save File
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
        e.preventDefault(); 
        if (activeFile) handleSaveFile(activeFile); 
      }
      
      // Copy Path
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') { 
        e.preventDefault(); 
        if (activeFile?.path) {
          try {
            const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
            await writeText(activeFile.path);
            showToast("Path copied to clipboard!", "success");
          } catch (err) {
            console.error("Failed to copy path:", err);
            showToast("Failed to copy path", "error");
          }
        } else if (activeFile) {
          showToast("File not saved yet.", "info");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, activeFile, createFile, closeFile, handleOpenFile, handleSaveFile, showToast]);
}
