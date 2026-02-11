import React from 'react';
import { Cloud } from 'lucide-react';

interface ProviderIconProps {
  provider: 'aws' | 'azure' | 'gcp';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ProviderIcon: React.FC<ProviderIconProps> = ({ provider, size = 'md', showLabel = false }) => {
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', container: 'w-6 h-6', text: 'text-xs' },
    md: { icon: 'w-5 h-5', container: 'w-8 h-8', text: 'text-sm' },
    lg: { icon: 'w-6 h-6', container: 'w-10 h-10', text: 'text-base' },
  };

  const providerConfig = {
    aws: {
      name: 'AWS',
      color: 'from-orange-500 to-yellow-600',
      textColor: 'text-orange-400',
    },
    azure: {
      name: 'Azure',
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-400',
    },
    gcp: {
      name: 'GCP',
      color: 'from-red-500 to-yellow-500',
      textColor: 'text-red-400',
    },
  };

  const config = providerConfig[provider];
  const sizes = sizeConfig[size];

  if (showLabel) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${sizes.container} rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
          <Cloud className={`${sizes.icon} text-white`} />
        </div>
        <span className={`font-semibold ${config.textColor} ${sizes.text}`}>{config.name}</span>
      </div>
    );
  }

  return (
    <div className={`${sizes.container} rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
      <Cloud className={`${sizes.icon} text-white`} />
    </div>
  );
};

export default ProviderIcon;
