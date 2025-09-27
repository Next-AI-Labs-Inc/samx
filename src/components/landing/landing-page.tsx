'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Search, Database, Zap, FileText, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LandingPage() {
  const router = useRouter();
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setIsSetupComplete(data.settings?.setup_completed === 1);
    } catch (error) {
      console.error('Failed to check setup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterApp = () => {
    router.push('/dashboard');
  };

  const handleSetupClick = () => {
    router.push('/setup');
  };

  const handleGuideClick = () => {
    router.push('/guide');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SamX
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Your intelligent assistant for SAM.gov contract opportunities. 
            Search, analyze, and track government contracts with powerful AI-driven insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={handleEnterApp}
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              Enter App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {!isSetupComplete && (
              <Button 
                onClick={handleSetupClick}
                variant="outline" 
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-lg"
              >
                Setup API Key
              </Button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 Quick Start</h3>
            <p className="text-blue-800 text-sm">
              Browse contract opportunities instantly, or sign in to save your API key and settings for a personalized experience.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle className="text-slate-800">Smart Search</CardTitle>
              <CardDescription className="text-slate-600">
                Powerful search capabilities with filters for agencies, NAICS codes, and keywords
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Database className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle className="text-slate-800">Mass Upload</CardTitle>
              <CardDescription className="text-slate-600">
                Bulk import contract data via CSV for efficient processing and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGuideClick}
                variant="ghost" 
                size="sm" 
                className="text-purple-600 hover:text-purple-700 p-0"
              >
                View Upload Guide
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle className="text-slate-800">Real-time Sync</CardTitle>
              <CardDescription className="text-slate-600">
                Automatic synchronization with SAM.gov for the latest opportunities
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Card className="border-slate-200 bg-white/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Need Help?</h3>
              <p className="text-sm text-slate-600 mb-3">
                Check out our CSV upload guide and API setup instructions
              </p>
              <Button 
                onClick={handleGuideClick}
                variant="outline" 
                size="sm"
                className="border-slate-300 text-slate-700"
              >
                View Guide
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/50 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">Feedback</h3>
              <p className="text-sm text-slate-600 mb-3">
                Help us improve SamX with your valuable feedback
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-300 text-slate-700"
                onClick={() => {
                  const event = new CustomEvent('openFeedback');
                  window.dispatchEvent(event);
                }}
              >
                Send Feedback
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <p className="text-slate-500 text-sm">
            Built with ❤️ for government contractors and businesses
          </p>
        </div>
      </div>
    </div>
  );
}