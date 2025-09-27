'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock,
  Target,
  Construction,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  GitBranch,
  Calendar,
  Zap
} from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  status: 'confirmed working' | 'in development' | 'exploratory' | 'needs work';
  changes: {
    category: string;
    description: string;
    uxImpact: string;
    status: string;
  }[];
}

interface UpcomingFeature {
  title: string;
  description: string;
  status: string;
  estimatedCompletion: string;
}

interface ChangelogData {
  version: string;
  lastUpdated: string;
  changes: ChangelogEntry[];
  upcomingFeatures: UpcomingFeature[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed working':
      return <Target className="h-4 w-4 text-green-600" />;
    case 'in development':
      return <Construction className="h-4 w-4 text-blue-600" />;
    case 'exploratory':
      return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    case 'needs work':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed working':
      return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
    case 'in development':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    case 'exploratory':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
    case 'needs work':
      return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300';
  }
};

const Changelog: React.FC = () => {
  const [changelogData, setChangelogData] = useState<ChangelogData | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch('/changelog.json');
        const data = await response.json();
        setChangelogData(data);
        // Expand the most recent version by default
        if (data.changes.length > 0) {
          setExpandedVersions(new Set([data.changes[0].version]));
        }
      } catch (error) {
        console.error('Failed to load changelog:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!changelogData) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load changelog.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <GitBranch className="h-8 w-8" />
            Changelog
          </h1>
          <p className="text-muted-foreground mt-1">
            UX-focused development history and feature evolution
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Current Version</div>
          <div className="text-xl font-bold">{changelogData.version}</div>
        </div>
      </div>

      {/* Recent Changes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
        {changelogData.changes.map((entry) => (
          <Card key={entry.version} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleVersion(entry.version)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-5 w-5" />
                    <span>v{entry.version}</span>
                  </div>
                  <Badge className={`${getStatusColor(entry.status)} flex items-center space-x-1`}>
                    {getStatusIcon(entry.status)}
                    <span className="capitalize">{entry.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{entry.date}</span>
                  </div>
                  <ChevronRight 
                    className={`h-4 w-4 transition-transform ${
                      expandedVersions.has(entry.version) ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{entry.title}</p>
            </CardHeader>
            
            {expandedVersions.has(entry.version) && (
              <CardContent className="space-y-4 border-t">
                {entry.changes.map((change, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">{change.category}</span>
                      <Badge className={`${getStatusColor(change.status)} text-xs`}>
                        {getStatusIcon(change.status)}
                        <span className="ml-1 capitalize">{change.status}</span>
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>Change:</strong> {change.description}
                      </p>
                      <p className="text-sm text-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border-l-4 border-blue-500">
                        <strong>UX Impact:</strong> {change.uxImpact}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Upcoming Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Upcoming Features</h2>
        <div className="grid gap-4">
          {changelogData.upcomingFeatures.map((feature, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <Badge className={`${getStatusColor(feature.status)} text-xs`}>
                        {getStatusIcon(feature.status)}
                        <span className="ml-1 capitalize">{feature.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground ml-4">
                    <div>Target</div>
                    <div className="font-medium">{feature.estimatedCompletion}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="pt-6 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Continuous Evolution</h3>
          <p className="text-muted-foreground">
            This changelog emphasizes user experience improvements and their impact on daily workflows. 
            Every change is evaluated based on how it makes the contracting discovery process more efficient and intuitive.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Changelog;