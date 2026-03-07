import { Plus, PanelLeftClose, PanelLeft } from "lucide-react";
import { tools } from "../index";

interface ToolSidebarProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function ToolSidebar({ activeToolId, onSelectTool, isCollapsed, onToggleCollapse }: ToolSidebarProps) {
  return (
    <div className={`${isCollapsed ? "w-[68px]" : "w-[280px]"} h-screen bg-[#181818] border-r border-[#2d2d2d] flex flex-col flex-shrink-0 transition-all duration-300`}>
      {/* Header */}
      <div className={`p-4 border-b border-[#2d2d2d] flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? "hidden" : "flex"}`}>
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">G</div>
          <div>
            <h2 className="text-white font-bold tracking-wide">Genzo-Kit</h2>
            <p className="text-xs text-gray-500">v1.0+</p>
          </div>
        </div>
        <button 
          onClick={onToggleCollapse} 
          className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-[#2d2d2d]"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Tools List */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? "p-2" : "p-3"} flex flex-col gap-1 hide-scrollbar`}>
        {!isCollapsed && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 whitespace-nowrap">Installed Tools</div>}
        {tools.map((tool) => {
          const isActive = tool.id === activeToolId;
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              title={isCollapsed ? tool.name : undefined}
              className={`w-full flex items-start text-left ${isCollapsed ? "p-2 justify-center" : "p-3"} rounded-md transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-[#2d2d2d] text-white shadow-sm border border-[#3d3d3d]' 
                  : 'text-gray-400 hover:bg-[#252526] hover:text-gray-200 border border-transparent'
              }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? "" : "w-full"}`}>
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-blue-600/20 text-blue-400' : 'bg-[#1e1e1e] group-hover:bg-[#2d2d2d]'}`}>
                  <Icon className="w-5 h-5" />
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

      {/* Footer / Add New Tool */}
      <div className={`p-4 border-t border-[#2d2d2d] ${isCollapsed ? "flex justify-center" : ""}`}>
        <button 
          title={isCollapsed ? "Add New Tool" : undefined}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-[#252526] hover:bg-[#2d2d2d] text-gray-300 font-semibold border border-[#3d3d3d] transition hover:text-white ${isCollapsed ? "w-10 h-10 p-0" : "w-full"}`}
          onClick={() => alert("Stub: Implement modal to scaffold new tool folder structure.")}
        >
          <Plus className="w-4 h-4" /> {!isCollapsed && <span className="whitespace-nowrap">Add New Tool</span>}
        </button>
      </div>
    </div>
  );
}
