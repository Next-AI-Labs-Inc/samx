'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import Dashboard from '@/components/dashboard/dashboard';
import { FeedbackButton } from '@/components/feedback/feedback-form';
import { DashboardLoadingSkeleton } from '@/components/ui/loading';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for dashboard data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <>
        <MainLayout>
          <DashboardLoadingSkeleton />
        </MainLayout>
        <FeedbackButton />
      </>
    );
  }

  return (
    <>
      <MainLayout>
        <Dashboard />
      </MainLayout>
      <FeedbackButton />
    </>
  );
}
