import { useEffect } from "react";
import { DiffEditor, loader } from "@monaco-editor/react";
import { useTextComparator } from "./hooks/useTextComparator";
import { ComparatorHeader } from "./components/ComparatorHeader";
import { StatusBar } from "../../components/StatusBar";
import { useEditorConfig } from "../../components/useEditorConfig";

export function TextComparator() {
  const {
    leftEncoding, rightEncoding,
    settings, updateToolSettings,
    activeLanguage, setActiveLanguage,
    handleEditorDidMount,
    loadFile,
    handleEncodingChange,
    pasteClipboard,
    clearAll
  } = useTextComparator();

  const { getCommonOptions, config } = useEditorConfig();

  // Define custom theme for granular diff highlighting
  useEffect(() => {
    loader.init().then(monaco => {
        const defineGenzoTheme = (showHighlight: boolean) => {
            const themeName = showHighlight ? 'genzo-diff-theme-highlight' : 'genzo-diff-theme-no-highlight';
            monaco.editor.defineTheme(themeName, {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'diffEditor.insertedLineBackground': showHighlight ? '#2ea04320' : '#00000000',
                    'diffEditor.removedLineBackground': showHighlight ? '#f8514920' : '#00000000',
                    'diffEditor.insertedTextBackground': '#2ea04360',
                    'diffEditor.removedTextBackground': '#f8514960',
                }
            });
            return themeName;
        };

        const themeName = defineGenzoTheme(settings.showRowHighlight);
        monaco.editor.setTheme(themeName);
    });
  }, [settings.showRowHighlight]);

  return (
    <div className="flex flex-col h-full bg-[#181818] overflow-hidden">
      <ComparatorHeader 
        leftEncoding={leftEncoding}
        rightEncoding={rightEncoding}
        onEncodingChange={handleEncodingChange}
        onLoadFile={loadFile}
        onPaste={pasteClipboard}
        showRowHighlight={settings.showRowHighlight}
        onToggleHighlight={() => updateToolSettings('text-comparator', { showRowHighlight: !settings.showRowHighlight })}
        onClearAll={clearAll}
      />

      <div className="flex-1 bg-[#1E1E1E] min-h-0 overflow-hidden relative shadow-inner">
        <DiffEditor
          height="100%"
          onMount={handleEditorDidMount}
          theme={settings.showRowHighlight ? 'genzo-diff-theme-highlight' : 'genzo-diff-theme-no-highlight'}
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
