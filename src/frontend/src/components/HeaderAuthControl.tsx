import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function HeaderAuthControl() {
  const { login, clear, loginStatus, identity, loginError } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';
  const isLoginError = loginStatus === 'loginError';

  // Show error toast when login fails (but not for "already authenticated" case)
  useEffect(() => {
    if (isLoginError && loginError && loginError.message !== 'User is already authenticated') {
      toast.error('Login failed', {
        description: loginError.message || 'Please try again.',
      });
    }
  }, [isLoginError, loginError]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Log out
      await clear();
      queryClient.clear();
    } else {
      // Log in
      try {
        await login();
      } catch (error: any) {
        // Special handling for "already authenticated" error
        if (error?.message === 'User is already authenticated') {
          // Clear and retry
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      variant={isAuthenticated ? 'outline' : 'default'}
      size="sm"
      className="gap-2"
    >
      {isLoggingIn ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Logging in...</span>
        </>
      ) : isAuthenticated ? (
        <>
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4" />
          <span>Log in</span>
        </>
      )}
    </Button>
  );
}
