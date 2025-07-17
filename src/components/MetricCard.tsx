import React from 'react';
import { TrendingUp, Users, Heart } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  type: 'sentiment' | 'value' | 'engagement';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, type, className = '' }) => {
  const getIcon = () => {
    switch (type) {
      case 'sentiment':
        return <Heart className="h-5 w-5" />;
      case 'value':
        return <TrendingUp className="h-5 w-5" />;
      case 'engagement':
        return <Users className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getColor = () => {
    if (value >= 8) return 'text-green-400';
    if (value >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    if (value >= 8) return 'bg-green-500';
    if (value >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300 text-sm">{title}</span>
        <span className={getColor()}>{getIcon()}</span>
      </div>
      
      <div className="mb-2">
        <span className={`text-2xl font-bold ${getColor()}`}>
          {value.toFixed(1)}
        </span>
        <span className="text-gray-400 text-sm ml-1">/10</span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default MetricCard;