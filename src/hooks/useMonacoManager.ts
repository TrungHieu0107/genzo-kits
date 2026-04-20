import { useMonaco } from '@monaco-editor/react';
import { useCallback } from 'react';

export function useMonacoManager() {
  const monaco = useMonaco();

  /**
   * Disposes of a Monaco model if it exists.
   * This is critical for preventing memory leaks in long-running Tauri apps.
   */
  const disposeModel = useCallback((path: string) => {
    if (!monaco) return;
    
    try {
      // Create a URI from the path to look up the model
      const uri = monaco.Uri.file(path);
      const model = monaco.editor.getModel(uri);
      
      if (model) {
        model.dispose();
        console.debug(`[useMonacoManager] Disposed model: ${path}`);
      }
    } catch (err) {
      console.warn(`[useMonacoManager] Failed to dispose model: ${path}`, err);
    }
  }, [monaco]);

  /**
   * Disposes of all currently loaded models.
   */
  const disposeAllModels = useCallback(() => {
    if (!monaco) return;
    monaco.editor.getModels().forEach(model => model.dispose());
    console.debug('[useMonacoManager] Disposed all models');
  }, [monaco]);

  return {
    monaco,
    disposeModel,
    disposeAllModels
  };
}
