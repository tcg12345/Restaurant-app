import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface FriendProfile {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  is_public: boolean;
  rated_count: number;
  wishlist_count: number;
  avg_rating: number;
  recent_restaurants: any[];
  last_updated: Date;
}

interface FriendProfilesContextType {
  profilesCache: Map<string, FriendProfile>;
  isPreloading: boolean;
  getFriendProfile: (friendId: string) => FriendProfile | null;
  refreshProfile: (friendId: string) => Promise<void>;
  refreshAllProfiles: () => Promise<void>;
}

const FriendProfilesContext = createContext<FriendProfilesContextType | undefined>(undefined);

export const useFriendProfiles = () => {
  const context = useContext(FriendProfilesContext);
  if (!context) {
    throw new Error('useFriendProfiles must be used within FriendProfilesProvider');
  }
  return context;
};

interface Props {
  children: React.ReactNode;
}

export const FriendProfilesProvider: React.FC<Props> = ({ children }) => {
  const { isDemo } = useAuth();
  const [profilesCache] = useState<Map<string, FriendProfile>>(() => new Map());
  const [isPreloading] = useState(false);

  // In demo mode, friend features are not available
  // Return empty/stub implementations

  const refreshProfile = useCallback(async (_friendId: string) => {
    if (isDemo) {
      console.log('Friend profiles not available in demo mode');
      return;
    }
  }, [isDemo]);

  const refreshAllProfiles = useCallback(async () => {
    if (isDemo) {
      console.log('Friend profiles not available in demo mode');
      return;
    }
  }, [isDemo]);

  const getFriendProfile = useCallback((_friendId: string): FriendProfile | null => {
    // In demo mode, no friend profiles available
    return null;
  }, []);

  const value: FriendProfilesContextType = {
    profilesCache,
    isPreloading,
    getFriendProfile,
    refreshProfile,
    refreshAllProfiles
  };

  return (
    <FriendProfilesContext.Provider value={value}>
      {children}
    </FriendProfilesContext.Provider>
  );
};
