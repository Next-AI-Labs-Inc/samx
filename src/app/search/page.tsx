'use client';

import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <PlaceholderPage
      title="Advanced Search"
      description="Powerful search capabilities for finding specific contract opportunities"
      icon={<Search className="h-8 w-8 text-blue-600" />}
      features={[
        "Full-text search across all contract fields",
        "Advanced filtering by multiple criteria",
        "Boolean search operators (AND, OR, NOT)",
        "Saved search queries and alerts",
        "Search result export and sharing",
        "Search analytics and insights"
      ]}
    />
  );
}
