import React from 'react';

const RecentRunSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 animate-pulse">
      {/* Header - Search query and status */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-700 rounded w-2/3"></div>
        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
      </div>
      
      {/* Platform badges */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="h-6 bg-gray-700 rounded-full w-16"></div>
        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
        <div className="h-6 bg-gray-700 rounded-full w-18"></div>
      </div>
      
      {/* Footer - Time and action */}
      <div className="flex items-center justify-between text-sm">
        <div className="h-4 bg-gray-700 rounded w-16"></div>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );
};

export default RecentRunSkeleton;