import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { Filter } from 'lucide-react';

export default function FiltersPage() {
  return (
    <PlaceholderPage
      title="Filter Management"
      description="Manage and create custom filters for contract discovery"
      icon={<Filter className="h-8 w-8 text-purple-600" />}
      features={[
        "Create and save custom filter combinations",
        "Agency-specific filter presets",
        "NAICS code filter groups",
        "Date range and amount filters",
        "Location-based filtering",
        "Filter sharing and collaboration",
        "Smart filter suggestions based on search history"
      ]}
    />
  );
}