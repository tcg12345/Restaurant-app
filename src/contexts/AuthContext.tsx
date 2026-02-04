import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// =============================================================================
// DEMO MODE CONFIGURATION
// Set to false to require real authentication credentials
// When true, the app works entirely with localStorage (no backend required)
// =============================================================================
export const DEMO_MODE_ENABLED = true;

// Define types locally to avoid Supabase dependency
interface User {
  id: string;
  email?: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

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

// Demo user data - all users share this account in demo mode
const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';
const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: 'demo@grubbyapp.com',
  app_metadata: {},
  user_metadata: { name: 'Demo User', username: 'demo_user' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
};

const DEMO_SESSION: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: DEMO_USER,
};

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

  useEffect(() => {
    // In demo mode, check if user was previously signed in
    const wasDemoMode = localStorage.getItem('grubby-demo-mode') === 'true';

    if (DEMO_MODE_ENABLED && wasDemoMode) {
      // Restore demo session
      signInAsDemo();
      return;
    }

    // If demo mode is enabled but user hasn't signed in yet, just set loading to false
    // They'll need to click the demo sign in button
    setIsLoading(false);
  }, []);

  const signOut = async () => {
    try {
      // Clear demo mode
      setIsDemo(false);
      localStorage.removeItem('grubby-demo-mode');

      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, ensure local state is cleared
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsDemo(false);
      localStorage.removeItem('grubby-demo-mode');
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
