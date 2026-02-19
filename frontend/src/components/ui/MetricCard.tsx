import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'text-blue-500',
  loading = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading) {
    return (
      <div
        className={`rounded-xl p-6 animate-pulse ${
          isLight ? 'bg-white border border-slate-200/90' : 'bg-[#0f0f11] border border-gray-800/50'
        }`}
      >
        <div className={`h-4 rounded w-1/2 mb-4 ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}></div>
        <div className={`h-8 rounded w-3/4 mb-2 ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}></div>
        <div className={`h-3 rounded w-1/3 ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 transition-all duration-300 group ${
        isLight
          ? 'bg-white border border-slate-200/90 hover:border-indigo-300/70 shadow-[0_14px_32px_-22px_rgba(15,23,42,0.35)]'
          : 'bg-[#0f0f11] border border-gray-800/50 hover:border-gray-700/50'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{title}</p>
        </div>
        <div
          className={`p-2 rounded-lg transition-colors ${
            isLight ? 'bg-slate-100 group-hover:bg-slate-200' : 'bg-gray-800/50 group-hover:bg-gray-800'
          } ${iconColor}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</h3>
        
        {change && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold ${
                change.type === 'increase'
                  ? isLight
                    ? 'text-green-700'
                    : 'text-green-400'
                  : change.type === 'decrease'
                  ? isLight
                    ? 'text-red-700'
                    : 'text-red-400'
                  : isLight
                    ? 'text-slate-600'
                    : 'text-gray-400'
              }`}
            >
              {change.type === 'increase' && '↑'}
              {change.type === 'decrease' && '↓'}
              {change.value > 0 && change.type !== 'neutral' && ' '}
              {change.value}
              {change.type !== 'neutral' && '%'}
            </span>
            <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{change.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
