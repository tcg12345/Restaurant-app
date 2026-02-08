import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Fallback: query friends table directly when RPC is unavailable
  const fetchFriendsViaDirectQuery = useCallback(async (): Promise<Friend[]> => {
    if (!user) return [];
    try {
      const { data: friendRows, error } = await supabase
        .from('friends')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error || !friendRows || friendRows.length === 0) return [];

      const friendIds = friendRows.map(r => r.user1_id === user.id ? r.user2_id : r.user1_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, is_public')
        .in('id', friendIds);

      return (profiles || []).map((p: any) => ({
        id: p.id,
        username: p.username || '',
        name: p.name,
        avatar_url: p.avatar_url,
        is_public: p.is_public || false,
        score: 0,
      }));
    } catch {
      return [];
    }
  }, [user]);

  const fetchAllFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      // Try RPC first, fall back to direct query
      let mappedFriends: Friend[] = [];
      try {
        const friendsResult = await supabase.rpc('get_friends_with_scores', { requesting_user_id: user.id });
        if (friendsResult.error) throw friendsResult.error;
        mappedFriends = (friendsResult.data || []).map((friend: any) => ({
          id: friend.friend_id,
          username: friend.username || '',
          name: friend.name,
          avatar_url: friend.avatar_url,
          is_public: friend.is_public || false,
          score: friend.score || 0,
        }));
      } catch {
        // RPC not available, use direct query fallback
        mappedFriends = await fetchFriendsViaDirectQuery();
      }

      const cacheKey = `friends:list:${user.id}`;
      setFriends(mappedFriends);
      try { localStorage.setItem(cacheKey, JSON.stringify(mappedFriends)); } catch {}

      // Fetch friend requests with graceful error handling
      // Avoid foreign key joins (they may not exist) — query requests then profiles separately
      let receivedData: FriendRequest[] = [];
      let sentData: FriendRequest[] = [];

      try {
        const receivedResult = await supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('status', 'pending');
        if (!receivedResult.error && receivedResult.data) {
          const senderIds = receivedResult.data.map((r: any) => r.sender_id).filter(Boolean);
          let senderProfiles: Record<string, any> = {};
          if (senderIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, name, avatar_url')
              .in('id', senderIds);
            (profiles || []).forEach((p: any) => { senderProfiles[p.id] = p; });
          }
          receivedData = receivedResult.data.map((r: any) => ({
            ...r,
            sender: senderProfiles[r.sender_id] || undefined,
          })) as FriendRequest[];
        }
      } catch {}

      try {
        const sentResult = await supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', user.id)
          .eq('status', 'pending');
        if (!sentResult.error && sentResult.data) {
          const receiverIds = sentResult.data.map((r: any) => r.receiver_id).filter(Boolean);
          let receiverProfiles: Record<string, any> = {};
          if (receiverIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, username, name, avatar_url')
              .in('id', receiverIds);
            (profiles || []).forEach((p: any) => { receiverProfiles[p.id] = p; });
          }
          sentData = sentResult.data.map((r: any) => ({
            ...r,
            receiver: receiverProfiles[r.receiver_id] || undefined,
          })) as FriendRequest[];
        }
      } catch {}

      setPendingRequests(receivedData);
      setSentRequests(sentData);

    } catch {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setHasError(true);
      setRetryCount(prev => prev + 1);
    }
  }, [user, fetchFriendsViaDirectQuery]);

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      fetchAllFriendsData();
      return true;
    } catch {
      toast.error('Failed to send friend request');
      return false;
    }
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        // Try RPC first, fall back to manual update
        try {
          const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
          if (error) throw error;
        } catch {
          // Fallback: manually update status
          await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);
        }
        toast.success('Friend request accepted!');
      } else {
        const { error } = await supabase
          .from('friend_requests')
          .update({ status: 'declined' })
          .eq('id', requestId);
        if (error) throw error;
        toast.success('Friend request declined');
      }

      fetchAllFriendsData();
    } catch {
      toast.error('Failed to respond to friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${friendId}),and(user1_id.eq.${friendId},user2_id.eq.${user.id})`);

      if (error) throw error;

      toast.success('Friend removed');
      fetchAllFriendsData();
    } catch {
      toast.error('Failed to remove friend');
    }
  };

  const searchUsers = async (query: string) => {
    if (!user || query.length < 2) return [];

    const sanitizedQuery = query
      .trim()
      .replace(/[<>'"]/g, '')
      .substring(0, 50);

    if (sanitizedQuery.length < 2) return [];

    try {
      const { data, error } = await supabase.rpc('get_discoverable_profiles', {
        search_query: sanitizedQuery,
        limit_count: 10
      });

      if (error) throw error;
      return data || [];
    } catch {
      // Fallback: search profiles directly
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url, is_public, allow_friend_requests')
          .or(`username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
          .eq('is_public', true)
          .limit(10);
        return data || [];
      } catch {
        return [];
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setHasError(false);
      setRetryCount(0);
      setIsLoading(false);
      return;
    }

    if (retryCount >= 2) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Load from cache immediately
    const cacheKey = `friends:list:${user.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Friend[];
        if (Array.isArray(parsed)) {
          setFriends(parsed);
        }
      }
    } catch {}

    setIsLoading(true);
    setHasError(false);

    fetchAllFriendsData().finally(() => {
      setIsLoading(false);
    });

    if (retryCount > 0) {
      return;
    }

    let lastRefresh = 0;
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh > 2000) {
        lastRefresh = now;
        fetchAllFriendsData();
      }
    };

    const channel = supabase
      .channel('friends-and-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `or(receiver_id.eq.${user.id},sender_id.eq.${user.id})`
        },
        throttledRefresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        },
        throttledRefresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAllFriendsData]);

  const resetRetries = () => {
    setRetryCount(0);
    setHasError(false);
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    hasError,
    retryCount,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    searchUsers,
    refreshData: fetchAllFriendsData,
    resetRetries
  };
}
