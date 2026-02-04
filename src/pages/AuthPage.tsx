import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import { GrubbyLogo } from '@/components/GrubbyLogo';
import { useAuth, DEMO_MODE_ENABLED } from '@/contexts/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInAsDemo, user } = useAuth();

  // If already logged in (including demo mode), redirect to intended page
  useEffect(() => {
    if (user) {
      const state = (location.state as any) || {};
      const params = new URLSearchParams(location.search);
      const redirectTo = state.from || params.get('redirectTo') || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, location, user]);

  const handleDemoSignIn = () => {
    signInAsDemo();
    toast.success('Welcome to Grubby Demo!');
    const state = (location.state as any) || {};
    const params = new URLSearchParams(location.search);
    const redirectTo = state.from || params.get('redirectTo') || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <GrubbyLogo className="mx-auto h-12 w-auto" />
          <h1 className="text-2xl font-bold text-foreground mt-4">Welcome to Grubby</h1>
          <p className="text-muted-foreground">Your personal restaurant tracker</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          {DEMO_MODE_ENABLED && (
            <div className="p-6">
              <Button
                onClick={handleDemoSignIn}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
              >
                <Play className="h-5 w-5 mr-2" />
                Enter Demo Mode
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                No account needed - explore the app instantly
              </p>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm mb-2">What you can do:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Add and rate restaurants</li>
                  <li>• Track your dining experiences</li>
                  <li>• Create a wishlist of places to try</li>
                  <li>• Add photos and notes</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  Data is saved locally in your browser.
                </p>
              </div>
            </div>
          )}

          {!DEMO_MODE_ENABLED && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                Authentication is currently disabled.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
