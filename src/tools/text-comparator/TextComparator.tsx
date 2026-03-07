import { useState, useRef, UIEvent, useEffect } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { diffLines, Change } from "diff";
import { FileUp, ClipboardPaste, ArrowRightLeft, Download, Trash2, FileText } from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme syntax highlighting
import "prismjs/components/prism-json";
import "prismjs/components/prism-java";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";

export function TextComparator() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diffResult, setDiffResult] = useState<Change[] | null>(null);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Re-run prism highlighting whenever diff changes
  useEffect(() => {
    if (diffResult) {
      setTimeout(() => Prism.highlightAll(), 0);
    }
  }, [diffResult]);

  const handleScroll = (e: UIEvent<HTMLDivElement>, source: 'left' | 'right') => {
    if (source === 'left' && rightRef.current) {
      rightRef.current.scrollTop = e.currentTarget.scrollTop;
      rightRef.current.scrollLeft = e.currentTarget.scrollLeft;
    } else if (source === 'right' && leftRef.current) {
      leftRef.current.scrollTop = e.currentTarget.scrollTop;
      leftRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const clearAll = () => {
    setLeftText("");
    setRightText("");
    setDiffResult(null);
  };

  const handleCompare = () => {
    if (!leftText && !rightText) return;
    const changes = diffLines(leftText, rightText);
    setDiffResult(changes);
  };

  const loadFile = async (side: 'left' | 'right') => {
    try {
      const selected = await open({ multiple: false });
      if (typeof selected === 'string') {
        const content = await readTextFile(selected);
        if (side === 'left') setLeftText(content);
        else setRightText(content);
      }
    } catch (err) {
      console.error(err);
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

  const exportReport = async (format: 'html' | 'txt') => {
    if (!diffResult) return;
    
    let content = "";
    if (format === 'txt') {
      content = "Text Comparator Report\n============================\n\n";
      diffResult.forEach((change) => {
        const prefix = change.added ? "+ " : change.removed ? "- " : "  ";
        const lines = change.value.split('\n');
        lines.forEach(l => {
          if (l.trim()) content += `${prefix}${l}\n`;
        });
      });
    } else {
      content = `
<html>
<head>
  <style>
    body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; }
    .added { background: #204e28; }
    .removed { background: #512425; }
    .modified { background: #4b4321; }
  </style>
</head>
<body>
  <h2>Text Comparator Report</h2>
  <pre>
`;
      diffResult.forEach((change) => {
        const className = change.added ? "added" : change.removed ? "removed" : "";
        content += `<span class="${className}">${change.value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      });
      content += `
  </pre>
</body>
</html>`;
    }

    try {
      const filePath = await save({
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
        defaultPath: `diff-report.${format}`
      });
      if (filePath) {
        await writeTextFile(filePath, content);
      }
    } catch (e) {
      console.error("Failed to save report: ", e);
    }
  };

  const buildRows = () => {
    if (!diffResult) return [];
    
    const rows = [];
    let leftLine = 1;
    let rightLine = 1;

    for (let i = 0; i < diffResult.length; i++) {
        const chunk = diffResult[i];
        const lines = chunk.value.replace(/\n$/, "").split("\n");
        
        if (chunk.added) {
            for (let j = 0; j < lines.length; j++) {
                rows.push({
                    leftNum: null, leftText: null, leftType: 'empty',
                    rightNum: rightLine++, rightText: lines[j], rightType: 'added'
                });
            }
        } else if (chunk.removed) {
            const nextChunk = diffResult[i+1];
            if (nextChunk && nextChunk.added) {
                const addedChunkLines = nextChunk.value.replace(/\n$/, "").split("\n");
                const maxLen = Math.max(lines.length, addedChunkLines.length);
                for (let j = 0; j < maxLen; j++) {
                    const rType = j < addedChunkLines.length ? 'modified-right' : 'empty';
                    const lType = j < lines.length ? 'modified-left' : 'empty';
                    rows.push({
                        leftNum: j < lines.length ? leftLine++ : null,
                        leftText: j < lines.length ? lines[j] : null,
                        leftType: lType,
                        rightNum: j < addedChunkLines.length ? rightLine++ : null,
                        rightText: j < addedChunkLines.length ? addedChunkLines[j] : null,
                        rightType: rType
                    });
                }
                i++;
            } else {
                for (let j = 0; j < lines.length; j++) {
                    rows.push({
                        leftNum: leftLine++, leftText: lines[j], leftType: 'removed',
                        rightNum: null, rightText: null, rightType: 'empty'
                    });
                }
            }
        } else {
            for (let j = 0; j < lines.length; j++) {
                rows.push({
                    leftNum: leftLine++, leftText: lines[j], leftType: 'unchanged',
                    rightNum: rightLine++, rightText: lines[j], rightType: 'unchanged'
                });
            }
        }
    }
    return rows;
  };

  const rows = buildRows();

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-xs font-mono p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between text-white font-sans">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-blue-400" />
          Text Comparator
        </h1>
        <div className="flex gap-2 font-sans">
          <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900/80 rounded-md transition-colors font-semibold text-red-200">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          
          <button onClick={handleCompare} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">
            <ArrowRightLeft className="w-4 h-4" /> Compare
          </button>

          {diffResult && (
            <button onClick={() => setDiffResult(null)} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors font-semibold">
              Edit View
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {!diffResult ? (
        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0 font-sans">
          {[
            { side: 'left', val: leftText, set: setLeftText, label: 'Original File (JSON, TXT, Log...)' },
            { side: 'right', val: rightText, set: setRightText, label: 'Modified File (JSON, TXT, Log...)' }
          ].map((col) => (
            <div key={col.side} className="flex flex-col gap-2 h-full">
              <div className="flex justify-between items-center text-gray-400">
                <span className="font-semibold">{col.label}</span>
                <div className="flex gap-2">
                   <button onClick={() => loadFile(col.side as any)} className="flex items-center gap-1 p-1 px-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-xs transition" title="Load File">
                     <FileUp className="w-4 h-4" /> Load
                   </button>
                   <button onClick={() => pasteClipboard(col.side as any)} className="flex items-center gap-1 p-1 px-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] rounded text-xs transition" title="Paste from Clipboard">
                     <ClipboardPaste className="w-4 h-4" /> Paste
                   </button>
                </div>
              </div>
              <textarea
                value={col.val}
                onChange={(e) => col.set(e.target.value)}
                className="flex-1 resize-none bg-[#1e1e1e] border border-gray-700 rounded-md p-4 text-gray-300 focus:outline-none focus:border-blue-500 whitespace-pre font-mono shadow-inner custom-scrollbar"
                placeholder="Paste or load text here..."
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex border border-gray-700 rounded-md min-h-0 bg-[#1e1e1e] overflow-hidden shadow-xl">
          {/* Left Panel */}
          <div 
            ref={leftRef} 
            onScroll={(e) => handleScroll(e, 'left')} 
            className="flex-1 overflow-auto border-r border-gray-700 hide-scrollbar"
          >
            <table className="w-full text-left border-collapse whitespace-pre">
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`l-${idx}`} className={`
                    ${r.leftType === 'modified-left' ? 'bg-[#5b5120]/40' : ''}
                    ${r.leftType === 'removed' ? 'bg-[#701e21]/40' : ''}
                    ${r.leftType === 'unchanged' ? 'hover:bg-[#2d2d2d]/30' : ''}
                  `}>
                    <td className="w-12 px-2 text-right text-gray-500 select-none border-r border-gray-700 bg-[#1e1e1e]">{r.leftNum}</td>
                    <td className="px-4 py-[2px]"><code className="language-javascript">{r.leftText !== null ? r.leftText : ' '}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Panel */}
          <div 
            ref={rightRef} 
            onScroll={(e) => handleScroll(e, 'right')} 
            className="flex-1 overflow-auto hide-scrollbar"
          >
             <table className="w-full text-left border-collapse whitespace-pre">
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`r-${idx}`} className={`
                    ${r.rightType === 'modified-right' ? 'bg-[#5b5120]/40' : ''}
                    ${r.rightType === 'added' ? 'bg-[#1b4a22]/40' : ''}
                    ${r.rightType === 'unchanged' ? 'hover:bg-[#2d2d2d]/30' : ''}
                  `}>
                    <td className="w-12 px-2 text-right text-gray-500 select-none border-r border-gray-700 bg-[#1e1e1e]">{r.rightNum}</td>
                    <td className="px-4 py-[2px]"><code className="language-javascript">{r.rightText !== null ? r.rightText : ' '}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Summary */}
      {diffResult && (
        <div className="bg-[#252526] p-3 rounded-md flex justify-between items-center text-gray-400 font-sans border border-gray-700">
          <div className="flex gap-6 items-center">
             <span className="font-semibold text-gray-300">Differences Summary:</span>
             <span className="text-yellow-500 flex items-center gap-2"><span className="w-3 h-3 bg-[#5b5120] border border-yellow-700 rounded-sm"></span> {rows.filter(r => r.leftType === 'modified-left').length} Modified Lines</span>
             <span className="text-green-500 flex items-center gap-2"><span className="w-3 h-3 bg-[#1b4a22] border border-green-700 rounded-sm"></span> {rows.filter(r => r.rightType === 'added').length} Added Lines</span>
             <span className="text-red-500 flex items-center gap-2"><span className="w-3 h-3 bg-[#701e21] border border-red-700 rounded-sm"></span> {rows.filter(r => r.leftType === 'removed').length} Removed Lines</span>
          </div>
          <div className="flex gap-3">
             <button onClick={() => exportReport('html')} className="flex items-center gap-1 hover:text-white transition px-3 py-1 bg-[#333] rounded-md"><Download className="w-4 h-4"/> HTML Report</button>
             <button onClick={() => exportReport('txt')} className="flex items-center gap-1 hover:text-white transition px-3 py-1 bg-[#333] rounded-md"><FileText className="w-4 h-4"/> TXT Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
