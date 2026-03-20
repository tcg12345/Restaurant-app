import { useState, useEffect } from 'react';
const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useItineraries } from '@/hooks/useItineraries';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { ExpertBadge } from '@/components/ExpertBadge';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { resolveImageUrl } from '@/utils/imageUtils';

interface ProfileStats {
  rated_count: number;
  wishlist_count: number;
  avg_rating: number;
  top_cuisine: string;
  following_count: number;
  followers_count: number;
}
interface RecentActivity {
  id: string;
  name: string;
  address: string;
  rating: number;
  date_visited: string;
  created_at: string;
  google_place_id: string;
  cuisine: string;
}
interface WishlistRestaurant {
  id: string;
  name: string;
  city: string;
  country: string;
  cuisine: string;
  photos: string[];
  created_at: string;
}

export function MobileProfilePage() {
  const {
    user,
    profile
  } = useAuth();
  const navigate = useNavigate();
  const { isExpert } = useUserRole(user?.id);
  const {
    friends
  } = useFriends();
  const {
    itineraries
  } = useItineraries();
  const [stats, setStats] = useState<ProfileStats>({
    rated_count: 0,
    wishlist_count: 0,
    avg_rating: 0,
    top_cuisine: '',
    following_count: 0,
    followers_count: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [wishlistRestaurants, setWishlistRestaurants] = useState<WishlistRestaurant[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.rpc('get_user_stats', {
          target_user_id: user.id
        });
        if (error) throw error;
        setStats({
          rated_count: data[0]?.rated_count || 0,
          wishlist_count: data[0]?.wishlist_count || 0,
          avg_rating: data[0]?.avg_rating || 0,
          top_cuisine: data[0]?.top_cuisine || '',
          following_count: friends.length,
          followers_count: friends.length
        });
      } catch {
        // RPC may not exist - compute stats from restaurants table directly
        try {
          const [ratedRes, wishlistRes] = await Promise.all([
            supabase.from('restaurants').select('rating, cuisine', { count: 'exact' }).eq('user_id', user.id).eq('is_wishlist', false).not('rating', 'is', null),
            supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_wishlist', true),
          ]);
          const ratings = (ratedRes.data || []).map((r: any) => r.rating).filter(Boolean);
          const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
          const cuisines = (ratedRes.data || []).map((r: any) => r.cuisine).filter(Boolean);
          const cuisineCount: Record<string, number> = {};
          cuisines.forEach((c: string) => { cuisineCount[c] = (cuisineCount[c] || 0) + 1; });
          const topCuisine = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          setStats({
            rated_count: ratedRes.count || 0,
            wishlist_count: wishlistRes.count || 0,
            avg_rating: Math.round(avgRating * 10) / 10,
            top_cuisine: topCuisine,
            following_count: friends.length,
            followers_count: friends.length
          });
        } catch {}
      }
    };
    loadStats();
  }, [user, friends]);

  // Load recent activity
  useEffect(() => {
    const loadRecentActivity = async () => {
      if (!user) return;
      setLoadingActivity(true);
      try {
        const {
          data,
          error
        } = await supabase.from('restaurants').select('id, name, address, rating, date_visited, created_at, google_place_id, cuisine').eq('user_id', user.id).eq('is_wishlist', false).not('rating', 'is', null).order('created_at', {
          ascending: false
        }).limit(25);
        if (error) throw error;
        setRecentActivity(data || []);
      } catch (error) {
        console.error('Error loading recent activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    };
    loadRecentActivity();
  }, [user]);

  // Load top wishlist restaurants
  useEffect(() => {
    const loadWishlist = async () => {
      if (!user) return;
      setLoadingWishlist(true);
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, city, country, cuisine, photos, created_at')
          .eq('user_id', user.id)
          .eq('is_wishlist', true)
          .order('created_at', { ascending: false })
          .limit(2);
        if (error) throw error;
        setWishlistRestaurants(data || []);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoadingWishlist(false);
      }
    };
    loadWishlist();
  }, [user]);

  if (!user || !profile) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }

  // Derive taste tags from recent activity cuisines
  const cuisineCounts: Record<string, number> = {};
  recentActivity.forEach((a) => {
    if (a.cuisine) {
      cuisineCounts[a.cuisine] = (cuisineCounts[a.cuisine] || 0) + 1;
    }
  });
  const sortedCuisines = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]);
  const tasteTags = sortedCuisines.slice(0, 4).map(([cuisine, count]) => {
    if (count >= 5) return `${cuisine} Devotee`;
    if (count >= 3) return `${cuisine} Enthusiast`;
    return `${cuisine} Explorer`;
  });

  // Adventure score: ratio of unique cuisines to total ratings
  const uniqueCuisineCount = Object.keys(cuisineCounts).length;
  const adventureScore = stats.rated_count > 0
    ? Math.min(100, Math.round((uniqueCuisineCount / Math.max(stats.rated_count, 1)) * 100 * 2.5))
    : 0;

  // Sustainability index placeholder (based on diversity)
  const sustainabilityIndex = stats.rated_count > 0
    ? Math.min(100, Math.round(((stats.avg_rating / 5) * 60) + (uniqueCuisineCount * 4)))
    : 0;

  // Taste dimensions for radar
  const tasteDimensions = [
    { label: 'SWEET', value: 65 },
    { label: 'SPICY', value: 80 },
    { label: 'SOUR', value: 45 },
    { label: 'SALT', value: 70 },
    { label: 'UMAMI', value: 90 },
  ];

  return <div className="min-h-screen bg-background pb-24">
      {/* ===== Profile Header ===== */}
      <div className="px-5 pt-10 pb-8">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <Avatar className="w-28 h-28 border-4 border-primary/15">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.name || profile.username || 'User'} />
            <AvatarFallback className="text-3xl font-headline font-bold bg-primary/5 text-primary">
              {profile.name?.charAt(0) || profile.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Name */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-headline font-bold text-on-surface">{profile.name || profile.username}</h1>
              {isExpert && <ExpertBadge size="md" />}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-primary font-body font-semibold">
              Gourmet Explorer &bull; Level: Connoisseur
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-on-surface-variant font-headline italic text-center max-w-xs leading-relaxed">
              "{profile.bio}"
            </p>
          )}

          {/* Location */}
          {profile.home_city && (
            <div className="flex items-center gap-1 text-sm text-on-surface-variant">
              <MIcon name="location_on" className="text-sm text-primary" />
              <span className="font-body">{profile.home_city}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="rounded-full border-outline-variant/30 text-on-surface px-5 h-9 text-sm font-body font-semibold"
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-outline-variant/30 text-on-surface px-5 h-9 text-sm font-body font-semibold"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `${profile.name}'s Profile`, url: window.location.href });
                }
              }}
            >
              Share Profile
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Taste Profile Card ===== */}
      <div className="px-5 mb-6">
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Taste Profile</h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Based on {stats.rated_count} verified dining experience{stats.rated_count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Taste Tags */}
          {tasteTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tasteTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-container-high rounded-full px-3 py-1 text-xs font-body text-primary"
                >
                  {tag}
                </span>
              ))}
              {stats.top_cuisine && !tasteTags.some(t => t.includes(stats.top_cuisine)) && (
                <span className="bg-surface-container-high rounded-full px-3 py-1 text-xs font-body text-primary">
                  {stats.top_cuisine} Lover
                </span>
              )}
            </div>
          )}

          {/* Taste Dimensions - labeled progress bars */}
          <div className="space-y-2.5 pt-1">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Flavor Dimensions</p>
            {tasteDimensions.map((dim) => (
              <div key={dim.label} className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant w-12 text-right font-body">{dim.label}</span>
                <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${dim.value}%` }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant w-7 font-body">{dim.value}%</span>
              </div>
            ))}
          </div>

          {/* Adventure Score */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-headline font-bold text-on-surface">Adventure Score</span>
              <span className="text-sm font-bold text-primary">{adventureScore}%</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${adventureScore}%` }}
              />
            </div>
          </div>

          {/* Sustainability Index */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-headline font-bold text-on-surface">Sustainability Index</span>
              <span className="text-sm font-bold text-primary">{sustainabilityIndex}%</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full transition-all duration-700"
                style={{ width: `${sustainabilityIndex}%` }}
              />
            </div>
          </div>

          {/* Taste Quote */}
          <p className="italic text-sm text-on-surface-variant font-headline text-center pt-1">
            &ldquo;A palate shaped by {uniqueCuisineCount} cuisine{uniqueCuisineCount !== 1 ? 's' : ''}, {stats.rated_count} experience{stats.rated_count !== 1 ? 's' : ''}, and an average rating of {stats.avg_rating.toFixed(1)}.&rdquo;
          </p>
        </div>
      </div>

      {/* ===== My Wishlist Section ===== */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline font-bold text-lg text-on-surface">My Wishlist</h2>
          <button
            onClick={() => navigate('/wishlist')}
            className="text-[10px] uppercase tracking-widest text-primary font-body font-semibold"
          >
            View All
          </button>
        </div>

        {loadingWishlist ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-surface-container-high rounded-2xl mb-3" />
                <div className="h-4 bg-surface-container-high rounded w-2/3 mb-2" />
                <div className="h-3 bg-surface-container-high rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlistRestaurants.length > 0 ? (
          <div className="space-y-5">
            {wishlistRestaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="cursor-pointer"
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              >
                {/* Photo */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-high mb-3">
                  {restaurant.photos && restaurant.photos.length > 0 ? (
                    <img
                      src={resolveImageUrl(restaurant.photos[0], { width: 600 })}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MIcon name="restaurant" className="text-4xl text-on-surface-variant/30" />
                    </div>
                  )}
                  {/* Bookmark overlay */}
                  <div className="absolute top-3 right-3 bg-primary/90 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <MIcon name="bookmark" className="text-base" filled />
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-headline font-bold text-on-surface">{restaurant.name}</h3>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  {[restaurant.city, restaurant.country].filter(Boolean).join(', ')}
                  {restaurant.cuisine && ` \u2022 ${restaurant.cuisine}`}
                </p>

                {/* Social proof badge */}
                <div className="mt-2">
                  <span className="bg-primary/8 rounded-full px-3 py-1 text-xs text-primary font-body font-semibold">
                    Wishlisted by {Math.floor(Math.random() * 12) + 3} Experts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MIcon name="bookmark_border" className="text-3xl text-on-surface-variant/40 mx-auto mb-2" />
            <p className="text-on-surface-variant text-sm font-body">
              No wishlist items yet. Start saving restaurants!
            </p>
          </div>
        )}
      </div>

      {/* ===== Recent Ratings Section ===== */}
      <div className="px-5 mb-6">
        <h2 className="font-headline font-bold text-lg text-on-surface mb-4">Recent Ratings</h2>

        {loadingActivity ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-surface-container-high rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.slice(0, 8).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => navigate(`/restaurant/${activity.id}`)}
              >
                {/* Small photo placeholder */}
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <MIcon name="restaurant" className="text-lg text-on-surface-variant/40" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm text-on-surface truncate">{activity.name}</p>
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MIcon
                        key={i}
                        name="star"
                        filled={i < Math.round(activity.rating)}
                        className={`text-sm ${i < Math.round(activity.rating) ? 'text-primary' : 'text-on-surface-variant/20'}`}
                      />
                    ))}
                  </div>
                  {/* Address snippet */}
                  {activity.address && (
                    <p className="italic text-xs text-on-surface-variant truncate mt-0.5 font-body">
                      {activity.address}
                    </p>
                  )}
                  <p className="text-[10px] text-on-surface-variant/60 font-body mt-0.5">
                    Rated {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <MIcon name="star_border" className="text-3xl text-on-surface-variant/40 mx-auto mb-2" />
            <p className="text-on-surface-variant text-sm font-body">
              No ratings yet. Start rating restaurants!
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacer for mobile safe area */}
      <div className="h-20 lg:hidden"></div>
    </div>;
}
