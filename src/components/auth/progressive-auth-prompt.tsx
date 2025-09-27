'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Eye, Save } from 'lucide-react';

interface ProgressiveAuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  title?: string;
  description?: string;
  action?: string; // e.g., "save your settings", "save this search", etc.
}

export function ProgressiveAuthPrompt({ 
  isOpen, 
  onClose, 
  onContinueAsGuest,
  title = "Sign In to Save Your Progress",
  description = "Create an account to save your settings and access them across sessions.",
  action = "save your settings"
}: ProgressiveAuthPromptProps) {
  const router = useRouter();

  const handleSignIn = () => {
    // Store the current URL so we can redirect back after sign in
    const returnUrl = window.location.pathname + window.location.search;
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleContinueAsGuest = () => {
    onContinueAsGuest();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Save className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-slate-600">
            {description}
          </p>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What you get with an account:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save API keys and settings</li>
              <li>• Persist your saved searches</li>
              <li>• Access your data across sessions</li>
              <li>• Enhanced features and preferences</li>
            </ul>
          </div>

          <div className="grid gap-3">
            <Button 
              onClick={handleSignIn}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In to {action}
            </Button>
            
            <Button 
              onClick={handleContinueAsGuest}
              variant="outline"
              className="border-slate-300 text-slate-700"
            >
              <Eye className="mr-2 h-4 w-4" />
              Continue browsing (won't save)
            </Button>
          </div>

          <div className="text-xs text-center text-slate-500 pt-2 border-t border-slate-200">
            <p>
              Local development: <code className="bg-slate-100 px-1 rounded text-xs">admin@localhost / admin123</code>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if user should be prompted for auth before saving
export function useProgressiveAuth() {
  const { data: session, status } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuthFor = (action: () => void, actionName = "save your data") => {
    if (status === "loading") return;
    
    if (session?.user) {
      // User is signed in, proceed with action
      action();
    } else {
      // User not signed in, show prompt
      setPendingAction(() => action);
      setShowPrompt(true);
    }
  };

  const handleContinueAsGuest = () => {
    if (pendingAction) {
      // Don't execute the action, just close
      setPendingAction(null);
      setShowPrompt(false);
    }
  };

  const handleClosePrompt = () => {
    setPendingAction(null);
    setShowPrompt(false);
  };

  return {
    requireAuthFor,
    showPrompt,
    handleContinueAsGuest,
    handleClosePrompt,
    isAuthenticated: !!session?.user,
    session,
    user: session?.user
  };
}