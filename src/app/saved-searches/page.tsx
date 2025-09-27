import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { Bookmark } from 'lucide-react';

export default function SavedSearchesPage() {
  return (
    <PlaceholderPage
      title="Saved Searches"
      description="Manage your saved searches and set up automated alerts"
      icon={<Bookmark className="h-8 w-8 text-green-600" />}
      features={[
        "Save complex search queries for quick access",
        "Set up email alerts for new matching contracts",
        "Schedule automatic search runs",
        "Organize searches into categories",
        "Share saved searches with team members",
        "Export search results to various formats",
        "Track search performance and hit rates"
      ]}
    />
  );
}