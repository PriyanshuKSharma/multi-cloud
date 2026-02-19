import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface StatusBadgeProps {
  status: 'running' | 'stopped' | 'pending' | 'failed' | 'active' | 'inactive' | 'healthy' | 'degraded' | 'provisioning' | 'destroying';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showDot = true }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const statusConfig = isLight
    ? {
        running: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-600' },
        active: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-600' },
        healthy: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-600' },
        stopped: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', dot: 'bg-slate-500' },
        inactive: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', dot: 'bg-slate-500' },
        pending: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-600' },
        provisioning: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-600' },
        degraded: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-600' },
        failed: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-600' },
        destroying: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-600' },
      }
    : {
        running: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-500' },
        active: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-500' },
        healthy: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-500' },
        stopped: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-500' },
        inactive: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-500' },
        pending: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
        provisioning: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500' },
        degraded: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' },
        failed: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
        destroying: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
      };

  const sizeConfig = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const normalizedStatus = status?.toLowerCase() as keyof typeof statusConfig;
  const config = statusConfig[normalizedStatus] || statusConfig.inactive;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-1.5 ${sizeConfig[size]} ${config.color} ${config.bg} border ${config.border} rounded-full font-semibold`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'running' || status === 'provisioning' ? 'animate-pulse' : ''}`}></span>
      )}
      <span className="capitalize">{status}</span>
    </motion.span>
  );
};

export default StatusBadge;
