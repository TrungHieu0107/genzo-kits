import { useConfigStore } from './configStore';
import { AlignLeft, Columns } from 'lucide-react';

interface StatusBarProps {
  activeFileName?: string;
  activeLanguage?: string;
  activeEncoding?: string;
  isCompareMode?: boolean;
  onLanguageChange?: (newLanguage: string) => void;
  onEncodingChange?: (newEncoding: string) => void;
}

export function StatusBar({ 
  activeFileName = "Genzo-Kit", 
  activeLanguage = "plaintext", 
  activeEncoding = "UTF-8",
  isCompareMode = false,
  onLanguageChange,
  onEncodingChange
}: StatusBarProps) {
  const { theme, renderWhitespace, ignoreTrimWhitespace, updateConfig } = useConfigStore();

  const toggleWhitespaceRender = () => {
    updateConfig({ renderWhitespace: renderWhitespace === 'all' ? 'none' : 'all' });
  };

  const toggleIgnoreWhitespaceDiff = () => {
    updateConfig({ ignoreTrimWhitespace: !ignoreTrimWhitespace });
  };

  return (
    <div className={`h-[22px] flex items-center px-3 justify-between text-white text-[11px] select-none shrink-0 ${theme === 'vs-dark' ? 'bg-[#007ACC]' : 'bg-[#005fb8]'}`}>
      <div className="flex items-center gap-4 h-full">
        <span>{activeFileName}</span>
      </div>
      
      <div className="flex items-center gap-4 h-full">
        {/* Whitespace Rendering Selector */}
        <button 
          onClick={toggleWhitespaceRender}
          className={`px-1.5 flex items-center gap-1 hover:bg-white/20 transition rounded-sm ${renderWhitespace === 'all' ? 'bg-white/10' : ''}`}
          title="Toggle Whitespace Rendering"
        >
          <AlignLeft className="w-3 h-3" />
        </button>

        {/* Compare Mode Specific Toggles */}
        {isCompareMode && (
          <button 
            onClick={toggleIgnoreWhitespaceDiff}
            className={`px-1.5 flex items-center gap-1 hover:bg-white/20 transition rounded-sm ${!ignoreTrimWhitespace ? 'bg-white/10' : ''}`}
            title="Include Whitespace in Diff"
          >
            <Columns className="w-3 h-3" /> Diff Whitespace
          </button>
        )}

        {/* Encoding Dropdown */}
        <select
          className="bg-transparent hover:bg-white/10 outline-none appearance-none cursor-pointer"
          value={activeEncoding}
          onChange={(e) => onEncodingChange && onEncodingChange(e.target.value)}
          disabled={!onEncodingChange}
        >
          <option value="UTF-8" className="bg-[#252526]">UTF-8</option>
          <option value="Shift_JIS" className="bg-[#252526]">Shift JIS</option>
          <option value="windows-1252" className="bg-[#252526]">Windows 1252</option>
          <option value="UTF-16LE" className="bg-[#252526]">UTF-16 LE</option>
        </select>

        {/* Language Mode Selector */}
        <select
          className="bg-transparent hover:bg-white/10 outline-none appearance-none cursor-pointer uppercase"
          value={activeLanguage}
          onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
          disabled={!onLanguageChange}
        >
          <option value="plaintext" className="bg-[#252526]">Plain Text</option>
          <option value="javascript" className="bg-[#252526]">JavaScript</option>
          <option value="typescript" className="bg-[#252526]">TypeScript</option>
          <option value="json" className="bg-[#252526]">JSON</option>
          <option value="html" className="bg-[#252526]">HTML</option>
          <option value="css" className="bg-[#252526]">CSS</option>
          <option value="scss" className="bg-[#252526]">SCSS</option>
          <option value="markdown" className="bg-[#252526]">Markdown</option>
          <option value="python" className="bg-[#252526]">Python</option>
          <option value="java" className="bg-[#252526]">Java</option>
          <option value="rust" className="bg-[#252526]">Rust</option>
          <option value="cpp" className="bg-[#252526]">C/C++</option>
          <option value="csharp" className="bg-[#252526]">C#</option>
          <option value="go" className="bg-[#252526]">Go</option>
          <option value="php" className="bg-[#252526]">PHP</option>
          <option value="ruby" className="bg-[#252526]">Ruby</option>
          <option value="swift" className="bg-[#252526]">Swift</option>
          <option value="kotlin" className="bg-[#252526]">Kotlin</option>
          <option value="sql" className="bg-[#252526]">SQL</option>
          <option value="xml" className="bg-[#252526]">XML</option>
          <option value="yaml" className="bg-[#252526]">YAML</option>
          <option value="toml" className="bg-[#252526]">TOML</option>
          <option value="ini" className="bg-[#252526]">INI</option>
          <option value="shell" className="bg-[#252526]">Shell</option>
          <option value="dockerfile" className="bg-[#252526]">Dockerfile</option>
        </select>
      </div>
    </div>
  );
}
