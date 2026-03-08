import { useConfigStore } from './configStore';

// Hook dùng chung để cấu hình Monaco Editor cho cả 2 tools
export function useEditorConfig() {
  const config = useConfigStore();

  const getCommonOptions = (overrides?: any) => {
    return {
      theme: config.theme,
      renderWhitespace: config.renderWhitespace,
      tabSize: config.tabSize,
      fontSize: config.fontSize,
      wordWrap: config.wordWrap,
      minimap: { enabled: true, scale: 0.75, renderCharacters: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      lineHeight: 22,
      ...overrides
    };
  };

  return { getCommonOptions, config };
}
