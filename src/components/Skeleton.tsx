import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <Skeleton className="w-full aspect-square rounded-xl mb-4" />
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
