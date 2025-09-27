'use client';

import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-700/60",
        className
      )}
    />
  );
}

// Loading spinner component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-slate-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  );
}

// Page loading skeleton that matches placeholder pages
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-32 mb-6" />

        {/* Card skeleton */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          {/* Header */}
          <div className="text-center pb-8 pt-12 px-6">
            {/* Icon skeleton */}
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            {/* Title skeleton */}
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            {/* Description skeleton */}
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6 space-y-6">
            {/* "In Development" notice skeleton */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Features list skeleton */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-36" />
              </div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Skeleton className="h-4 w-2 mt-1" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Button skeleton */}
            <div className="flex justify-center pt-4">
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard loading skeleton
export function DashboardLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-6" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border border-slate-100 rounded-lg">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple centered loading with text
interface CenteredLoadingProps {
  text?: string;
}

export function CenteredLoading({ text = "Loading..." }: CenteredLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-slate-600 text-lg">{text}</p>
      </div>
    </div>
  );
}