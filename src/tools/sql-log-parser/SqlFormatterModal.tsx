import { format } from 'sql-formatter';
import { X, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface SqlFormatterModalProps {
  sql: string;
  isOpen: boolean;
  onClose: () => void;
}

const DIALECTS = [
  { id: 'sql', name: 'Standard SQL' },
  { id: 'postgresql', name: 'PostgreSQL' },
  { id: 'mysql', name: 'MySQL' },
  { id: 'tsql', name: 'T-SQL (SQL Server)' },
  { id: 'plsql', name: 'PL/SQL (Oracle)' },
  { id: 'sqlite', name: 'SQLite' },
  { id: 'db2', name: 'DB2' },
  { id: 'mariadb', name: 'MariaDB' },
  { id: 'bigquery', name: 'BigQuery' },
  { id: 'snowflake', name: 'Snowflake' }
];

export function SqlFormatterModal({ sql, isOpen, onClose }: SqlFormatterModalProps) {
  const [formattedSql, setFormattedSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [dialect, setDialect] = useState('postgresql');

  useEffect(() => {
    if (isOpen) {
      try {
        const formatted = format(sql, { 
          language: dialect as any,
          keywordCase: 'upper'
        });
        setFormattedSql(formatted);
      } catch (err) {
        setFormattedSql(sql);
      }
      setCopied(false);
    }
  }, [sql, isOpen, dialect]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className="bg-[#1E1E1E] w-full max-w-4xl max-h-[85vh] rounded-lg border border-[#3C3C3D] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - VSCode style tab bar */}
        <div className="h-10 border-b border-[#3C3C3D] bg-[#252526] flex items-center justify-between px-2">
          <div className="flex items-center gap-0">
            {/* Tab giống VSCode / VSCode-style tab */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1E1E1E] border-t-2 border-t-blue-500 border-r border-r-[#3C3C3D] text-gray-200 text-[13px]">
              <span className="text-blue-400 text-xs">SQL</span>
              <span>formatted_query.sql</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 border-r border-[#3C3C3D] pr-3 mr-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tight">SQL Dialect:</span>
              <select 
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
                className="bg-[#1E1E1E] border border-[#3C3C3D] text-[11px] text-gray-300 px-2 py-0.5 rounded outline-none hover:border-blue-500 transition-colors cursor-pointer"
              >
                {DIALECTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all ${copied ? 'bg-green-600/20 text-green-400' : 'hover:bg-[#3D3D3D] text-gray-400 hover:text-gray-200'}`}
              title="Copy formatted SQL"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monaco Editor - Read Only, giống giao diện VSCode */}
        {/* VSCode-like read-only Monaco Editor */}
        <div className="relative w-full h-[60vh] min-h-[450px]">
          <Editor
            height="100%"
            language="sql"
            theme="vs-dark"
            value={formattedSql}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              renderWhitespace: 'none',
              folding: true,
              lineDecorationsWidth: 10,
              padding: { top: 10 },
              domReadOnly: true,
              cursorStyle: 'line-thin',
            }}
          />
        </div>

        {/* Footer - Status bar giống VSCode */}
        {/* VSCode-like status bar */}
        <div className="h-6 bg-[#007ACC] flex items-center px-3 justify-between">
          <span className="text-[11px] text-white/90 font-medium">SQL • {DIALECTS.find(d => d.id === dialect)?.name} • Read Only</span>
          <span className="text-[11px] text-white/70">Ln {formattedSql.split('\n').length}, Col 1</span>
        </div>
      </div>
    </div>
  );
}
