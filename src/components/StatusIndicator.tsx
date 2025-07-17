import React from 'react';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'running' | 'complete' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const iconSize = sizeClasses[size];

  const configs = {
    running: {
      icon: <Loader2 className={`${iconSize} animate-spin`} />,
      text: 'Running',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    complete: {
      icon: <CheckCircle className={iconSize} />,
      text: 'Complete',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    failed: {
      icon: <XCircle className={iconSize} />,
      text: 'Failed',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30'
    }
  };

  const config = configs[status];

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
      <span className={config.color}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
};

export default StatusIndicator;