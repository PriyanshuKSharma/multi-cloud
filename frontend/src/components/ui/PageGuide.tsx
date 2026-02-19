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
  const containerClass = isLight
    ? 'bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200/80'
    : 'bg-blue-500/10 border border-blue-500/20';
  const titleClass = isLight ? 'text-sky-800' : 'text-blue-300';
  const purposeClass = isLight ? 'text-slate-600' : 'text-gray-300';
  const metaClass = isLight ? 'text-slate-500' : 'text-gray-400';
  const strongClass = isLight ? 'text-slate-700' : 'text-gray-300';
  const iconClass = isLight ? 'text-sky-600' : 'text-blue-400';

  return (
    <div className={`rounded-xl p-4 ${containerClass}`}>
      <div className="flex items-start gap-3">
        <Info className={`w-5 h-5 mt-0.5 ${iconClass}`} />
        <div className="space-y-2">
          <h3 className={`text-sm font-semibold ${titleClass}`}>{title}</h3>
          <p className={`text-sm ${purposeClass}`}>{purpose}</p>
          <p className={`text-xs ${metaClass}`}>
            <span className={`font-semibold ${strongClass}`}>You can:</span> {actions.join(' • ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageGuide;
