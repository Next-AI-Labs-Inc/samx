import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics & Insights"
      description="Analyze contract trends and discover opportunities"
      icon={<BarChart3 className="h-8 w-8 text-orange-600" />}
      features={[
        "Contract volume and value trending over time",
        "Agency spending patterns and analysis",
        "NAICS code distribution and opportunities",
        "Geographic contract distribution mapping",
        "Competitive landscape analysis",
        "Market share and bidding success rates",
        "Custom analytics dashboards and reports"
      ]}
    />
  );
}