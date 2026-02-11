import React from 'react';
import { motion } from 'framer-motion';

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
  if (loading) {
    return (
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-800 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-800 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
        </div>
        <div className={`p-2 rounded-lg bg-gray-800/50 group-hover:bg-gray-800 transition-colors ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        
        {change && (
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-semibold ${
                change.type === 'increase'
                  ? 'text-green-400'
                  : change.type === 'decrease'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}
            >
              {change.type === 'increase' && '↑'}
              {change.type === 'decrease' && '↓'}
              {change.value > 0 && change.type !== 'neutral' && ' '}
              {change.value}
              {change.type !== 'neutral' && '%'}
            </span>
            <span className="text-xs text-gray-500">{change.label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
