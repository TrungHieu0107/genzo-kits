import { Monitor, RotateCcw } from "lucide-react";
import { useSettingsStore } from "../store";
import { fs } from "../../../hooks/useFontSize";

export function FontSizeSettings() {
  const { general, updateGeneralUI } = useSettingsStore();
  const fontSize = general?.ui?.fontSize || 13;

  return (
    <section className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 style={fs.headingLg} className="font-semibold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5" /> Interface Design
        </h2>
        <button 
          onClick={() => { if(confirm("Reset interface scale to default?")) updateGeneralUI({ fontSize: 13 }); }}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-blue-400 transition-colors"
          style={fs.caption}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Scale
        </button>
      </div>
      
      <div className="bg-[#252526] p-8 rounded-xl border border-[#2d2d2d] space-y-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
              <label style={fs.caption} className="uppercase tracking-widest text-gray-500 font-bold">App UI Font Size (Base)</label>
              <span style={fs.nano} className="px-2 py-1 bg-blue-600/20 text-blue-400 font-mono rounded border border-blue-500/20">
                  {fontSize}px
              </span>
          </div>
          
          <div className="flex items-center gap-4">
              <span style={fs.nano} className="text-gray-500 font-bold">Small</span>
              <input 
                  type="range" 
                  min="11" 
                  max="17" 
                  step="1"
                  value={fontSize}
                  onChange={(e) => {
                      updateGeneralUI({ fontSize: parseInt(e.target.value) });
                  }}
                  className="flex-1 h-1.5 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
              />
              <span style={fs.display} className="text-gray-300 font-bold">Large</span>
          </div>

          {/* Token Preview Matrix */}
          <div className="p-6 bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] border-dashed relative overflow-hidden group">
              <div style={fs.nano} className="absolute top-2 right-3 text-gray-600 uppercase tracking-tighter">Live Preview</div>
              <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-[#2d2d2d] pb-3 last:border-0 last:pb-0">
                    <div className="w-24 text-gray-600 uppercase tracking-widest font-black" style={fs.nano}>Nano</div>
                    <div className="flex gap-2">
                        <span style={fs.nano} className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20 font-bold">Tag Badge</span>
                        <span style={fs.nano} className="text-gray-500">12:34:56</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-b border-[#2d2d2d] pb-3 last:border-0 last:pb-0">
                    <div className="w-24 text-gray-600 uppercase tracking-widest font-black" style={fs.nano}>Caption</div>
                    <div style={fs.caption} className="text-gray-400">Secondary info or table metadata</div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-b border-[#2d2d2d] pb-3 last:border-0 last:pb-0">
                    <div className="w-24 text-gray-600 uppercase tracking-widest font-black" style={fs.nano}>Body</div>
                    <div style={fs.body} className="text-gray-200">The quick brown fox jumps over the lazy dog.</div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-b border-[#2d2d2d] pb-3 last:border-0 last:pb-0">
                    <div className="w-24 text-gray-600 uppercase tracking-widest font-black" style={fs.nano}>Heading</div>
                    <div style={fs.heading} className="text-white font-bold">Tool Configuration Panel</div>
                  </div>

                  <div className="flex items-center gap-4 border-b border-[#2d2d2d] pb-3 last:border-0 last:pb-0">
                    <div className="w-24 text-gray-600 uppercase tracking-widest font-black" style={fs.nano}>Display</div>
                    <div style={fs.display} className="text-blue-400 font-black">GENZO-KIT</div>
                  </div>
              </div>
          </div>
        </div>

        <div style={fs.caption} className="text-gray-500 italic text-center px-4">
            * All UI elements (sidebar, tables, buttons) scale proportionally based on the base body size.
        </div>
      </div>
    </section>
  );
}
