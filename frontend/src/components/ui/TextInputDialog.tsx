import React from 'react';

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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="w-full max-w-lg bg-[#0f0f11] border border-gray-800/70 rounded-xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-800/60">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>

        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input
              type="text"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder={placeholder}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-800/60 flex items-center justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
