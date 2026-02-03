import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Activity, Clock, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { FriendCard } from '@/components/friends/FriendCard';
import { FriendSearch } from '@/components/friends/FriendSearch';
import { FriendRequests } from '@/components/friends/FriendRequests';
import { FriendProfilePopup } from '@/components/FriendProfilePopup';
import { FriendCardSkeleton } from '@/components/skeletons/FriendCardSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

interface FriendActivity {
  restaurant_id: string;
  restaurant_name: string;
  cuisine: string;
  rating: number | null;
  date_visited: string | null;
  created_at: string;
  friend_id: string;
  friend_username: string;
}

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
    searchUsers
  } = useFriends();
  
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [activeTab, setActiveTab] = useState('friends');
  const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Load friends activity
  const loadFriendsActivity = async () => {
    if (!user || friends.length === 0) return;
    setIsLoadingActivity(true);
    try {
      const { data, error } = await supabase.rpc('get_friends_recent_activity', {
        requesting_user_id: user.id,
        activity_limit: 20
      });
      if (error) throw error;
      setFriendsActivity(data || []);
    } catch (error) {
      console.error('Error loading friends activity:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (user && friends.length > 0 && activeTab === 'activity') {
      loadFriendsActivity();
    }
  }, [user, friends, activeTab]);

  // Filter and sort friends
  const filteredFriends = friends
    .filter(friend => 
      friend.username.toLowerCase().includes(filterQuery.toLowerCase()) || 
      friend.name?.toLowerCase().includes(filterQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.username.localeCompare(b.username);
        case 'activity':
          return 0;
        case 'score':
          return 0;
        default:
          return 0;
      }
    });

  const handleViewProfile = (friend: any) => {
    navigate(`/friends/${friend.id}`);
  };

  const handleStartChat = async (friend: any) => {
    if (!user) return;
    try {
      const { data: roomId, error } = await supabase.rpc('get_or_create_dm_room', {
        other_user_id: friend.id
      });
      if (error) {
        console.error('Error creating chat room:', error);
        toast.error('Failed to start chat');
        return;
      }
      navigate(`/chat/${roomId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await removeFriend(friendId);
      toast.success('Friend removed successfully');
    } catch (error) {
      toast.error('Failed to remove friend');
    }
  };

  const isAlreadyFriend = (userId: string) => {
    return friends.some(friend => friend.id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => 
      request.receiver_id === userId || 
      (request.receiver && (request.receiver as any).id === userId)
    );
  };

  const getRecentActivityCount = () => {
    return Math.floor(friends.length * 0.6);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Modern Header Skeleton */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="animate-pulse bg-muted h-8 w-48 rounded-lg"></div>
                <div className="animate-pulse bg-muted h-4 w-64 rounded"></div>
              </div>
              <div className="animate-pulse bg-muted h-10 w-32 rounded-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted h-24 rounded-xl"></div>
            ))}
          </div>
          
          {/* Content Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <FriendCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 gap-1 p-1 mb-8 bg-muted/30 rounded-lg border border-border/30">
            <TabsTrigger 
              value="friends" 
              className="flex items-center justify-center gap-1.5 h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 text-sm font-medium"
            >
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">Friends</span>
              {friends.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-xs flex-shrink-0 flex items-center justify-center">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="flex items-center justify-center gap-1.5 h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 text-sm font-medium"
            >
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">Activity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="flex items-center justify-center gap-1.5 h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 text-sm font-medium"
            >
              <Search className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">Find</span>
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="flex items-center justify-center gap-1.5 h-10 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border/50 transition-all duration-200 text-sm font-medium relative"
            >
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">Requests</span>
              {(pendingRequests.length + sentRequests.length) > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-xs flex-shrink-0 flex items-center justify-center">
                  {pendingRequests.length + sentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-6">
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 rounded-full bg-muted/50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your foodie network by finding and adding friends
                </p>
                <Button onClick={() => setActiveTab('search')} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <>
                {/* Filters and Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search friends..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="activity">Activity</SelectItem>
                        <SelectItem value="score">Score</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="gap-2"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="gap-2"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Friends Grid/List */}
                <div className={cn(
                  "grid gap-6",
                  viewMode === 'grid' 
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1"
                )}>
                  {filteredFriends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onViewProfile={handleViewProfile}
                      onStartChat={handleStartChat}
                      onRemoveFriend={handleRemoveFriend}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="text-center py-16">
              <div className="p-6 rounded-full bg-muted/50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Activity Feed</h3>
              <p className="text-muted-foreground">
                See what your friends are up to in the food world
              </p>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <FriendSearch 
              onSendRequest={sendFriendRequest}
              isAlreadyFriend={isAlreadyFriend}
              hasPendingRequest={hasPendingRequest}
            />
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <FriendRequests 
              pendingRequests={pendingRequests as any} 
              sentRequests={sentRequests as any} 
              onRespondToRequest={respondToFriendRequest} 
            />
          </TabsContent>
        </Tabs>

        {/* Friend Profile Popup */}
        <FriendProfilePopup 
          friend={selectedFriend} 
          isOpen={!!selectedFriend} 
          onClose={() => setSelectedFriend(null)} 
          onViewProfile={handleViewProfile} 
        />
      </div>
    </div>
  );
}