import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, Crown, Users, Star, ChevronRight, Sparkles, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FeedItemCard } from '@/components/FeedItemCard';
import { InfiniteScrollLoader } from '@/components/InfiniteScrollLoader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FeedItem, ProfilePreview } from '@/types/feed';
import { locationService } from '@/utils/location';
import { cn } from '@/lib/utils';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [profiles, setProfiles] = useState<ProfilePreview[]>([]);
  const [experts, setExperts] = useState<ProfilePreview[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    locationService.getCurrentLocation().catch(() => {});
  }, []);

  const loadFeedData = useCallback(async (isRefresh = false, loadOffset = 0) => {
    if (!user) return;
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (loadOffset === 0) setIsLoading(true);

      const limit = 20;

      // Get friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const friendIds = friendsData?.map(f => f.user1_id === user.id ? f.user2_id : f.user1_id) || [];

      // Get experts
      const { data: expertRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'expert');
      const expertIds = expertRoles?.map(r => r.user_id) || [];

      const allUserIds = [...new Set([...friendIds, ...expertIds])];
      let allFeedItems: FeedItem[] = [];

      if (allUserIds.length > 0) {
        // Get ratings from all relevant users in one query
        const { data: ratings } = await supabase
          .from('restaurants')
          .select('id, user_id, name, address, city, country, cuisine, rating, price_range, michelin_stars, notes, photos, photo_captions, photo_dish_names, created_at, date_visited, google_place_id, website, phone_number, latitude, longitude')
          .in('user_id', allUserIds)
          .not('rating', 'is', null)
          .eq('is_wishlist', false)
          .order('created_at', { ascending: false })
          .range(loadOffset, loadOffset + limit - 1);

        // Get all profiles
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .in('id', allUserIds);
        const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || []);

        // Get reviews
        const { data: reviews } = await supabase
          .from('user_reviews')
          .select('id, user_id, restaurant_name, restaurant_address, overall_rating, review_text, photos, photo_captions, photo_dish_names, created_at, restaurant_place_id, category_ratings')
          .in('user_id', allUserIds)
          .order('created_at', { ascending: false })
          .range(loadOffset, loadOffset + limit - 1);

        // Transform ratings
        const ratingItems: FeedItem[] = (ratings || []).map(r => {
          const profile = profileMap.get(r.user_id);
          const isExpert = expertIds.includes(r.user_id);
          return {
            id: `${isExpert ? 'expert' : 'friend'}-rating-${r.id}`,
            type: (isExpert ? 'expert-rating' : 'friend-rating') as FeedItem['type'],
            user_id: r.user_id,
            username: profile?.username,
            name: profile?.name,
            avatar_url: profile?.avatar_url,
            restaurant_name: r.name,
            restaurant_address: r.address,
            city: r.city, country: r.country, cuisine: r.cuisine,
            rating: r.rating, price_range: r.price_range, michelin_stars: r.michelin_stars,
            notes: r.notes, photos: r.photos,
            photo_captions: r.photo_captions, photo_dish_names: r.photo_dish_names,
            created_at: r.created_at, date_visited: r.date_visited,
            google_place_id: r.google_place_id, website: r.website,
            phone_number: r.phone_number, latitude: r.latitude, longitude: r.longitude,
          };
        });

        // Transform reviews
        const reviewItems: FeedItem[] = (reviews || []).map(r => {
          const profile = profileMap.get(r.user_id);
          const isExpert = expertIds.includes(r.user_id);
          const catRatings = r.category_ratings as any;
          return {
            id: `${isExpert ? 'expert' : 'friend'}-review-${r.id}`,
            type: (isExpert ? 'expert-review' : 'friend-review') as FeedItem['type'],
            user_id: r.user_id,
            username: profile?.username, name: profile?.name, avatar_url: profile?.avatar_url,
            restaurant_name: r.restaurant_name, restaurant_address: r.restaurant_address,
            cuisine: catRatings?.cuisine, overall_rating: r.overall_rating,
            review_text: r.review_text, photos: r.photos,
            photo_captions: r.photo_captions, photo_dish_names: r.photo_dish_names,
            created_at: r.created_at, place_id: r.restaurant_place_id,
          };
        });

        allFeedItems = [...ratingItems, ...reviewItems];
        allFeedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        allFeedItems = allFeedItems.filter((item, idx, arr) => idx === arr.findIndex(t => t.id === item.id));
      }

      if (isRefresh || loadOffset === 0) {
        setFeedItems(allFeedItems);
      } else {
        setFeedItems(prev => [...prev, ...allFeedItems]);
      }
      setHasMore(allFeedItems.length === limit);
      setOffset(loadOffset + allFeedItems.length);

      // Load profile previews
      if (isRefresh || loadOffset === 0) {
        await loadProfilePreviews(friendIds, expertIds);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  const loadProfilePreviews = async (friendIds: string[], expertIds: string[]) => {
    try {
      const uniqueFriendIds = [...new Set(friendIds)].slice(0, 10);
      const uniqueExpertIds = [...new Set(expertIds)].slice(0, 6);

      if (uniqueFriendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .in('id', uniqueFriendIds);
        if (friendProfiles) {
          setProfiles(friendProfiles.map(p => ({
            id: p.id, username: p.username, name: p.name, avatar_url: p.avatar_url,
            isExpert: false, recentActivityCount: 0,
          })));
        }
      }

      if (uniqueExpertIds.length > 0) {
        const { data: expertProfiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .in('id', uniqueExpertIds);
        if (expertProfiles) {
          setExperts(expertProfiles.map(p => ({
            id: p.id, username: p.username, name: p.name, avatar_url: p.avatar_url,
            isExpert: true, recentActivityCount: 0,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  useEffect(() => { loadFeedData(); }, [loadFeedData]);

  const handleRefresh = () => { setOffset(0); loadFeedData(true, 0); };
  const handleLoadMore = () => { if (!isLoading && hasMore) loadFeedData(false, offset); };

  // Empty state
  if (!isLoading && feedItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-6 pb-24">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Welcome to Grubby</h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Your feed will come alive as you follow friends and experts. Start building your network!
            </p>
          </div>
          <div className="space-y-3 max-w-md mx-auto">
            <Button onClick={() => navigate('/friends')} className="w-full justify-between h-14 rounded-xl" variant="outline">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Find Friends</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button onClick={() => navigate('/experts')} className="w-full justify-between h-14 rounded-xl" variant="outline">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Discover Experts</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button onClick={() => navigate('/search/global')} className="w-full justify-between h-14 rounded-xl" variant="outline">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <span className="font-medium">Search Restaurants</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Compact Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Feed</h1>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Active Friends Row */}
      {profiles.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Active Friends</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => navigate(`/friend-profile/${profile.id}`)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <Avatar className="h-14 w-14 border-2 border-primary/30">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                    {(profile.name || profile.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">
                  {profile.name?.split(' ')[0] || profile.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Experts Row */}
      {experts.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Featured Experts</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={() => navigate('/experts')}>
              See all
            </Button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
            {experts.map((expert) => (
              <button
                key={expert.id}
                onClick={() => navigate(`/friend-profile/${expert.id}`)}
                className="flex-shrink-0 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors w-36"
              >
                <Avatar className="h-10 w-10 mx-auto mb-2 border border-amber-500/30">
                  <AvatarImage src={expert.avatar_url || ''} />
                  <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
                    {(expert.name || expert.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs font-medium truncate text-center">{expert.name || expert.username}</div>
                <Badge variant="outline" className="mt-1 mx-auto bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] px-1.5 py-0 flex w-fit">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Expert
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full text-xs h-8 gap-1.5" onClick={() => navigate('/places')}>
            <Star className="h-3.5 w-3.5" />
            Rate a Restaurant
          </Button>
          <Button variant="outline" size="sm" className="rounded-full text-xs h-8 gap-1.5" onClick={() => navigate('/search/global')}>
            <MapPin className="h-3.5 w-3.5" />
            Discover Nearby
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* Feed Section Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>

      {/* Loading State */}
      {isLoading && feedItems.length === 0 && (
        <div className="px-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-muted rounded w-32" />
                  <div className="h-2 bg-muted rounded w-48" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Feed Items */}
      <div ref={scrollRef}>
        {feedItems.map(item => (
          <FeedItemCard key={item.id} item={item} />
        ))}
        <InfiniteScrollLoader hasMore={hasMore} isLoading={isLoading} onLoadMore={handleLoadMore} />
      </div>
    </div>
  );
}
