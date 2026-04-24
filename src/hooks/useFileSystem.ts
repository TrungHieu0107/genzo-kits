import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open, save, OpenDialogOptions, SaveDialogOptions } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { EncodedFileResponse } from '../tools/note-editor/store';

export function useFileSystem() {
  /**
   * Reads a text file with a specified encoding (via Rust backend).
   */
  const readFile = async (path: string, encoding: string = 'UTF-8') => {
    try {
      const response = await invoke<EncodedFileResponse>('read_file_encoded', { path, encoding });
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
  const selectFiles = async (options: OpenDialogOptions = {}) => {
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
  const selectDirectory = async (options: OpenDialogOptions = {}) => {
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
  const saveFile = async (options: SaveDialogOptions = {}) => {
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
