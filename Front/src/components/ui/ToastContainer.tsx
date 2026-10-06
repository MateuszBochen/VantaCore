import {useSyncExternalStore} from 'react';
import {cn} from '@/lib/utils';
import {toastService} from '../../lib/Toast/ToastService';

const ToastContainer = () => {
  const toasts = useSyncExternalStore(toastService.subscribe, toastService.getSnapshot);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={cn(
            'pointer-events-auto flex items-start justify-between gap-3 rounded-xl border p-3 text-sm shadow-lg backdrop-blur-md',
            toast.variant === 'error'
              ? 'border-red-500/40 bg-red-950/80 text-red-100'
              : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-100'
          )}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-xs text-white/60 hover:text-white"
            onClick={() => toastService.dismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;