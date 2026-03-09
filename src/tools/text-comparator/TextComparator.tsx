import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { DiffEditor, DiffOnMount, loader } from "@monaco-editor/react";
import { FileUp, ClipboardPaste, ArrowRightLeft, Trash2, CheckSquare, Square, Rows } from "lucide-react";
import { useTextCompareStore } from "./store";
import { useSettingsStore } from "../settings/store";
import { StatusBar } from "../../components/StatusBar";
import { useEditorConfig } from "../../components/useEditorConfig";
import { useConfigStore } from "../../components/configStore";

const ENCODING_OPTIONS = [
  "UTF-8", "UTF-16", "UTF-16LE", "UTF-16BE", "Shift_JIS", "EUC-JP", "ISO-8859-1", 
  "windows-1250", "windows-1251", "windows-1252", "windows-1258",
  "GBK", "GB18030", "EUC-KR", "Big5", "koi8-r"
];

export function TextComparator() {
  const { 
    leftText, 
    rightText, 
    leftPath,
    rightPath,
    leftEncoding,
    rightEncoding,
    setLeftText, 
    setRightText, 
    setLeftPath,
    setRightPath,
    setLeftEncoding,
    setRightEncoding,
    clearAll 
  } = useTextCompareStore();

  const { tools: toolSettings, updateToolSettings } = useSettingsStore();
  const settings = toolSettings['text-comparator'];

  const { getCommonOptions, config } = useEditorConfig();

  // Local state for active language in Diff mode
  const [activeLanguage, setActiveLanguage] = useState("plaintext");

  // Refs to avoid stale closures and manage focus/cursor reset
  const leftRef = useRef(leftText);
  const rightRef = useRef(rightText);
  const editorRef = useRef<any>(null);
  const isInternalChange = useRef(false);

  // Manual sync for external updates
  useEffect(() => {
    if (!isInternalChange.current && editorRef.current) {
        const originalEditor = editorRef.current.getOriginalEditor();
        const modifiedEditor = editorRef.current.getModifiedEditor();
        
        if (leftText !== originalEditor.getValue()) {
            originalEditor.setValue(leftText);
        }
        if (rightText !== modifiedEditor.getValue()) {
            modifiedEditor.setValue(rightText);
        }
    }
    leftRef.current = leftText;
    rightRef.current = rightText;
    isInternalChange.current = false;
  }, [leftText, rightText]);

  // Define custom theme for granular diff highlighting
  useEffect(() => {
    loader.init().then(monaco => {
        monaco.editor.defineTheme('genzo-diff-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'diffEditor.insertedLineBackground': settings.showRowHighlight ? '#2ea04320' : '#00000000',
                'diffEditor.removedLineBackground': settings.showRowHighlight ? '#f8514920' : '#00000000',
                'diffEditor.insertedTextBackground': '#2ea04360',
                'diffEditor.removedTextBackground': '#f8514960',
            }
        });
    });
  }, [settings.showRowHighlight]);

  const loadFile = async (side: 'left' | 'right') => {
    try {
      const selected = await open({ multiple: false });
      if (typeof selected === 'string') {
        const encoding = side === 'left' ? leftEncoding : rightEncoding;
        const response: any = await invoke('read_file_encoded', { 
            path: selected, 
            encoding: encoding 
        });
        
        if (response.error) {
            console.error("Error reading file:", response.error);
            return;
        }
        
        const text = response.is_binary ? "Binary file or unsupported encoding." : (response.content || "");
        
        if (side === 'left') {
            setLeftPath(selected);
            setLeftText(text);
        } else {
            setRightPath(selected);
            setRightText(text);
        }
      }
    } catch (err) {
      console.error("Failed to read file", err);
    }
  };

  const handleEncodingChange = async (side: 'left' | 'right', newEncoding: string) => {
      if (side === 'left') {
          setLeftEncoding(newEncoding);
          if (leftPath) {
              try {
                  const response: any = await invoke('read_file_encoded', { path: leftPath, encoding: newEncoding });
                  if (!response.error && !response.is_binary) {
                      setLeftText(response.content || "");
                  }
              } catch (e) {
                  console.error(e);
              }
          }
      } else {
          setRightEncoding(newEncoding);
          if (rightPath) {
              try {
                  const response: any = await invoke('read_file_encoded', { path: rightPath, encoding: newEncoding });
                  if (!response.error && !response.is_binary) {
                      setRightText(response.content || "");
                  }
              } catch (e) {
                  console.error(e);
              }
          }
      }
  };


  const pasteClipboard = async (side: 'left' | 'right') => {
    try {
      const text = await readText();
      if (text) {
        if (side === 'left') setLeftText(text);
        else setRightText(text);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        setLeftText(value);
      }
    });

    modifiedEditor.onDidChangeModelContent(() => {
      const value = modifiedEditor.getValue();
      if (value !== rightRef.current) {
        isInternalChange.current = true;
        rightRef.current = value;
        setRightText(value);
      }
    });

    // Universal Context Menus
    originalEditor.addAction({
      id: "toggle-whitespace",
      label: "Toggle Whitespace Visibility",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: () => {
        useConfigStore.getState().updateConfig({
           renderWhitespace: useConfigStore.getState().renderWhitespace === 'all' ? 'none' : 'all'
        });
      }
    });

    originalEditor.addAction({
      id: "change-language",
      label: "Change Language Mode",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: () => {
        const newLang = window.prompt("Enter new language (e.g. javascript, rust, json):", activeLanguage);
        if (newLang && newLang.trim() !== '') {
          setActiveLanguage(newLang.trim().toLowerCase());
        }
      }
    });

    modifiedEditor.addAction({
      id: "toggle-whitespace",
      label: "Toggle Whitespace Visibility",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.5,
      run: () => {
        useConfigStore.getState().updateConfig({
           renderWhitespace: useConfigStore.getState().renderWhitespace === 'all' ? 'none' : 'all'
        });
      }
    });

    modifiedEditor.addAction({
      id: "change-language",
      label: "Change Language Mode",
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1.6,
      run: () => {
        const newLang = window.prompt("Enter new language (e.g. javascript, rust, json):", activeLanguage);
        if (newLang && newLang.trim() !== '') {
          setActiveLanguage(newLang.trim().toLowerCase());
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] overflow-hidden">
      {/* Top Header */}
      <div className="h-[50px] bg-[#252526] border-b border-[#3C3C3D] flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
           <select 
             value={leftEncoding} 
             onChange={(e) => handleEncodingChange('left', e.target.value)}
             className="bg-transparent text-xs text-gray-400 border border-[#3C3C3D] rounded px-1 py-1 mr-2 outline-none cursor-pointer hover:border-gray-500"
             title="Select Encoding"
           >
             {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
           </select>
           <button onClick={() => loadFile('left')} className="p-1.5 hover:bg-[#3C3C3D] text-gray-300 rounded transition flex items-center gap-2 text-xs font-semibold" title="Load File 1">
             <FileUp className="w-4 h-4 text-blue-400" /> FILE 1
           </button>
           <button onClick={() => pasteClipboard('left')} className="p-1.5 hover:bg-[#3C3C3D] text-gray-300 rounded transition" title="Paste 1">
             <ClipboardPaste className="w-4 h-4 text-green-400" />
           </button>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-gray-300 font-bold tracking-wider text-sm flex items-center gap-2 uppercase">
            <ArrowRightLeft className="w-4 h-4 text-purple-400" />
            Text Comparator
          </span>
          <div className="w-[1px] h-6 bg-[#3C3C3D]"></div>


          <button 
             onClick={() => updateToolSettings('text-comparator', { showRowHighlight: !settings.showRowHighlight })}
             className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-[#3C3C3D] transition text-xs font-semibold text-gray-300"
             title="Toggle Row Highlighting"
          >
             {settings.showRowHighlight ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-gray-400" />}
             <Rows className="w-4 h-4" /> Row
          </button>
          
          <button onClick={clearAll} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition" title="Clear All">
             <Trash2 className="w-4 h-4" /> CLEAR
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => pasteClipboard('right')} className="p-1.5 hover:bg-[#3C3C3D] text-gray-300 rounded transition" title="Paste 2">
             <ClipboardPaste className="w-4 h-4 text-green-400" />
           </button>
           <button onClick={() => loadFile('right')} className="p-1.5 hover:bg-[#3C3C3D] text-gray-300 rounded transition flex items-center gap-2 text-xs font-semibold" title="Load File 2">
             FILE 2 <FileUp className="w-4 h-4 text-orange-400" />
           </button>
           <select 
             value={rightEncoding} 
             onChange={(e) => handleEncodingChange('right', e.target.value)}
             className="bg-transparent text-xs text-gray-400 border border-[#3C3C3D] rounded px-1 py-1 ml-2 outline-none cursor-pointer hover:border-gray-500"
             title="Select Encoding"
           >
             {ENCODING_OPTIONS.map(enc => <option key={enc} value={enc} className="bg-[#252526]">{enc}</option>)}
           </select>
        </div>
      </div>

      {/* min-h-0 ngăn DiffEditor tràn ra ngoài, đảm bảo StatusBar luôn hiển thị */}
      {/* min-h-0 prevents DiffEditor from overflowing, ensuring StatusBar is always visible */}
      <div className="flex-1 bg-[#1E1E1E] min-h-0 overflow-hidden">
        <DiffEditor
          height="100%"
          onMount={handleEditorDidMount}
          theme="genzo-diff-theme"
          language={activeLanguage}
          options={getCommonOptions({
            diffAlgorithm: 'advanced',
            renderSideBySide: true,
            ignoreTrimWhitespace: config.ignoreTrimWhitespace,
            readOnly: false,
            renderIndicators: true,
            originalEditable: true,
            renderWhitespace: config.renderWhitespace
          })}
        />
      </div>

      <StatusBar 
        activeFileName="Diff View"
        activeLanguage={activeLanguage}
        isCompareMode={true}
        onLanguageChange={setActiveLanguage}
      />
    </div>
  );
}
