import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { FriendRequests } from '@/components/friends/FriendRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function FriendsPage({
  initialViewFriendId,
  onInitialViewProcessed
}: {
  initialViewFriendId?: string | null;
  onInitialViewProcessed?: () => void;
} = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
  } = useFriends();

  const [filterQuery, setFilterQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'find' | 'requests'>('friends');

  const filteredFriends = friends
    .filter(friend =>
      friend.username.toLowerCase().includes(filterQuery.toLowerCase()) ||
      friend.name?.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => a.username.localeCompare(b.username));

  const handleViewProfile = (friend: any) => {
    navigate(`/friends/${friend.id}`);
  };

  const handleStartChat = async (friend: any) => {
    if (!user) return;
    try {
      const { data: roomId, error } = await supabase.rpc('get_or_create_dm_room', {
        other_user_id: friend.id
      });
      if (error) throw error;
      navigate(`/chat/${roomId}`);
    } catch {
      toast.error('Failed to start chat');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      toast.success('Friend removed');
    } catch {
      toast.error('Failed to remove friend');
    }
  };

  const isAlreadyFriend = (userId: string) => friends.some(friend => friend.id === userId);
  const hasPendingRequest = (userId: string) =>
    sentRequests.some(request => request.receiver_id === userId || (request.receiver && (request.receiver as any).id === userId));

  const requestCount = pendingRequests.length + sentRequests.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-5">
        <div className="max-w-2xl mx-auto space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-2xl bg-surface-container/30">
              <div className="h-12 w-12 bg-surface-container rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-container rounded w-24" />
                <div className="h-2 bg-surface-container rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-4">
        <p className="uppercase tracking-widest text-[10px] text-on-surface-variant font-body font-semibold mb-2">
          YOUR CIRCLE
        </p>
        <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">
          Social & <em className="text-primary italic">Friends</em>
        </h1>
        <p className="font-body text-sm text-on-surface-variant">
          Connect, share discoveries, and see what your circle is eating.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-outline-variant/15 px-5 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex bg-surface-container-low rounded-2xl p-1 border border-outline-variant/15">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-body font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
                activeTab === 'friends'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-base">group</span>
              Friends
              {friends.length > 0 && (
                <Badge className="h-4 px-1.5 text-[10px] ml-0.5 bg-primary/10 text-primary border-0">
                  {friends.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-body font-semibold transition-all duration-200 flex items-center justify-center gap-1.5',
                activeTab === 'find'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              Find
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl text-sm font-body font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 relative',
                activeTab === 'requests'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-base">schedule</span>
              Requests
              {requestCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px] ml-0.5">
                  {requestCount}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-4">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-5 rounded-2xl bg-primary/5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/40">group</span>
                </div>
                <h3 className="text-lg font-headline font-bold text-on-surface mb-2">No friends yet</h3>
                <p className="text-sm text-on-surface-variant font-body mb-4">
                  Start building your foodie network
                </p>
                <Button onClick={() => setActiveTab('find')} size="sm" className="rounded-full gap-1.5 bg-primary text-white font-body font-semibold">
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Find Friends
                </Button>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="relative mb-4">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-lg">search</span>
                  <Input
                    placeholder="Search friends..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-11 h-11 rounded-2xl border-outline-variant/20 bg-surface-container-low font-body text-sm"
                  />
                </div>

                {/* Friends List */}
                <div className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => handleViewProfile(friend)}
                    >
                      <Avatar className="h-12 w-12 border border-outline-variant/15">
                        <AvatarImage src={friend.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/8 text-primary font-headline font-bold">
                          {(friend.name || friend.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-headline font-bold text-sm text-on-surface truncate">
                          {friend.name || friend.username}
                        </div>
                        <div className="text-xs text-on-surface-variant font-body">
                          @{friend.username}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(friend);
                          }}
                        >
                          <span className="material-symbols-outlined text-on-surface-variant text-lg">chat</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="material-symbols-outlined text-on-surface-variant text-lg">more_horiz</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleViewProfile(friend)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveFriend(friend.id)}
                            >
                              <span className="material-symbols-outlined text-sm mr-2">delete</span>
                              Remove Friend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Find Friends Tab */}
        {activeTab === 'find' && (
          <FriendSearch
            onSendRequest={sendFriendRequest}
            isAlreadyFriend={isAlreadyFriend}
            hasPendingRequest={hasPendingRequest}
          />
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <FriendRequests
            pendingRequests={pendingRequests as any}
            sentRequests={sentRequests as any}
            onRespondToRequest={respondToFriendRequest}
          />
        )}
      </div>
    </div>
  );
}
