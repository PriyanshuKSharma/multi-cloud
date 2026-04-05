import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TextInputDialogProps {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  value: string;
  error?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const TextInputDialog: React.FC<TextInputDialogProps> = ({
  open,
  title,
  description,
  label = 'Value',
  placeholder,
  value,
  error,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  onChange,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className={`w-full max-w-lg overflow-hidden rounded-2xl ${isLight ? 'bg-white border border-slate-200 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)]' : 'nebula-panel'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b px-6 py-4 ${isLight ? 'border-slate-200' : 'border-slate-700/70'}`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
          {description ? (
            <p className={`mt-1 text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{description}</p>
          ) : null}
        </div>

        <div className="space-y-3 px-6 py-5">
          <div>
            <label className={`mb-1 block text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{label}</label>
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                isLight
                  ? 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/30'
                  : 'border-slate-600/70 bg-slate-900/70 text-white placeholder:text-slate-500 focus:ring-blue-500/35'
              }`}
              placeholder={placeholder}
            />
          </div>

          {error ? <p className={`text-sm ${isLight ? 'text-red-700' : 'text-red-300'}`}>{error}</p> : null}
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
            className="rounded-xl border border-blue-400/45 bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInputDialog;
