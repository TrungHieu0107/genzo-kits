import { useState, useEffect } from "react";
import { ToolSidebar } from "./tools/tool-manager/ToolSidebar";
import { tools } from "./tools/index";
import { GlobalToast } from "./components/GlobalToast";
import { useConfigStore } from "./components/configStore";

import { useAppStore } from "./store/appStore";

function App() {
  const [standaloneToolId, setStandaloneToolId] = useState<string | null>(null);
  const { activeToolId, setActiveTool, isSidebarCollapsed, setSidebarCollapsed } = useAppStore();

  // Load global config on startup
  useEffect(() => {
    useConfigStore.getState().loadConfig();
    
    // Check if we are running in a standalone window mode
    const params = new URLSearchParams(window.location.search);
    const windowParam = params.get('window');
    if (windowParam) {
      setStandaloneToolId(windowParam);
    }
  }, []);

  // Global Keyboard Shortcuts
  // Phím tắt bàn phím toàn cục
  // Fix: Dùng Tauri global-shortcut plugin để hoạt động trên cả bản build .exe
  // Fix: Use Tauri global-shortcut plugin so it works in production .exe builds
  useEffect(() => {
    let cleanupTauri: (() => void) | null = null;

    // Đăng ký shortcut qua Tauri plugin (hoạt động ở cả dev và production)
    // Register shortcut via Tauri plugin (works in both dev and production)
    const registerTauriShortcut = async () => {
      try {
        const { register, unregister } = await import('@tauri-apps/plugin-global-shortcut');
        await register('Ctrl+Shift+S', () => {
          setActiveTool('settings');
        });
        await register('Ctrl+N', () => {
          setActiveTool('note-editor');
        });
        await register('Ctrl+C', () => {
          setActiveTool('text-comparator');
        });
        cleanupTauri = () => {
          unregister('Ctrl+Shift+S').catch(() => {});
          unregister('Ctrl+N').catch(() => {});
          unregister('Ctrl+C').catch(() => {});
        };
      } catch {
        // Fallback: nếu không có Tauri (dev browser), dùng keydown listener
        // Fallback: if Tauri is not available (dev browser), use keydown listener
        console.log('[Genzo] Tauri global-shortcut not available, using browser fallback');
      }
    };
    registerTauriShortcut();

    // Browser fallback (cho dev mode khi chạy trên browser thuần)
    // Browser fallback (for dev mode when running in plain browser)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTool("settings");
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);

    return () => {
      if (cleanupTauri) cleanupTauri();
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, []);

  const activeTool = tools.find(t => t.id === activeToolId) || tools[0];
  const ActiveComponent = activeTool.component;

  // Render standalone mode if ?window=X is found in URL
  if (standaloneToolId) {
    const StandaloneTool = tools.find(t => t.id === standaloneToolId);
    if (!StandaloneTool) {
      return <div className="p-8 text-red-500 font-bold">Error: Unknown Tool ID</div>;
    }
    const ToolComponent = StandaloneTool.component;
    return (
      <div className="flex w-full h-screen bg-[#1e1e1e] text-gray-200 overflow-hidden font-sans">
        <div className="flex-1 h-screen overflow-hidden relative">
           <ToolComponent />
        </div>
        <GlobalToast />
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#1e1e1e] text-gray-200 overflow-hidden font-sans">
      <ToolSidebar 
        activeToolId={activeToolId} 
        onSelectTool={setActiveTool} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 h-screen overflow-hidden relative">
         <ActiveComponent />
      </div>
      
      <GlobalToast />
    </div>
  );
}

export default App;
