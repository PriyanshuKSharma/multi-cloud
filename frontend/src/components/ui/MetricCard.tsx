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
      <div className={`rounded-2xl p-6 animate-pulse ${isLight ? 'bg-white border border-slate-200/90' : 'nebula-soft-panel'}`}>
        <div className={`mb-4 h-3.5 w-1/2 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-700/70'}`} />
        <div className={`mb-3 h-8 w-2/3 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-700/70'}`} />
        <div className={`h-3 w-1/3 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-700/70'}`} />
      </div>
    );
  }

  const changeClass =
    change?.type === 'increase'
      ? isLight
        ? 'text-emerald-700'
        : 'text-emerald-300'
      : change?.type === 'decrease'
        ? isLight
          ? 'text-rose-700'
          : 'text-rose-300'
        : isLight
          ? 'text-slate-600'
          : 'text-slate-300';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group rounded-2xl p-6 transition-all duration-250 ${
        isLight
          ? 'bg-white border border-slate-200/90 hover:border-blue-300/70 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.4)]'
          : 'nebula-panel hover:border-blue-400/35'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className={`text-sm font-semibold tracking-wide ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{title}</p>

        <div
          className={`rounded-xl p-2.5 transition-colors ${
            isLight ? 'bg-slate-100 group-hover:bg-blue-50' : 'bg-slate-900/70 group-hover:bg-blue-500/14'
          } ${iconColor}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <h3 className={`text-3xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</h3>

      {change ? (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className={`font-semibold ${changeClass}`}>
            {change.type === 'increase' ? '↑' : change.type === 'decrease' ? '↓' : '•'}{' '}
            {change.value}
            {change.type !== 'neutral' ? '%' : ''}
          </span>
          <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{change.label}</span>
        </div>
      ) : null}
    </motion.div>
  );
};

export default MetricCard;
