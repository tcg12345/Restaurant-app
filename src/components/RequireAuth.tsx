import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to access this page');
    }
  }, [user, isLoading]);

  if (isLoading) {
    // Show loading state
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/20"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Don't redirect back to settings/profile pages after re-login
    const skipReturnPaths = ['/settings', '/profile'];
    const shouldSaveReturnPath = !skipReturnPaths.some(p => location.pathname.startsWith(p));
    return <Navigate to="/auth" state={shouldSaveReturnPath ? { from: location.pathname + location.search } : undefined} replace />;
  }

  return <>{children}</>;
}