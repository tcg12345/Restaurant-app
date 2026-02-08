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

      const { data: friendsData } = await supabase
        .from('friends')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const friendIds = friendsData?.map(f => f.user1_id === user.id ? f.user2_id : f.user1_id) || [];

      const { data: expertRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'expert');
      const expertIds = expertRoles?.map(r => r.user_id) || [];

      const allUserIds = [...new Set([...friendIds, ...expertIds])];
      let allFeedItems: FeedItem[] = [];

      if (allUserIds.length > 0) {
        const { data: ratings } = await supabase
          .from('restaurants')
          .select('id, user_id, name, address, city, country, cuisine, rating, price_range, michelin_stars, notes, photos, photo_captions, photo_dish_names, created_at, date_visited, google_place_id, website, phone_number, latitude, longitude')
          .in('user_id', allUserIds)
          .not('rating', 'is', null)
          .eq('is_wishlist', false)
          .order('created_at', { ascending: false })
          .range(loadOffset, loadOffset + limit - 1);

        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, username, name, avatar_url')
          .in('id', allUserIds);
        const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || []);

        const { data: reviews } = await supabase
          .from('user_reviews')
          .select('id, user_id, restaurant_name, restaurant_address, overall_rating, review_text, photos, photo_captions, photo_dish_names, created_at, restaurant_place_id, category_ratings')
          .in('user_id', allUserIds)
          .order('created_at', { ascending: false })
          .range(loadOffset, loadOffset + limit - 1);

        const ratingItems: FeedItem[] = (ratings || []).map(r => {
          const profile = profileMap.get(r.user_id);
          const isExpert = expertIds.includes(r.user_id);
          return {
            id: `${isExpert ? 'expert' : 'friend'}-rating-${r.id}`,
            type: (isExpert ? 'expert-rating' : 'friend-rating') as FeedItem['type'],
            user_id: r.user_id,
            username: profile?.username, name: profile?.name, avatar_url: profile?.avatar_url,
            restaurant_name: r.name, restaurant_address: r.address,
            city: r.city, country: r.country, cuisine: r.cuisine,
            rating: r.rating, price_range: r.price_range, michelin_stars: r.michelin_stars,
            notes: r.notes, photos: r.photos,
            photo_captions: r.photo_captions, photo_dish_names: r.photo_dish_names,
            created_at: r.created_at, date_visited: r.date_visited,
            google_place_id: r.google_place_id, website: r.website,
            phone_number: r.phone_number, latitude: r.latitude, longitude: r.longitude,
          };
        });

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
        <div className="px-5 pt-8 pb-24 max-w-lg mx-auto">
          <div className="text-center py-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">Welcome to Grubby</h1>
            <p className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed">
              Your feed will come alive as you follow friends and experts.
            </p>
          </div>

          <div className="space-y-3 mt-4">
            <button onClick={() => navigate('/friends')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/30 hover:border-border/60 transition-all duration-200 text-left">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Find Friends</div>
                <div className="text-xs text-muted-foreground mt-0.5">Connect with people you know</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>

            <button onClick={() => navigate('/experts')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/30 hover:border-border/60 transition-all duration-200 text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Discover Experts</div>
                <div className="text-xs text-muted-foreground mt-0.5">Follow top food critics</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>

            <button onClick={() => navigate('/search/global')} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/30 hover:border-border/60 transition-all duration-200 text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Search Restaurants</div>
                <div className="text-xs text-muted-foreground mt-0.5">Explore places nearby</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-2 lg:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Active Friends */}
      {profiles.length > 0 && (
        <div className="px-5 pt-3 pb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Friends</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => navigate(`/friend-profile/${profile.id}`)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
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

      {/* Featured Experts */}
      {experts.length > 0 && (
        <div className="px-5 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experts</h2>
            </div>
            <button onClick={() => navigate('/experts')} className="text-xs text-primary font-medium">
              See all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {experts.map((expert) => (
              <button
                key={expert.id}
                onClick={() => navigate(`/friend-profile/${expert.id}`)}
                className="flex-shrink-0 p-3 rounded-2xl border border-border/30 bg-card hover:border-border/60 transition-all w-32"
              >
                <Avatar className="h-10 w-10 mx-auto mb-2 border border-amber-500/20">
                  <AvatarImage src={expert.avatar_url || ''} />
                  <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
                    {(expert.name || expert.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs font-medium truncate text-center">{expert.name || expert.username}</div>
                <Badge variant="outline" className="mt-1.5 mx-auto bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] px-1.5 py-0 flex w-fit">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Expert
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-5 pt-3 pb-3">
        <div className="flex gap-2">
          <button onClick={() => navigate('/places')} className="modern-pill-outline text-xs gap-1.5 flex items-center">
            <Star className="h-3.5 w-3.5" />
            Rate
          </button>
          <button onClick={() => navigate('/search/global')} className="modern-pill-outline text-xs gap-1.5 flex items-center">
            <MapPin className="h-3.5 w-3.5" />
            Discover
          </button>
        </div>
      </div>

      <div className="h-px bg-border/30 mx-5" />

      <div className="px-5 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
      </div>

      {/* Loading */}
      {isLoading && feedItems.length === 0 && (
        <div className="px-5 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 py-4 border-b border-border/20">
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
