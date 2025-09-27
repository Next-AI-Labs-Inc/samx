'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Send, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProgressiveAuth, ProgressiveAuthPrompt } from '@/components/auth/progressive-auth-prompt';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    user_name: '',
    phone: '',
    email: '',
    feedback_text: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    url: '',
    title: ''
  });
  
  const { requireAuthFor, showPrompt, handleContinueAsGuest, handleClosePrompt, isAuthenticated, user } = useProgressiveAuth();

  useEffect(() => {
    if (isOpen) {
      // Capture current page information
      setPageInfo({
        url: window.location.href,
        title: document.title
      });
      // Reset form when opening
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_name.trim()) {
      setError('Your name is required');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!formData.feedback_text.trim()) {
      setError('Please provide your feedback');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          page_url: pageInfo.url,
          page_title: pageInfo.title
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        user_name: '',
        phone: '',
        email: '',
        feedback_text: ''
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Feedback error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset form state when closing
      setTimeout(() => {
        setFormData({
          user_name: '',
          phone: '',
          email: '',
          feedback_text: ''
        });
        setError('');
        setSuccess(false);
      }, 300);
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <DialogTitle className="text-2xl font-bold text-slate-800 mb-2">
              Thank You!
            </DialogTitle>
            <p className="text-slate-600 mb-4">
              Your feedback has been sent successfully. We appreciate your input and will review it carefully.
            </p>
            <p className="text-sm text-slate-500">
              This dialog will close automatically...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-slate-800">
            <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Page Info Display */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Feedback for:</h4>
            <p className="text-sm text-slate-600 truncate">{pageInfo.title || 'Current Page'}</p>
            <p className="text-xs text-slate-500 truncate">{pageInfo.url}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_name" className="text-slate-700">
                  Full Name *
                </Label>
                <Input
                  id="user_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.user_name}
                  onChange={(e) => handleInputChange('user_name', e.target.value)}
                  className="mt-1 border-slate-300"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-slate-700">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1 border-slate-300"
                  required
                  disabled={isLoading}
                />
              </div>
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
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="feedback_text" className="text-slate-700">
                Your Feedback *
              </Label>
              <Textarea
                id="feedback_text"
                placeholder="Please share your thoughts, suggestions, or report any issues..."
                value={formData.feedback_text}
                onChange={(e) => handleInputChange('feedback_text', e.target.value)}
                className="mt-1 border-slate-300 min-h-[100px]"
                required
                disabled={isLoading}
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

            <div className="flex gap-3 pt-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Feedback
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <Button 
                type="button"
                onClick={handleClose}
                variant="outline"
                disabled={isLoading}
                className="border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
            </div>
          </form>

          <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
            <p>* Required fields. Your feedback will be sent directly to our team at founder@ixcoach.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating feedback button component
export function FeedbackButton() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    // Listen for the custom feedback event from other components
    const handleFeedbackEvent = () => {
      setIsFormOpen(true);
    };

    window.addEventListener('openFeedback', handleFeedbackEvent);
    
    return () => {
      window.removeEventListener('openFeedback', handleFeedbackEvent);
    };
  }, []);

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full w-14 h-14 p-0"
          title="Send Feedback"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Feedback form modal */}
      <FeedbackForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
    </>
  );
}