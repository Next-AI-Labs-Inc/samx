import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <PlaceholderPage
      title="Alerts & Notifications"
      description="Manage your contract alerts and notification preferences"
      icon={<Bell className="h-8 w-8 text-red-600" />}
      features={[
        "Real-time notifications for new contracts",
        "Custom alert rules and triggers",
        "Email and SMS notification options",
        "Alert frequency and timing controls",
        "Contract deadline and milestone reminders",
        "Bulk alert management and organization",
        "Alert performance metrics and optimization"
      ]}
    />
  );
}