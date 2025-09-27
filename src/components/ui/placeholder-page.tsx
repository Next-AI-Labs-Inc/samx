'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoadingWrapper } from './loading-wrapper';
import { PageLoadingSkeleton } from './loading';

interface PlaceholderPageProps {
  title: string;
  description: string;
  features?: string[];
  comingSoon?: boolean;
  icon?: React.ReactNode;
}

export function PlaceholderPage({
  title,
  description,
  features = [],
  comingSoon = true,
  icon
}: PlaceholderPageProps) {
  const router = useRouter();

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="ghost" 
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="border-slate-200">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 p-4 bg-slate-100 rounded-full w-fit">
              {icon || <Construction className="h-8 w-8 text-slate-600" />}
            </div>
            <CardTitle className="text-3xl text-slate-800">
              {title}
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {comingSoon && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Construction className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">In Development</h3>
                </div>
                <p className="text-blue-800 text-sm">
                  This feature is currently under development and will be available in a future release.
                </p>
              </div>
            )}

            {features.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-800">Planned Features</h3>
                </div>
                <ul className="space-y-2">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-slate-400 mt-1">•</span>
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <LoadingWrapper 
      loadingComponent={<PageLoadingSkeleton />}
      minLoadingTime={600}
      delay={50}
    >
      {content}
    </LoadingWrapper>
  );
}
