import { useEffect, useRef, useState, useCallback } from "react";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { DiffOnMount } from "@monaco-editor/react";
import { useTextCompareStore } from "../store";
import { useSettingsStore } from "../../settings/store";
import { useMonacoManager } from "../../../hooks/useMonacoManager";
import { useFileSystem } from "../../../hooks/useFileSystem";
import { useConfigStore } from "../../../components/configStore";

export function useTextComparator() {
  const { 
    leftText, rightText, leftPath, rightPath, leftEncoding, rightEncoding,
    setLeftText, setRightText, setLeftPath, setRightPath, setLeftEncoding, setRightEncoding, clearAll 
  } = useTextCompareStore();

  const { tools: toolSettings, updateToolSettings } = useSettingsStore();
  const settings = toolSettings['text-comparator'];
  const { disposeAllModels } = useMonacoManager();
  const { readFile, selectFiles } = useFileSystem();

  const [activeLanguage, setActiveLanguage] = useState("plaintext");
  const leftRef = useRef(leftText);
  const rightRef = useRef(rightText);
  const editorRef = useRef<any>(null);
  const isInternalChange = useRef(false);
  const debounceRef = useRef<{ left?: any, right?: any }>({});

  useEffect(() => {
    return () => disposeAllModels();
  }, [disposeAllModels]);

  useEffect(() => {
    if (!isInternalChange.current && editorRef.current) {
        const originalEditor = editorRef.current.getOriginalEditor();
        const modifiedEditor = editorRef.current.getModifiedEditor();
        if (leftText !== originalEditor.getValue()) originalEditor.setValue(leftText);
        if (rightText !== modifiedEditor.getValue()) modifiedEditor.setValue(rightText);
    }
    leftRef.current = leftText;
    rightRef.current = rightText;
    isInternalChange.current = false;
  }, [leftText, rightText]);

  const loadFile = useCallback(async (side: 'left' | 'right') => {
    try {
      const selected = await selectFiles({ multiple: false });
      if (typeof selected === 'string') {
        const encoding = side === 'left' ? leftEncoding : rightEncoding;
        const content = await readFile(selected, encoding);
        if (side === 'left') {
          setLeftPath(selected);
          setLeftText(content || "");
        } else {
          setRightPath(selected);
          setRightText(content || "");
        }
      }
    } catch (err) {
      console.error("Failed to load file:", err);
    }
  }, [leftEncoding, rightEncoding, readFile, selectFiles, setLeftPath, setLeftText, setRightPath, setRightText]);

  const handleEncodingChange = useCallback(async (side: 'left' | 'right', newEncoding: string) => {
    if (side === 'left') {
      setLeftEncoding(newEncoding);
      if (leftPath) {
        const content = await readFile(leftPath, newEncoding);
        setLeftText(content || "");
      }
    } else {
      setRightEncoding(newEncoding);
      if (rightPath) {
        const content = await readFile(rightPath, newEncoding);
        setRightText(content || "");
      }
    }
  }, [leftPath, rightPath, readFile, setLeftEncoding, setLeftText, setRightEncoding, setRightText]);

  const pasteClipboard = useCallback(async (side: 'left' | 'right') => {
    try {
      const text = await readText();
      if (text) {
        if (side === 'left') setLeftText(text);
        else setRightText(text);
      }
    } catch (err) {
      console.error(err);
    }
  }, [setLeftText, setRightText]);

  const handleEditorDidMount: DiffOnMount = (editor) => {
    editorRef.current = editor;
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.setValue(leftRef.current);
    modifiedEditor.setValue(rightRef.current);

    originalEditor.onDidChangeModelContent(() => {
      const value = originalEditor.getValue();
      if (value !== leftRef.current) {
        isInternalChange.current = true;
        leftRef.current = value;
        clearTimeout(debounceRef.current.left);
        debounceRef.current.left = setTimeout(() => setLeftText(value), 150);
      }
    });

    modifiedEditor.onDidChangeModelContent(() => {
      const value = modifiedEditor.getValue();
      if (value !== rightRef.current) {
        isInternalChange.current = true;
        rightRef.current = value;
        clearTimeout(debounceRef.current.right);
        debounceRef.current.right = setTimeout(() => setRightText(value), 150);
      }
    });

    // Add actions
    [originalEditor, modifiedEditor].forEach(ed => {
        ed.addAction({
            id: "toggle-whitespace",
            label: "Toggle Whitespace Visibility",
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.5,
            run: () => {
                const current = useConfigStore.getState().renderWhitespace;
                useConfigStore.getState().updateConfig({ renderWhitespace: current === 'all' ? 'none' : 'all' });
            }
        });
        ed.addAction({
            id: "change-language",
            label: "Change Language Mode",
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1.6,
            run: () => {
                const newLang = window.prompt("Enter new language (e.g. javascript, rust, json):", activeLanguage);
                if (newLang && newLang.trim() !== '') setActiveLanguage(newLang.trim().toLowerCase());
            }
        });
    });
  };

  return {
    leftText, rightText, leftEncoding, rightEncoding,
    settings, updateToolSettings,
    activeLanguage, setActiveLanguage,
    handleEditorDidMount,
    loadFile,
    handleEncodingChange,
    pasteClipboard,
    clearAll
  };
}
