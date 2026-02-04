import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Friend {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  score: number;
  restaurant_count?: number;
  wishlist_count?: number;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export function useFriends() {
  const { user, isDemo } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // In demo mode, friend features are not available
  const fetchAllFriendsData = useCallback(async () => {
    if (!user || isDemo) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setIsLoading(false);
      return;
    }
    // In non-demo mode with a real backend, this would fetch from Supabase
    // For now, return empty since we're in localStorage mode
    setFriends([]);
    setPendingRequests([]);
    setSentRequests([]);
  }, [user, isDemo]);

  const sendFriendRequest = async (_receiverId: string) => {
    if (isDemo) {
      toast.info('Friend features are not available in demo mode');
      return false;
    }
    return false;
  };

  const respondToFriendRequest = async (_requestId: string, _accept: boolean) => {
    if (isDemo) {
      toast.info('Friend features are not available in demo mode');
      return;
    }
  };

  const removeFriend = async (_friendId: string) => {
    if (isDemo) {
      toast.info('Friend features are not available in demo mode');
      return;
    }
  };

  const searchUsers = async (_query: string) => {
    if (isDemo) {
      return [];
    }
    return [];
  };

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    if (isDemo) {
      // In demo mode, just set empty data
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchAllFriendsData().finally(() => {
      setIsLoading(false);
    });
  }, [user, isDemo, fetchAllFriendsData]);

  const resetRetries = () => {
    setHasError(false);
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    hasError,
    retryCount: 0,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    searchUsers,
    refreshData: fetchAllFriendsData,
    resetRetries
  };
}
