'use client';

import { useState, useEffect } from 'react';

interface LoadingWrapperProps {
  children: React.ReactNode;
  loadingComponent: React.ReactNode;
  minLoadingTime?: number; // Minimum time to show loading (for UX)
  delay?: number; // Delay before showing loading (prevents flash)
}

export function LoadingWrapper({ 
  children, 
  loadingComponent, 
  minLoadingTime = 800, // Show loading for at least 800ms
  delay = 100 // Wait 100ms before showing loading
}: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Delay before showing loading to prevent flash on fast loads
    const delayTimer = setTimeout(() => {
      if (isLoading) {
        setShowLoading(true);
      }
    }, delay);

    // Minimum loading time for smooth UX
    const minTimer = setTimeout(() => {
      setIsLoading(false);
      setShowLoading(false);
    }, minLoadingTime);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(minTimer);
    };
  }, [minLoadingTime, delay, isLoading]);

  if (showLoading || isLoading) {
    return <>{loadingComponent}</>;
  }

  return <>{children}</>;
}