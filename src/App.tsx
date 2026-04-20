import { useState, useEffect, Suspense } from "react";
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
        
        // CHỈ dùng Global Shortcut cho Settings (Ctrl+Shift+S)
        // ONLY use Global Shortcut for Settings (Ctrl+Shift+S)
        await register('Ctrl+Shift+S', () => {
          setActiveTool('settings');
        });

        cleanupTauri = () => {
          unregister('Ctrl+Shift+S').catch(() => {});
        };
      } catch {
        console.log('[Genzo] Tauri global-shortcut not available, using browser fallback');
      }
    };
    registerTauriShortcut();

    // Browser fallback & Local Shortcuts (Xử lý switch tool tại window level)
    // Browser fallback & Local Shortcuts (Handle tool switching at window level)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+S: Settings (Local fallback)
      if (e.ctrlKey && e.shiftKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTool("settings");
      }
      
      // Ctrl+Alt+N: Switch to Note Editor (Không chặn Ctrl+N mặc định)
      // Ctrl+Alt+N: Switch to Note Editor (Does not block default Ctrl+N)
      if (e.ctrlKey && e.altKey && (e.code === 'KeyN' || e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTool("note-editor");
      }

      // Ctrl+Alt+C: Switch to Text Comparator (Không chặn Ctrl+C mặc định)
      // Ctrl+Alt+C: Switch to Text Comparator (Does not block default Ctrl+C)
      if (e.ctrlKey && e.altKey && (e.code === 'KeyC' || e.key.toLowerCase() === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        setActiveTool("text-comparator");
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
           <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">Loading Tool...</div>}>
             <ToolComponent />
           </Suspense>
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
         <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-gray-500">Loading Tool...</div>}>
           <ActiveComponent />
         </Suspense>
      </div>
      
      <GlobalToast />
    </div>
  );
}

export default App;
