import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

export function useFileSystem() {
  /**
   * Reads a text file with a specified encoding (via Rust backend).
   */
  const readFile = async (path: string, encoding: string = 'UTF-8') => {
    try {
      const response: any = await invoke('read_file_encoded', { path, encoding });
      if (response.error) throw new Error(response.error);
      return response.content;
    } catch (err) {
      console.error(`[useFileSystem] Failed to read file: ${path}`, err);
      throw err;
    }
  };

  const writeFile = async (path: string, content: string, encoding: string = 'UTF-8') => {
    try {
      await invoke('save_file_encoded', { path, content, encoding });
    } catch (err) {
      console.error(`[useFileSystem] Failed to write file: ${path}`, err);
      throw err;
    }
  };

  /**
   * Opens a file dialog to select files.
   */
  const selectFiles = async (options: any = {}) => {
    try {
      return await open({
        multiple: true,
        ...options,
      });
    } catch (err) {
      console.error('[useFileSystem] Failed to open file dialog', err);
      return null;
    }
  };

  /**
   * Opens a directory dialog.
   */
  const selectDirectory = async (options: any = {}) => {
    try {
      return await open({
        directory: true,
        multiple: false,
        ...options,
      });
    } catch (err) {
      console.error('[useFileSystem] Failed to open directory dialog', err);
      return null;
    }
  };

  /**
   * Saves a file via dialog.
   */
  const saveFile = async (options: any = {}) => {
    try {
      return await save(options);
    } catch (err) {
      console.error('[useFileSystem] Failed to save file dialog', err);
      return null;
    }
  };

  return {
    readFile,
    writeFile,
    selectFiles,
    selectDirectory,
    saveFile,
    // Native re-exports for convenience
    nativeRead: readTextFile,
    nativeWrite: writeTextFile
  };
}
