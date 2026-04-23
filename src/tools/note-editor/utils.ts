import React from 'react';
import { 
  FileCode, File, FileJson, FileType, Globe, 
  Terminal, Database, FileText 
} from "lucide-react";

/**
 * Helper to determine Monaco language from filename
 */
export const getLanguageFromPath = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'md': return 'markdown';
    case 'rs': return 'rust';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'cpp':
    case 'c':
    case 'h': return 'cpp';
    case 'xml': return 'xml';
    case 'sql': return 'sql';
    case 'sh':
    case 'bat': return 'shell';
    case 'yml':
    case 'yaml': return 'yaml';
    case 'toml': return 'toml';
    case 'ini': return 'ini';
    case 'txt': return 'plaintext';
    default: return 'plaintext';
  }
};

/**
 * Helper for file icons based on language mode
 */
export const getFileIcon = (language: string) => {
  const props = { className: "w-4 h-4" };
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      return React.createElement(FileCode, { ...props, className: `${props.className} text-yellow-400` });
    case 'json':
      return React.createElement(FileJson, { ...props, className: `${props.className} text-green-400` });
    case 'html':
    case 'css':
    case 'scss':
      return React.createElement(Globe, { ...props, className: `${props.className} text-orange-400` });
    case 'markdown':
      return React.createElement(FileType, { ...props, className: `${props.className} text-blue-400` });
    case 'python':
    case 'java':
    case 'csharp':
    case 'cpp':
    case 'ruby':
    case 'php':
    case 'swift':
    case 'kotlin':
    case 'rust':
    case 'go':
      return React.createElement(FileCode, { ...props, className: `${props.className} text-purple-400` });
    case 'sql':
      return React.createElement(Database, { ...props, className: `${props.className} text-pink-400` });
    case 'shell':
    case 'dockerfile':
      return React.createElement(Terminal, { ...props, className: `${props.className} text-gray-300` });
    case 'plaintext':
      return React.createElement(FileText, { ...props, className: `${props.className} text-gray-400` });
    default:
      return React.createElement(File, { ...props, className: `${props.className} text-gray-400` });
  }
};
