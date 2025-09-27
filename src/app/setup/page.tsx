'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRight, Key, ExternalLink, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FeedbackButton } from '@/components/feedback/feedback-form';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { ProgressiveAuthPrompt } from '@/components/auth/progressive-auth-prompt';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    api_key: '',
    user_name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { makeAuthenticatedRequest, showAuthPrompt, closeAuthPrompt } = useAuthenticatedApi();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.api_key.trim()) {
      setError('API key is required');
      return;
    }

    if (!formData.user_name.trim()) {
      setError('Your name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await makeAuthenticatedRequest(async () => {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to save settings');
        }

        return data;
      }, "save your API key");

      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error('Setup error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Setup Complete!</h2>
            <p className="text-slate-600 mb-4">
              Your API key has been saved successfully. Redirecting to the dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => router.push('/')}
          variant="ghost" 
          className="mb-6 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              Setup Your SAM.gov API Key
            </h1>
            <p className="text-lg text-slate-600">
              Connect to SAM.gov to start exploring contract opportunities
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Instructions */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-800">
                  <Key className="mr-2 h-5 w-5 text-blue-600" />
                  How to Get Your API Key
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Follow these steps to obtain your SAM.gov API key
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-sm font-semibold text-blue-800 w-8 h-8 flex items-center justify-center">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Create SAM.gov Account</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Visit <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">sam.gov</a> and create an account if you don't have one already.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-sm font-semibold text-blue-800 w-8 h-8 flex items-center justify-center">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Request API Access</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Navigate to the API section and request access to the Opportunities API.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-sm font-semibold text-blue-800 w-8 h-8 flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Generate API Key</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Once approved, generate your API key from your SAM.gov account dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 text-sm font-semibold text-blue-800 w-8 h-8 flex items-center justify-center">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">Copy API Key</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Copy the API key and paste it in the form to the right.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button 
                    onClick={() => window.open('https://sam.gov/content/api', '_blank')}
                    variant="outline" 
                    className="w-full border-slate-300 text-slate-700"
                  >
                    Open SAM.gov API Page
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Important</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    API approval may take 24-48 hours. You'll receive an email once your access is granted.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Setup Form */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">Enter Your Information</CardTitle>
                <CardDescription className="text-slate-600">
                  Configure your API key and account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="api_key" className="text-slate-700">
                      SAM.gov API Key *
                    </Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="Enter your API key"
                      value={formData.api_key}
                      onChange={(e) => handleInputChange('api_key', e.target.value)}
                      className="mt-1 border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="user_name" className="text-slate-700">
                      Your Full Name *
                    </Label>
                    <Input
                      id="user_name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.user_name}
                      onChange={(e) => handleInputChange('user_name', e.target.value)}
                      className="mt-1 border-slate-300"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-slate-700">
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1 border-slate-300"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-slate-700">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1 border-slate-300"
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    * Required fields. Your API key is encrypted and stored securely.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      <FeedbackButton />
      
      <ProgressiveAuthPrompt
        isOpen={showAuthPrompt}
        onClose={closeAuthPrompt}
        onContinueAsGuest={closeAuthPrompt}
        title="Sign In to Save API Key"
        description="Sign in to save your API key and settings permanently to your account."
        action="save your API key"
      />
    </>
  );
}