import { useToastStore } from './toastStore';
import { useSettingsStore } from '../tools/settings/store';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { fs } from '../hooks/useFontSize';

export function GlobalToast() {
  const { toastData } = useToastStore();
  const { general } = useSettingsStore();

  if (!toastData) return null;

  const pos = general.toastPosition || 'bottom-right';
  let posClasses = '';

  switch (pos) {
    case 'bottom-right': posClasses = 'bottom-6 right-6 animate-fade-in-up'; break;
    case 'bottom-left': posClasses = 'bottom-6 left-6 animate-fade-in-up'; break;
    case 'bottom-center': posClasses = 'bottom-6 left-1/2 -translate-x-1/2 animate-fade-in-up'; break;
    case 'top-right': posClasses = 'top-6 right-6 animate-fade-in-down'; break;
    case 'top-left': posClasses = 'top-6 left-6 animate-fade-in-down'; break;
    case 'top-center': posClasses = 'top-6 left-1/2 -translate-x-1/2 animate-fade-in-down'; break;
  }

  return (
    <div 
      style={fs.body}
      className={`fixed flex items-center gap-3 px-4 py-3 rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.5)] border z-[9999] transition-colors pointer-events-none ${posClasses}
      ${toastData.type === 'error' ? 'bg-[#3b0000] border-[#f14c4c] text-[#f14c4c]' : 
        toastData.type === 'success' ? 'bg-[#002f14] border-[#1da1f2] text-[#1da1f2]' : 
        'bg-[#1e1e1e] border-[#3c3c3c] text-gray-200'
      }`}
    >
      {toastData.type === 'success' ? <CheckCircle2 className="w-[18px] h-[18px] text-green-400" /> : 
       toastData.type === 'error' ? <XCircle className="w-[18px] h-[18px] text-red-400" /> :
       <Info className="w-[18px] h-[18px] text-blue-400" />}
      <span className="font-medium tracking-wide">{toastData.msg}</span>
    </div>
  );
}
