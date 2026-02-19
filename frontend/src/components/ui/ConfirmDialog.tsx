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
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          isLight
            ? 'bg-white border border-slate-200'
            : 'bg-[#0f0f11] border border-gray-800/70'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${isLight ? 'border-slate-200' : 'border-gray-800/60'}`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
        </div>

        <div className="px-6 py-5">
          <p className={`text-sm whitespace-pre-wrap ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{message}</p>
        </div>

        <div className={`px-6 py-4 border-t flex items-center justify-end space-x-3 ${isLight ? 'border-slate-200' : 'border-gray-800/60'}`}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`cursor-pointer px-4 py-2 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 border-gray-700/50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${confirmClassName}`}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
