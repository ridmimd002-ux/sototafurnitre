import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs animate-pulse">
      <div className="aspect-3/4 bg-gray-200 w-full" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-5 w-6 bg-gray-200 rounded" />
          <div className="h-5 w-6 bg-gray-200 rounded" />
          <div className="h-5 w-6 bg-gray-200 rounded" />
        </div>
        <div className="pt-2 flex justify-between items-center">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-7 w-7 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => {
  return (
    <tr className="animate-pulse border-b border-gray-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
};
