import React from 'react';

const HistoryRowSkeleton: React.FC = () => {
  return (
    <tr className="animate-pulse">
      {/* Query column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </td>
      
      {/* Platforms column */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          <div className="h-6 bg-gray-700 rounded-full w-16"></div>
          <div className="h-6 bg-gray-700 rounded-full w-20"></div>
          <div className="h-6 bg-gray-700 rounded-full w-18"></div>
        </div>
      </td>
      
      {/* Status column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 bg-gray-700 rounded-full w-20"></div>
      </td>
      
      {/* Duration column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-12"></div>
      </td>
      
      {/* Created column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-16"></div>
      </td>
      
      {/* Actions column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-700 rounded w-12"></div>
      </td>
    </tr>
  );
};

export default HistoryRowSkeleton;