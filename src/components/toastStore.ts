import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  toastData: { msg: string; type: ToastType } | null;
  timeoutId: number | null;
  showToast: (msg: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toastData: null,
  timeoutId: null,

  showToast: (msg: string, type: ToastType = 'info') => {
    // Clear any existing timeout
    const currentTimeout = get().timeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);

    // Set new toast
    set({ toastData: { msg, type } });

    // Auto hide after 3 seconds
    const newTimeout = setTimeout(() => {
      set({ toastData: null, timeoutId: null });
    }, 3000);

    set({ timeoutId: newTimeout });
  },

  hideToast: () => {
    const currentTimeout = get().timeoutId;
    if (currentTimeout) clearTimeout(currentTimeout);
    set({ toastData: null, timeoutId: null });
  }
}));
