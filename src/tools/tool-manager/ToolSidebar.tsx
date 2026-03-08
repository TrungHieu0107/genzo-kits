import { 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { tools } from "../index";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

interface ToolSidebarProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ToolSidebar({ activeToolId, onSelectTool, isCollapsed, onToggleCollapse }: ToolSidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, toolId: string } | null>(null);

  const handleOpenInNewWindow = async (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    
    const windowLabel = `window_${toolId}_${Date.now()}`;
    const webview = new WebviewWindow(windowLabel, {
      url: `/?window=${toolId}`,
      title: `Genzo-Kit - ${tool.name}`,
      width: 1000,
      height: 700,
      decorations: true,
      resizable: true,
      center: true
    });

    webview.once('tauri://error', function (e) {
      console.error('Error opening window', e);
    });
  };

  return (
    <div className={`${isCollapsed ? "w-[68px]" : "w-[280px]"} h-screen bg-[#181818] border-r border-[#2d2d2d] flex flex-col flex-shrink-0 transition-all duration-300 relative`}>
      {/* Header */}
      <div className={`p-4 border-b border-[#2d2d2d] flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "hidden" : "flex"}`}>
          <img src="/logo.png" className="w-6 h-6 rounded object-cover shadow-lg" alt="Genzo" />
          <div>
            <h2 className="text-white font-bold tracking-wide">Genzo-Kit</h2>
            <p className="text-xs text-gray-500">v1.0+</p>
          </div>
        </div>
        <button 
          onClick={onToggleCollapse}
          className="p-2 hover:bg-[#3C3C3D] rounded-md transition-colors text-gray-400 hover:text-white"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Tools List */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-2" : "p-3"} flex flex-col gap-1 hide-scrollbar`}>
        {!isCollapsed && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Installed Tools</div>}
        {tools.filter(t => t.id !== 'settings').map((tool) => {
          const isActive = tool.id === activeToolId;
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, toolId: tool.id });
              }}
              title={isCollapsed ? tool.name : undefined}
              className={`w-full flex items-start text-left ${isCollapsed ? "p-2 justify-center" : "p-3"} rounded-md transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-[#2d2d2d] text-white shadow-sm border border-[#3d3d3d]' 
                  : 'text-gray-400 hover:bg-[#252526] hover:text-gray-200 border border-transparent'
              }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? "" : "w-full"}`}>
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-600/20 text-blue-400' : 'bg-[#1e1e1e] group-hover:bg-[#2d2d2d]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{tool.name}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{tool.description}</div>
                  </div>
                )}
              </div>
              {/* Active Indicator */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-blue-500 rounded-r-md ${isCollapsed ? "h-6" : "h-8"}`}></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Settings Launcher */}
      {/* Footer / Nút mở Settings */}
      <div className={`p-4 border-t border-[#2d2d2d] ${isCollapsed ? "flex justify-center" : ""}`}>
        {(() => {
          const settingsTool = tools.find(t => t.id === 'settings');
          if (!settingsTool) return null;
          const isActive = activeToolId === 'settings';
          const Icon = settingsTool.icon;
          
          return (
            <button 
              title={isCollapsed ? "Settings" : undefined}
              className={`flex items-center ${isCollapsed ? "justify-center p-0 w-10 h-10" : "justify-start gap-3 py-2 px-4 w-full"} rounded-md transition-all duration-200 border ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-500' 
                    : 'bg-[#252526] hover:bg-[#2d2d2d] text-gray-400 hover:text-white border-[#3d3d3d]'
              }`}
              onClick={() => onSelectTool('settings')}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} /> 
              {!isCollapsed && <span className="font-semibold text-sm">Settings</span>}
            </button>
          );
        })()}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} />
          <div 
            className="fixed z-50 bg-[#252526] border border-[#454545] rounded-md shadow-xl py-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-3"
              onClick={() => {
                handleOpenInNewWindow(contextMenu.toolId);
                setContextMenu(null);
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Open in new window
            </button>
          </div>
        </>
      )}
    </div>
  );
}
