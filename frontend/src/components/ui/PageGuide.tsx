import React from 'react';
import { Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface PageGuideProps {
  title: string;
  purpose: string;
  actions: string[];
}

const PageGuide: React.FC<PageGuideProps> = ({ title, purpose, actions }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isLight
          ? 'border-blue-200/90 bg-gradient-to-r from-blue-50 via-white to-blue-50'
          : 'border-blue-400/25 bg-blue-500/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg ${
            isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/18 text-blue-200'
          }`}
        >
          <Info className="h-4.5 w-4.5" />
        </div>

        <div className="space-y-1.5">
          <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{title}</h3>
          <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{purpose}</p>
          <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="font-semibold">You can:</span> {actions.join(' • ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageGuide;
