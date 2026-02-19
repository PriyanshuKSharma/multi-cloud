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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-xl shadow-2xl ${
          isLight
            ? 'bg-white border border-slate-200'
            : 'bg-[#0f0f11] border border-gray-800/70'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`px-6 py-4 border-b ${isLight ? 'border-slate-200' : 'border-gray-800/60'}`}>
          <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
          {description && (
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{description}</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-3">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{label}</label>
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-blue-500/40'
                  : 'bg-gray-800/50 border-gray-700/50 text-white focus:ring-blue-500/50'
              }`}
              placeholder={placeholder}
            />
          </div>
          {error && <p className={`text-sm ${isLight ? 'text-red-700' : 'text-red-400'}`}>{error}</p>}
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
            className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextInputDialog;
