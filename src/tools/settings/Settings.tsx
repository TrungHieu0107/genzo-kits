import { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Monitor, 
  ArrowRightLeft, 
  FileEdit, 
  RotateCcw
} from "lucide-react";
import { useSettingsStore } from "./store";
import { useToastStore } from "../../components/toastStore";
import { useConfigStore } from "../../components/configStore";
import { fs } from "../../hooks/useFontSize";
import { FontSizeSettings } from "./components/FontSizeSettings";

export function Settings() {
  const { 
    general, 
    tools, 
    updateGeneral,
    updateGeneralEditor,
    updateToolSettings,
    resetAll 
  } = useSettingsStore();

  const [activeCategory, setActiveCategory] = useState<'general' | 'text-comparator' | 'note-editor'>('general');
  const { showToast } = useToastStore();
  const { renderWhitespace, updateConfig } = useConfigStore();

  const triggerSaveGhost = () => {
    showToast("Settings saved successfully", "success");
  };

  const categories = [
    { id: 'general', name: 'General', icon: Monitor },
    { id: 'text-comparator', name: 'Text Comparator', icon: ArrowRightLeft },
    { id: 'note-editor', name: 'Note Editor', icon: FileEdit },
  ] as const;

  return (
    <div className="flex h-full bg-[#1e1e1e] text-gray-300 font-sans">
      {/* Settings Navigation */}
      <div className="w-[250px] border-r border-[#2d2d2d] bg-[#252526] flex flex-col p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" />
          <h1 style={fs.heading} className="font-bold text-white uppercase tracking-wider">Settings</h1>
        </div>

        <nav className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all ${
                activeCategory === cat.id 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                  : 'hover:bg-[#2d2d2d] text-gray-400'
              }`}
            >
              <cat.icon className="w-4 h-4" />
              <span style={fs.bodySm} className="font-medium">{cat.name}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#2d2d2d]">
           <button 
             onClick={() => { if(confirm("Reset all settings to default?")) resetAll(); }}
             className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded w-full transition"
             style={fs.caption}
            >
             <RotateCcw className="w-3.5 h-3.5" /> Reset All Settings
           </button>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-12 max-w-4xl relative">
        {activeCategory === 'general' && (
          <div className="space-y-10 animate-fade-in">
            <section>
              <h2 style={fs.headingLg} className="font-semibold text-white mb-6 flex items-center gap-2">
                  <Monitor className="w-5 h-5" /> Editor Appearance
              </h2>
              <div className="grid grid-cols-2 gap-8 bg-[#252526] p-8 rounded-xl border border-[#2d2d2d]">
                <div className="space-y-2">
                  <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Font Size</label>
                  <input 
                    type="number" 
                    value={general.editor.fontSize}
                    onChange={(e) => {
                        updateGeneralEditor({ fontSize: parseInt(e.target.value) });
                        triggerSaveGhost();
                    }}
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Font Family</label>
                  <select 
                    value={general.editor.fontFamily}
                    onChange={(e) => {
                        updateGeneralEditor({ fontFamily: e.target.value });
                        triggerSaveGhost();
                    }}
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                  >
                    <option value="monospace">Monospace</option>
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="'Fira Code', monospace">Fira Code</option>
                    <option value="Inter, sans-serif">Inter Sans</option>
                  </select>
                </div>
                <div className="space-y-2">
                    <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Word Wrap</label>
                    <select 
                        value={general.editor.wordWrap}
                        onChange={(e) => {
                            updateGeneralEditor({ wordWrap: e.target.value as 'on' | 'off' });
                            triggerSaveGhost();
                        }}
                        className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                    >
                        <option value="off">Off (Standard)</option>
                        <option value="on">On (Wrap lines)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Show Whitespace</label>
                    <select 
                        value={renderWhitespace}
                        onChange={(e) => {
                            updateConfig({ renderWhitespace: e.target.value as 'all' | 'none' });
                            triggerSaveGhost();
                        }}
                        className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                    >
                        <option value="none">None</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div className="flex items-center gap-4 mt-8">
                    <input 
                      type="checkbox"
                      id="minimap"
                      checked={general.editor.minimap}
                      onChange={(e) => {
                          updateGeneralEditor({ minimap: e.target.checked });
                          triggerSaveGhost();
                      }}
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                    <label htmlFor="minimap" style={fs.body} className="text-gray-300 cursor-pointer">Show Editor Minimap</label>
                </div>
              </div>
              <div className="border-t border-[#2d2d2d] my-10 pt-10">
                <FontSizeSettings />
                
                <div className="bg-[#252526] p-8 mt-8 rounded-xl border border-[#2d2d2d]">
                  <div className="space-y-4">
                    <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Toast Notification Position</label>
                    <select 
                        value={general.toastPosition || 'bottom-right'}
                        onChange={(e) => {
                        updateGeneral({ toastPosition: e.target.value as any });
                        triggerSaveGhost();
                        }}
                        className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                    >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="bottom-center">Bottom Center</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeCategory === 'text-comparator' && (
          <div className="space-y-10 animate-fade-in">
             <section>
                <h2 style={fs.headingLg} className="font-semibold text-white mb-6 flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5" /> Text Comparator Settings
                </h2>
                <div className="space-y-6 bg-[#252526] p-8 rounded-xl border border-[#2d2d2d]">
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded border border-[#3d3d3d] hover:border-blue-500/50 transition">
                        <div>
                            <div style={fs.body} className="font-bold text-white">Highlight Whitespace Diffs</div>
                            <div style={fs.caption} className="text-gray-500">Detect differences in trailing spaces and indentation.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={tools['text-comparator'].includeWhitespace}
                          onChange={(e) => {
                              updateToolSettings('text-comparator', { includeWhitespace: e.target.checked });
                              triggerSaveGhost();
                          }}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#1e1e1e] rounded border border-[#3d3d3d] hover:border-blue-500/50 transition">
                        <div>
                            <div style={fs.body} className="font-bold text-white">Highlight Row Background</div>
                            <div style={fs.caption} className="text-gray-500">Show a faint background highlight on the whole line that changed.</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={tools['text-comparator'].showRowHighlight}
                          onChange={(e) => {
                              updateToolSettings('text-comparator', { showRowHighlight: e.target.checked });
                              triggerSaveGhost();
                          }}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                        />
                    </div>
                </div>
             </section>
          </div>
        )}

        {activeCategory === 'note-editor' && (
          <div className="space-y-10 animate-fade-in">
             <section>
                <h2 style={fs.headingLg} className="font-semibold text-white mb-6 flex items-center gap-2">
                    <FileEdit className="w-5 h-5" /> Note Editor Settings
                </h2>
                <div className="bg-[#252526] p-8 rounded-xl border border-[#2d2d2d] space-y-6">
                    <div className="space-y-2">
                        <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">Default Save Encoding</label>
                        <select 
                            value={tools['note-editor'].defaultEncoding}
                            onChange={(e) => {
                                updateToolSettings('note-editor', { defaultEncoding: e.target.value });
                                triggerSaveGhost();
                            }}
                            className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded px-3 py-2 outline-none focus:border-blue-500 transition"
                        >
                            <option value="UTF-8">UTF-8 (Standard)</option>
                            <option value="Shift_JIS">Shift JIS</option>
                            <option value="Windows-1252">Windows 1252</option>
                            <option value="UTF-16LE">UTF-16 LE</option>
                        </select>
                    </div>
                </div>
             </section>
          </div>
        )}

        <div style={fs.nano} className="mt-20 p-8 border-t border-[#2d2d2d] text-center text-gray-600 uppercase tracking-[0.2em]">
            Genzo-Kit System Console • Settings v1.0
        </div>
      </div>
    </div>
  );
}
