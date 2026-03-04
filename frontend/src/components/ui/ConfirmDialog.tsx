import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!open) return null;

  const confirmClassName =
    tone === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white border border-red-500/50'
      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white border border-blue-400/45';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-2xl ${isLight ? 'bg-white border border-slate-200 shadow-[0_20px_38px_-24px_rgba(15,23,42,0.45)]' : 'nebula-panel'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b px-6 py-4 ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
        </div>

        <div className="px-6 py-5">
          <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{message}</p>
        </div>

        <div className={`border-t px-6 py-4 flex items-center justify-end gap-3 ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isLight
                ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                : 'border-slate-600/70 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
