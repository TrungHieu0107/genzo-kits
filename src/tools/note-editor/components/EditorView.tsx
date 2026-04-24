import React from 'react';
import Editor from "@monaco-editor/react";
import { Plus } from "lucide-react";
import { EditorFile } from "../store";

interface EditorViewProps {
  activeFile: EditorFile | undefined;
  theme: string;
  options: Record<string, unknown>;
  onContentChange: (id: string, content: string) => void;
  onMount: (editor: any, monaco: any) => void;
}

export const EditorView = React.memo<EditorViewProps>(({
  activeFile, theme, options, onContentChange, onMount
}) => {
  const isBinary = activeFile?.content === "Binary file or unsupported encoding.";

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-20 text-gray-400">
        <div className="p-8 rounded-full bg-white/5 mb-6">
          <Plus className="w-16 h-16" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.2em]">Select a file to begin editing</p>
      </div>
    );
  }

  if (isBinary) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 uppercase tracking-widest text-xs font-medium">
        Binary file or unsupported encoding
      </div>
    );
  }

  return (
    <div className="flex-1 relative min-h-0">
      <Editor
        height="100%"
        theme={theme}
        path={activeFile.id}
        language={activeFile.language}
        value={activeFile.content}
        onChange={(v) => onContentChange(activeFile.id, v || "")}
        onMount={onMount}
        options={options}
      />
    </div>
  );
};
