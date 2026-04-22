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
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col h-full">
      <Skeleton className="w-full aspect-square rounded-xl mb-3 sm:mb-4 bg-slate-100" />
      <Skeleton className="h-3 w-1/3 mb-2 bg-slate-100" />
      <Skeleton className="h-5 w-3/4 mb-3 sm:mb-4 bg-slate-100" />
      <div className="mt-auto flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-1/4 bg-slate-100" />
        <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full h-48 sm:h-64 md:h-80 lg:h-[400px] rounded-3xl overflow-hidden mb-8">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100" />
      <Skeleton className="h-3 w-14 bg-slate-100" />
    </div>
  );
}

export function SectionHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center mb-6 px-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-40 bg-slate-100" />
      </div>
      <Skeleton className="h-4 w-20 bg-slate-100" />
    </div>
  );
}
