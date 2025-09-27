'use client';

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Bookmark, 
  Database, 
  BarChart3, 
  Bell, 
  Settings,
  Construction,
  Target,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';

interface PlanningItem {
  id: string;
  title: string;
  status: 'confirmed working' | 'in development' | 'exploratory' | 'needs work';
  icon: React.ReactNode;
  uxIntent: string;
  currentState: string;
  plannedUx: string;
}

const planningItems: PlanningItem[] = [
  {
    id: 'search',
    title: 'Advanced Search',
    status: 'in development',
    icon: <Search className="h-5 w-5" />,
    uxIntent: 'Provide powerful, intuitive search capabilities with semantic expansion, negative keywords, and real-time filtering to help users quickly find relevant federal contracting opportunities.',
    currentState: 'Basic search functionality exists in the filter bar with exact matching.',
    plannedUx: 'Full-featured search page with semantic search, advanced filters, search history, and saved search templates with natural language query building.'
  },
  {
    id: 'filters',
    title: 'Smart Filters',
    status: 'confirmed working',
    icon: <Filter className="h-5 w-5" />,
    uxIntent: 'Enable users to create sophisticated filter combinations that persist across sessions, with visual feedback showing filter impact and quick filter presets for common use cases.',
    currentState: 'Filter bar with agency, award amount, and status filtering is functional.',
    plannedUx: 'Expandable filter sidebar with filter history, preset combinations, visual filter impact indicators, and collaborative filter sharing capabilities.'
  },
  {
    id: 'saved-searches',
    title: 'Saved Searches & Alerts',
    status: 'exploratory',
    icon: <Bookmark className="h-5 w-5" />,
    uxIntent: 'Allow users to save complex search queries and receive automated notifications when new contracts match their criteria, creating a proactive discovery workflow.',
    currentState: 'Database schema exists but no UI implementation.',
    plannedUx: 'Intuitive saved search management with customizable alert schedules, email/SMS notifications, and collaborative search sharing with team members.'
  },
  {
    id: 'database',
    title: 'Data Management',
    status: 'confirmed working',
    icon: <Database className="h-5 w-5" />,
    uxIntent: 'Provide transparent insight into data freshness, sync status, and import capabilities while allowing users to understand data provenance and quality.',
    currentState: 'SQLite database with 42K+ contracts, sync status tracking, and CSV import functionality.',
    plannedUx: 'Data dashboard showing sync health, data age indicators, import history, and one-click data refresh with progress visualization.'
  },
  {
    id: 'analytics',
    title: 'Market Analytics',
    status: 'exploratory',
    icon: <BarChart3 className="h-5 w-5" />,
    uxIntent: 'Transform raw contract data into actionable business intelligence through trend analysis, agency spending patterns, and competitive landscape insights.',
    currentState: 'Basic contract counts and stats in dashboard.',
    plannedUx: 'Interactive analytics dashboard with trend charts, agency analysis, market opportunity scoring, and competitive intelligence reports with exportable insights.'
  },
  {
    id: 'alerts',
    title: 'Intelligent Alerts',
    status: 'needs work',
    icon: <Bell className="h-5 w-5" />,
    uxIntent: 'Create a smart notification system that learns user preferences and delivers timely, relevant alerts without overwhelming users with noise.',
    currentState: 'Database schema exists but no implementation.',
    plannedUx: 'ML-powered alert system with preference learning, smart bundling, priority scoring, and multi-channel delivery (email, SMS, in-app) with snooze and feedback capabilities.'
  },
  {
    id: 'settings',
    title: 'Personalization',
    status: 'in development',
    icon: <Settings className="h-5 w-5" />,
    uxIntent: 'Enable deep personalization of the user experience through customizable dashboards, workflow preferences, and adaptive UI that learns from user behavior.',
    currentState: 'Basic settings for default filters and page size with Redux persistence.',
    plannedUx: 'Comprehensive preference center with dashboard customization, workflow automation, UI theme options, and behavioral adaptation with usage analytics.'
  }
];

const getStatusIcon = (status: PlanningItem['status']) => {
  switch (status) {
    case 'confirmed working':
      return <Target className="h-4 w-4 text-green-600" />;
    case 'in development':
      return <Construction className="h-4 w-4 text-blue-600" />;
    case 'exploratory':
      return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    case 'needs work':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
  }
};

const getStatusColor = (status: PlanningItem['status']) => {
  switch (status) {
    case 'confirmed working':
      return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
    case 'in development':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    case 'exploratory':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
    case 'needs work':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  }
};

const InPlanning: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feature Roadmap</h1>
          <p className="text-muted-foreground mt-1">
            Current development status and UX intentions for SamX platform features
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {planningItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    {item.icon}
                  </div>
                  <span>{item.title}</span>
                </div>
                <Badge className={`${getStatusColor(item.status)} flex items-center space-x-1`}>
                  {getStatusIcon(item.status)}
                  <span className="capitalize">{item.status}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-foreground">UX Intent</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.uxIntent}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Current State</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.currentState}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-foreground">Planned UX</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.plannedUx}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-dashed border-2">
        <CardContent className="pt-6 text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">More Features Coming</h3>
          <p className="text-muted-foreground">
            This roadmap is actively maintained based on user feedback and business priorities. 
            Features move through stages: Exploratory → In Development → Confirmed Working.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InPlanning;