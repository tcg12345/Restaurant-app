import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Search, Star, MapPin, UserPlus, UserCheck, ChevronRight, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Expert {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  home_city: string | null;
  restaurantCount: number;
  avgRating: number;
  topCuisines: string[];
  isFollowing: boolean;
}

interface ExpertRestaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  city: string;
  google_place_id: string;
  photos: string[];
}

export default function ExpertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [expertRestaurants, setExpertRestaurants] = useState<ExpertRestaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadExperts();
      loadFollowing();
    }
  }, [user]);

  const loadFollowing = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('friends')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const ids = new Set(data?.map(f => f.user1_id === user.id ? f.user2_id : f.user1_id) || []);
      setFollowingIds(ids);
    } catch (err) {
      console.error('Error loading following:', err);
    }
  };

  const loadExperts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Get expert user IDs
      const { data: expertRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'expert');

      if (!expertRoles || expertRoles.length === 0) {
        setExperts([]);
        setIsLoading(false);
        return;
      }

      const expertIds = expertRoles.map(r => r.user_id);

      // Get expert profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, bio, home_city')
        .in('id', expertIds);

      // Get expert restaurant stats
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('user_id, cuisine, rating')
        .in('user_id', expertIds)
        .eq('is_wishlist', false)
        .not('rating', 'is', null);

      // Build expert objects
      const expertMap = new Map<string, Expert>();
      profiles?.forEach(p => {
        expertMap.set(p.id, {
          id: p.id,
          username: p.username || 'expert',
          name: p.name,
          avatar_url: p.avatar_url,
          bio: p.bio,
          home_city: p.home_city,
          restaurantCount: 0,
          avgRating: 0,
          topCuisines: [],
          isFollowing: followingIds.has(p.id),
        });
      });

      // Compute stats
      const expertCuisines: Record<string, Record<string, number>> = {};
      const expertRatings: Record<string, number[]> = {};

      restaurants?.forEach(r => {
        const expert = expertMap.get(r.user_id);
        if (expert) {
          expert.restaurantCount++;
          if (r.rating) {
            if (!expertRatings[r.user_id]) expertRatings[r.user_id] = [];
            expertRatings[r.user_id].push(r.rating);
          }
          if (r.cuisine) {
            if (!expertCuisines[r.user_id]) expertCuisines[r.user_id] = {};
            expertCuisines[r.user_id][r.cuisine] = (expertCuisines[r.user_id][r.cuisine] || 0) + 1;
          }
        }
      });

      expertMap.forEach((expert, id) => {
        if (expertRatings[id]) {
          expert.avgRating = Number((expertRatings[id].reduce((a, b) => a + b, 0) / expertRatings[id].length).toFixed(1));
        }
        if (expertCuisines[id]) {
          expert.topCuisines = Object.entries(expertCuisines[id])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([cuisine]) => cuisine);
        }
      });

      const sortedExperts = Array.from(expertMap.values())
        .sort((a, b) => b.restaurantCount - a.restaurantCount);

      setExperts(sortedExperts);
    } catch (err) {
      console.error('Error loading experts:', err);
      toast.error('Failed to load experts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (expertId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({ sender_id: user.id, receiver_id: expertId, status: 'pending' });
      if (error) throw error;
      toast.success('Follow request sent!');
      setFollowingIds(prev => new Set([...prev, expertId]));
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        toast.info('Request already sent');
      } else {
        toast.error('Failed to send follow request');
      }
    }
  };

  const loadExpertRestaurants = async (expertId: string) => {
    setLoadingRestaurants(true);
    try {
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, cuisine, rating, city, google_place_id, photos')
        .eq('user_id', expertId)
        .eq('is_wishlist', false)
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .limit(20);
      setExpertRestaurants(data || []);
    } catch (err) {
      console.error('Error loading expert restaurants:', err);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const handleExpertClick = (expert: Expert) => {
    setSelectedExpert(expert);
    loadExpertRestaurants(expert.id);
  };

  const filteredExperts = experts.filter(e =>
    !searchQuery ||
    e.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.topCuisines.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // If an expert is selected, show their profile
  if (selectedExpert) {
    return (
      <div className="min-h-screen bg-background">
        {/* Expert Profile Header */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/50 pt-safe-area-top">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedExpert(null)}
              className="mb-4 -ml-2 text-muted-foreground"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              All Experts
            </Button>

            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={selectedExpert.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {(selectedExpert.name || selectedExpert.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold">{selectedExpert.name || selectedExpert.username}</h1>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                    <Crown className="h-3 w-3" />
                    Expert
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">@{selectedExpert.username}</p>
                {selectedExpert.bio && (
                  <p className="text-sm text-foreground mt-2">{selectedExpert.bio}</p>
                )}
                {selectedExpert.home_city && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedExpert.home_city}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedExpert.restaurantCount}</div>
                    <div className="text-xs text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedExpert.avgRating}</div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!followingIds.has(selectedExpert.id) ? (
                    <Button size="sm" onClick={() => handleFollow(selectedExpert.id)}>
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Follow
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      <UserCheck className="h-4 w-4 mr-1.5" />
                      Following
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/friend-profile/${selectedExpert.id}`)}
                  >
                    View Full Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expert's Top Rated Restaurants */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold mb-4">Top Rated Restaurants</h2>
          {loadingRestaurants ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-muted h-20 rounded-xl" />
              ))}
            </div>
          ) : expertRestaurants.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No restaurant reviews yet.
            </p>
          ) : (
            <div className="space-y-2">
              {expertRestaurants.map((restaurant, idx) => (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    if (restaurant.google_place_id) {
                      navigate(`/restaurant/${restaurant.google_place_id}?name=${encodeURIComponent(restaurant.name)}`);
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{restaurant.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                      {restaurant.city && (
                        <>
                          <span className="text-border">|</span>
                          <span>{restaurant.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-sm">{restaurant.rating}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background pt-safe-area-top">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Crown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Food Experts</h1>
              <p className="text-sm text-muted-foreground">
                Follow trusted experts for curated recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experts by name or cuisine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Expert Cards */}
        {filteredExperts.length === 0 ? (
          <div className="text-center py-16">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Experts Found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'Try a different search term.' : 'No experts have been verified yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExperts.map((expert) => (
              <Card
                key={expert.id}
                className="border-border/50 hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
                onClick={() => handleExpertClick(expert)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 border border-amber-500/20">
                      <AvatarImage src={expert.avatar_url || ''} />
                      <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold">
                        {(expert.name || expert.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {expert.name || expert.username}
                        </span>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1.5 py-0 gap-0.5 flex-shrink-0">
                          <Crown className="h-2.5 w-2.5" />
                          Expert
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">@{expert.username}</p>
                      {expert.bio && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{expert.bio}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          <strong className="text-foreground">{expert.restaurantCount}</strong> reviews
                        </span>
                        {expert.avgRating > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <strong className="text-foreground">{expert.avgRating}</strong> avg
                          </span>
                        )}
                        {expert.home_city && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {expert.home_city}
                          </span>
                        )}
                      </div>
                      {expert.topCuisines.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {expert.topCuisines.map((cuisine) => (
                            <Badge key={cuisine} variant="secondary" className="text-[10px] px-2 py-0">
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {!followingIds.has(expert.id) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(expert.id);
                          }}
                          className="rounded-full text-xs h-8"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Follow
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Following
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
