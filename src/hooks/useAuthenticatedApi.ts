'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthenticatedApiOptions {
  onAuthRequired?: () => void;  // Custom auth prompt handler
  redirectToSignIn?: boolean;   // Auto-redirect vs show modal
}

export function useAuthenticatedApi(options: AuthenticatedApiOptions = {}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<(() => Promise<any>) | null>(null);

  const makeAuthenticatedRequest = async <T>(
    requestFn: () => Promise<T>,
    actionName = "perform this action"
  ): Promise<T | null> => {
    
    try {
      // Try the request first
      return await requestFn();
    } catch (error: any) {
      
      // Check if it's an auth error
      if (error?.status === 401 || error?.code === 'AUTH_REQUIRED') {
        
        if (options.redirectToSignIn) {
          // Redirect to sign-in page
          const returnUrl = window.location.pathname + window.location.search;
          router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
          return null;
        } else {
          // Show auth prompt modal
          if (options.onAuthRequired) {
            options.onAuthRequired();
          } else {
            setPendingRequest(() => requestFn);
            setShowAuthPrompt(true);
          }
          return null;
        }
      }
      
      // Re-throw non-auth errors
      throw error;
    }
  };

  const closeAuthPrompt = () => {
    setPendingRequest(null);
    setShowAuthPrompt(false);
  };

  const retryAfterAuth = async () => {
    if (pendingRequest && session?.user) {
      try {
        const result = await pendingRequest();
        closeAuthPrompt();
        return result;
      } catch (error) {
        closeAuthPrompt();
        throw error;
      }
    }
  };

  return {
    makeAuthenticatedRequest,
    showAuthPrompt,
    closeAuthPrompt,
    retryAfterAuth,
    isAuthenticated: !!session?.user,
    user: session?.user
  };
}