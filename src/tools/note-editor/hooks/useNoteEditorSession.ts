import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNoteEditorStore } from "../store";

/**
 * Hook to manage session persistence for NoteEditor
 */
export function useNoteEditorSession() {
  const { files, activeFileId, isHydrated, hydrateSession } = useNoteEditorStore();
  const [isRestoring, setIsRestoring] = useState(true);
  const isFirstMount = useRef(true);

  // Restore session from Rust backend
  useEffect(() => {
    if (isHydrated) {
      setIsRestoring(false);
      return;
    }

    const loadSession = async () => {
      try {
        const sessionStr: string = await invoke('load_note_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          hydrateSession(session);
        }
      } catch (err) {
        console.log("No previous session found.");
      } finally {
        setIsRestoring(false);
      }
    };
    loadSession();
  }, [hydrateSession, isHydrated]);

  // Debounce save session to Rust backend
  useEffect(() => {
    if (isRestoring) return;
    
    if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
    }

    const timer = setTimeout(() => {
       const session = { files, activeFileId };
       invoke('save_note_session', { stateJson: JSON.stringify(session) }).catch(err => {
         console.error("Failed to save session:", err);
       });
    }, 1000);

    return () => clearTimeout(timer);
  }, [files, activeFileId, isRestoring]);

  return { isRestoring };
}
