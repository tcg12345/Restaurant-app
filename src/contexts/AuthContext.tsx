import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// DEMO MODE CONFIGURATION
// Set to false to require real authentication credentials
// =============================================================================
export const DEMO_MODE_ENABLED = false;

// Demo user data - all users share this account in demo mode
const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';
const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@grubbyapp.com',
  app_metadata: {},
  user_metadata: { name: 'Demo User', username: 'demo_user' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
} as Session;

const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  email: 'demo@grubbyapp.com',
  name: 'Demo User',
  username: 'demo_user',
  phone_number: null,
  address: null,
  avatar_url: null,
  is_public: true,
  allow_friend_requests: true,
  bio: 'Welcome to Grubby! This is a demo account.',
  home_city: 'San Francisco',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  phone_number: string | null;
  address: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  allow_friend_requests: boolean | null;
  bio: string | null;
  home_city: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  signInAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Sign in as demo user (no credentials required)
  const signInAsDemo = () => {
    if (!DEMO_MODE_ENABLED) {
      console.warn('Demo mode is disabled');
      return;
    }
    setSession(DEMO_SESSION);
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setIsDemo(true);
    setIsLoading(false);
    // Store demo state in localStorage so it persists across refreshes
    localStorage.setItem('grubby-demo-mode', 'true');
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data as Profile);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    // Check if demo mode was previously active
    const wasDemoMode = localStorage.getItem('grubby-demo-mode') === 'true';
    if (DEMO_MODE_ENABLED && wasDemoMode) {
      signInAsDemo();
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Fetch profile when user is available
        if (newSession?.user) {
          setTimeout(() => {
            fetchProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      // Fetch profile when user is available
      if (currentSession?.user) {
        setTimeout(() => {
          fetchProfile(currentSession.user.id);
        }, 0);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear demo mode
      setIsDemo(false);
      localStorage.removeItem('grubby-demo-mode');

      // Clear local state first
      setSession(null);
      setUser(null);
      setProfile(null);

      // Clear localStorage to prevent accumulation
      const storageKey = `sb-lboqkakzknmpzkejtefx-auth-token`;
      localStorage.removeItem(storageKey);

      // Then sign out from Supabase (only if not in demo mode)
      if (!isDemo) {
        await supabase.auth.signOut();
      }
    } catch {
      // Even if signOut fails, ensure local state is cleared
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsDemo(false);
      localStorage.removeItem('grubby-demo-mode');

      try {
        localStorage.clear();
      } catch {
        // Storage clear failed
      }
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    isDemo,
    signOut,
    signInAsDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}