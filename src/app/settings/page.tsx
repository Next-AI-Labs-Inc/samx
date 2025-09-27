import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title="Application Settings"
      description="Configure your SamX preferences and account settings"
      icon={<Settings className="h-8 w-8 text-slate-600" />}
      features={[
        "API key management and configuration",
        "User profile and account preferences",
        "Notification and alert settings",
        "Data export and import preferences",
        "Display and UI customization options",
        "Security and privacy controls",
        "Integration settings for external tools"
      ]}
    />
  );
}