import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Zap, 
  Eye, 
  Clock, 
  CheckCircle2, 
  ArrowLeft,
  Lightbulb,
  Target,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'feature' | 'improvement' | 'fix';
  changes: {
    icon: React.ReactNode;
    title: string;
    description: string;
    impact: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "2.1.0",
    date: "September 27, 2025",
    title: "Enhanced Search Experience",
    type: "feature",
    changes: [
      {
        icon: <Search className="h-4 w-4 text-blue-600" />,
        title: "Smart Search Suggestions",
        description: "Get intelligent term suggestions as you type based on actual contract data. Click suggestions to add them to your search.",
        impact: "Discover relevant terms you might not have thought of"
      },
      {
        icon: <Target className="h-4 w-4 text-purple-600" />,
        title: "OR Query Support", 
        description: "Search multiple terms with OR operators like 'web development OR apps OR software' to find contracts matching any of your terms.",
        impact: "Cast wider nets and find more relevant opportunities"
      },
      {
        icon: <Zap className="h-4 w-4 text-orange-600" />,
        title: "Manual Search Trigger",
        description: "Press Enter or click the search button to search. No more overwhelming automatic searches while you type.",
        impact: "Take control of when searches happen"
      },
      {
        icon: <Eye className="h-4 w-4 text-green-600" />,
        title: "Accurate Search Highlighting", 
        description: "Only your actual search terms are highlighted in results, not random words that happen to match.",
        impact: "Quickly spot why each contract matched your search"
      },
      {
        icon: <Clock className="h-4 w-4 text-indigo-600" />,
        title: "Search Loading States",
        description: "Clear visual feedback with 'Searching contracts...' indicator and smooth transitions between states.",
        impact: "Always know what's happening with your search"
      }
    ]
  },
  {
    version: "2.0.1", 
    date: "September 27, 2025",
    title: "Visual Polish & Performance",
    type: "improvement",
    changes: [
      {
        icon: <Sparkles className="h-4 w-4 text-green-600" />,
        title: "Redesigned LIVE Data Badge",
        description: "Clean, professional badge with animated pulse indicator instead of emoji. Better sizing and typography.",
        impact: "More polished, professional interface"
      },
      {
        icon: <Lightbulb className="h-4 w-4 text-yellow-600" />,
        title: "Smart Search Prompts",
        description: "Helpful prompts show when you have unsearched text with quick search buttons for immediate action.",
        impact: "Clear guidance on next steps"
      },
      {
        icon: <CheckCircle2 className="h-4 w-4 text-blue-600" />,
        title: "Suggestion Caching",
        description: "Search suggestions are cached and processed once, making subsequent suggestions lightning fast.",
        impact: "Instant response times for better flow"
      }
    ]
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'feature':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'improvement': 
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'fix':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export default function ChangelogPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">What's New</h1>
            <p className="text-muted-foreground">Latest user experience improvements and features</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {changelog.map((entry) => (
          <Card key={entry.version} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{entry.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">v{entry.version}</Badge>
                    <Badge className={getTypeColor(entry.type)}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {entry.changes.map((change, index) => (
                  <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 mt-0.5">
                      {change.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{change.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {change.description}
                      </p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        💡 {change.impact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Have feedback or suggestions?</h3>
        <p className="text-muted-foreground mb-4">
          We're continuously improving the platform based on user needs.
        </p>
        <Link href="/feedback">
          <Button>
            Share Feedback
          </Button>
        </Link>
      </div>
    </div>
  );
}