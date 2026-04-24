import { useConfigStore } from './configStore';

// Hook dùng chung để cấu hình Monaco Editor cho cả 2 tools
export function useEditorConfig() {
  const config = useConfigStore();

  const getCommonOptions = (overrides?: Record<string, unknown>): Record<string, unknown> => {
    return {
      theme: config.theme,
      renderWhitespace: config.renderWhitespace,
      tabSize: config.tabSize,
      fontSize: config.fontSize,
      wordWrap: config.wordWrap,
      minimap: { enabled: true, scale: 0.75, renderCharacters: false },
      scrollBeyondLastLine: true,
      automaticLayout: true,
      lineHeight: 22,
      stickyScroll: {
        enabled: config.stickyScrollEnabled,
        maxLineCount: config.stickyScrollMaxLines,
        defaultModel: 'outlineModel'
      },
      ...overrides
    };
  };

  return { getCommonOptions, config };
}
