import React from 'react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
}

const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'md' }) => {
  const platformConfigs = {
    tiktok: { name: 'TikTok', color: 'from-pink-500 to-red-500' },
    instagram: { name: 'Instagram', color: 'from-purple-500 to-pink-500' },
    youtube: { name: 'YouTube', color: 'from-red-500 to-red-600' },
    twitter: { name: 'Twitter', color: 'from-blue-400 to-blue-500' },
    linkedin: { name: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
    facebook: { name: 'Facebook', color: 'from-blue-500 to-blue-600' },
  };

  const config = platformConfigs[platform as keyof typeof platformConfigs];
  if (!config) return null;

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${config.color} text-white font-medium ${sizeClasses}`}>
      {config.name}
    </span>
  );
};

export default PlatformBadge;