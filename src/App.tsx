import { useState, useEffect } from "react";
import { ToolSidebar } from "./tools/tool-manager/ToolSidebar";
import { tools } from "./tools/index";

function App() {
  const [activeToolId, setActiveToolId] = useState<string>(() => {
    return localStorage.getItem("genzoActiveTool") || tools[0].id;
  });
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("genzoSidebarCollapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("genzoActiveTool", activeToolId);
  }, [activeToolId]);

  useEffect(() => {
    localStorage.setItem("genzoSidebarCollapsed", isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  const activeTool = tools.find(t => t.id === activeToolId) || tools[0];
  const ActiveComponent = activeTool.component;

  return (
    <div className="flex w-full h-screen bg-[#1e1e1e] text-gray-200 overflow-hidden font-sans">
      <ToolSidebar 
        activeToolId={activeToolId} 
        onSelectTool={setActiveToolId} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 h-screen overflow-hidden relative">
         <ActiveComponent />
      </div>
    </div>
  );
}

export default App;
