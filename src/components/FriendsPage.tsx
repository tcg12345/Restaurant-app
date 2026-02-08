import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Clock, UserPlus, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tab Switcher */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex justify-center">
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                activeTab === 'friends'
                  ? 'bg-background text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users className="h-4 w-4" />
              Friends
              {friends.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5">
                  {friends.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('find')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
                activeTab === 'find'
                  ? 'bg-background text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <UserPlus className="h-4 w-4" />
              Find
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 relative',
                activeTab === 'requests'
                  ? 'bg-background text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Clock className="h-4 w-4" />
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

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-5 rounded-2xl bg-muted/50 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building your foodie network
                </p>
                <Button onClick={() => setActiveTab('find')} size="sm" className="rounded-full gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>

                {/* Friends List */}
                <div className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewProfile(friend)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(friend.name || friend.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {friend.name || friend.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{friend.username}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(friend);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewProfile(friend)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveFriend(friend.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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
