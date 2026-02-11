import React from 'react';
import { Info } from 'lucide-react';

interface PageGuideProps {
  title: string;
  purpose: string;
  actions: string[];
}

const PageGuide: React.FC<PageGuideProps> = ({ title, purpose, actions }) => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-blue-300">{title}</h3>
          <p className="text-sm text-gray-300">{purpose}</p>
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">You can:</span> {actions.join(' • ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageGuide;

