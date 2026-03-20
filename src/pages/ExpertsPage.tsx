import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, bio, home_city')
        .in('id', expertIds);

      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('user_id, cuisine, rating')
        .in('user_id', expertIds)
        .eq('is_wishlist', false)
        .not('rating', 'is', null);

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
      <div className="min-h-screen bg-background p-5">
        <div className="max-w-4xl mx-auto space-y-6 pt-12">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-32 bg-surface-container rounded" />
            <div className="h-10 w-72 bg-surface-container rounded" />
            <div className="h-4 w-96 bg-surface-container rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="animate-pulse bg-surface-container aspect-[3/4] rounded-2xl" />
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-48 bg-surface-container rounded" />
              <div className="h-4 w-full bg-surface-container rounded" />
              <div className="h-4 w-3/4 bg-surface-container rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Selected expert detail view
  if (selectedExpert) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-5 pt-6">
          <button
            onClick={() => setSelectedExpert(null)}
            className="flex items-center gap-1 text-on-surface-variant font-body text-sm hover:text-primary transition-colors mb-8"
          >
            <MIcon name="arrow_back" className="text-base" />
            <span>Back to Tastemakers</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Large Photo */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container-low">
              {selectedExpert.avatar_url ? (
                <img
                  src={selectedExpert.avatar_url}
                  alt={selectedExpert.name || selectedExpert.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <span className="font-headline text-6xl text-primary/40">
                    {(selectedExpert.name || selectedExpert.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex flex-col justify-center">
              <p className="uppercase tracking-widest text-[10px] text-on-surface-variant font-body mb-2">
                EXPERT PROFILE
              </p>
              <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2">
                {selectedExpert.name || selectedExpert.username}
              </h1>
              <p className="font-body text-sm text-on-surface-variant mb-4">@{selectedExpert.username}</p>

              {selectedExpert.topCuisines.length > 0 && (
                <div className="inline-flex mb-4">
                  <span className="uppercase tracking-widest text-[10px] font-body bg-primary/8 text-primary px-3 py-1 rounded-full font-semibold">
                    {selectedExpert.topCuisines[0]} SPECIALIST
                  </span>
                </div>
              )}

              {selectedExpert.bio && (
                <p className="font-headline text-base text-on-surface/80 italic leading-relaxed mb-6 border-l-2 border-primary pl-4">
                  "{selectedExpert.bio}"
                </p>
              )}

              {selectedExpert.home_city && (
                <div className="flex items-center gap-1.5 text-on-surface-variant font-body text-sm mb-6">
                  <MIcon name="location_on" className="text-sm text-primary" />
                  {selectedExpert.home_city}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-8 mb-6">
                <div>
                  <div className="font-headline text-2xl text-on-surface">{selectedExpert.restaurantCount}</div>
                  <div className="text-[11px] text-on-surface-variant font-body uppercase tracking-wide">Reviews</div>
                </div>
                {selectedExpert.avgRating > 0 && (
                  <div>
                    <div className="font-headline text-2xl text-on-surface">{selectedExpert.avgRating}</div>
                    <div className="text-[11px] text-on-surface-variant font-body uppercase tracking-wide">Avg Rating</div>
                  </div>
                )}
                {selectedExpert.topCuisines.length > 0 && (
                  <div>
                    <div className="font-headline text-2xl text-on-surface">{selectedExpert.topCuisines.length}</div>
                    <div className="text-[11px] text-on-surface-variant font-body uppercase tracking-wide">Cuisines</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!followingIds.has(selectedExpert.id) ? (
                  <button
                    onClick={() => handleFollow(selectedExpert.id)}
                    className="bg-primary text-white rounded-full px-6 py-2.5 font-body text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Follow
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-surface-container-low text-on-surface-variant rounded-full px-6 py-2.5 font-body text-sm font-semibold border border-outline-variant/30"
                  >
                    Following
                  </button>
                )}
                <button
                  onClick={() => navigate(`/friend-profile/${selectedExpert.id}`)}
                  className="border border-outline-variant/30 text-on-surface rounded-full px-6 py-2.5 font-body text-sm font-semibold hover:bg-surface-container-low transition-colors"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Expert's Top Rated Restaurants */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl text-on-surface">Top Rated Restaurants</h2>
              <span className="text-on-surface-variant font-body text-sm">{expertRestaurants.length} reviews</span>
            </div>

            {loadingRestaurants ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-surface-container h-24 rounded-2xl" />
                ))}
              </div>
            ) : expertRestaurants.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant/15">
                <MIcon name="restaurant" className="text-4xl text-on-surface-variant/30 mb-3" />
                <p className="text-on-surface-variant font-body text-sm">No restaurant reviews yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertRestaurants.map((restaurant, idx) => (
                  <button
                    key={restaurant.id}
                    onClick={() => {
                      if (restaurant.google_place_id) {
                        navigate(`/restaurant/${restaurant.google_place_id}?name=${encodeURIComponent(restaurant.name)}`);
                      }
                    }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center font-headline text-sm text-primary flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-headline text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {restaurant.name}
                      </div>
                      <div className="text-[11px] text-on-surface-variant font-body flex items-center gap-2 mt-0.5">
                        {restaurant.cuisine && <span>{restaurant.cuisine}</span>}
                        {restaurant.city && (
                          <>
                            <span className="text-outline-variant">|</span>
                            <span>{restaurant.city}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 bg-primary/8 px-2.5 py-1 rounded-full">
                      <MIcon name="grade" className="text-sm text-primary" filled />
                      <span className="font-body font-bold text-sm text-primary">{restaurant.rating}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main experts listing page
  const featuredExpert = filteredExperts[0];
  const otherExperts = filteredExperts.slice(1);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-5 pt-10 pb-8">
        <p className="uppercase tracking-widest text-[10px] text-on-surface-variant font-body font-semibold mb-3">
          THE DIGITAL MAÎTRE D'
        </p>
        <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-3">
          Meet the <em className="text-primary italic">Tastemakers</em>
        </h1>
        <p className="font-body text-base text-on-surface-variant max-w-lg leading-relaxed">
          Discover culinary perspectives from the critics, chefs, and food writers shaping how we dine.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-5">
        {/* Search */}
        <div className="relative mb-8">
          <MIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50" />
          <Input
            placeholder="Search by name, cuisine, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-outline-variant/20 bg-surface-container-low font-body text-sm focus:border-primary"
          />
        </div>

        {filteredExperts.length === 0 ? (
          <div className="text-center py-20">
            <MIcon name="search_off" className="text-5xl text-on-surface-variant/30 mx-auto mb-4" />
            <h3 className="font-headline text-lg text-on-surface mb-2">No Experts Found</h3>
            <p className="text-on-surface-variant font-body text-sm">
              {searchQuery ? 'Try a different search term.' : 'No experts have been verified yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Critics */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline text-xl text-on-surface">Featured Critics</h2>
                <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-primary">
                  Curated
                </span>
              </div>

              {/* Featured Expert Card */}
              {featuredExpert && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 cursor-pointer group"
                  onClick={() => handleExpertClick(featuredExpert)}
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-surface-container-low">
                    {featuredExpert.avatar_url ? (
                      <img
                        src={featuredExpert.avatar_url}
                        alt={featuredExpert.name || featuredExpert.username}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <span className="font-headline text-7xl text-primary/30">
                          {(featuredExpert.name || featuredExpert.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center">
                    <h3 className="font-headline text-2xl text-on-surface mb-1 group-hover:text-primary transition-colors">
                      {featuredExpert.name || featuredExpert.username}
                    </h3>
                    <p className="font-body text-sm text-on-surface-variant mb-3">@{featuredExpert.username}</p>

                    {featuredExpert.topCuisines.length > 0 && (
                      <div className="inline-flex mb-4">
                        <span className="uppercase tracking-widest text-[10px] font-body bg-primary/8 text-primary px-3 py-1 rounded-full font-semibold">
                          {featuredExpert.topCuisines[0]} SPECIALIST
                        </span>
                      </div>
                    )}

                    {featuredExpert.bio && (
                      <p className="font-headline text-sm text-on-surface/70 italic leading-relaxed mb-4 border-l-2 border-primary/40 pl-4">
                        "{featuredExpert.bio}"
                      </p>
                    )}

                    <div className="flex items-center gap-6 mb-5">
                      <div className="font-body text-xs text-on-surface-variant">
                        <span className="font-headline text-lg text-on-surface block">{featuredExpert.restaurantCount}</span>
                        reviews
                      </div>
                      {featuredExpert.avgRating > 0 && (
                        <div className="font-body text-xs text-on-surface-variant">
                          <span className="font-headline text-lg text-on-surface block">{featuredExpert.avgRating}</span>
                          avg rating
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-7 h-7 rounded-full bg-surface-container-low border-2 border-background flex items-center justify-center">
                            <MIcon name="person" className="text-[10px] text-on-surface-variant/40" />
                          </div>
                        ))}
                      </div>
                      {!followingIds.has(featuredExpert.id) ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollow(featuredExpert.id);
                          }}
                          className="bg-primary text-white rounded-full px-6 py-2 font-body text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                          Follow
                        </button>
                      ) : (
                        <span className="text-on-surface-variant font-body text-sm bg-surface-container-low rounded-full px-6 py-2 border border-outline-variant/30">
                          Following
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Other Experts Grid */}
              {otherExperts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {otherExperts.map((expert) => (
                    <div
                      key={expert.id}
                      onClick={() => handleExpertClick(expert)}
                      className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:shadow-premium transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12 rounded-full border border-primary/10">
                          <AvatarImage src={expert.avatar_url || ''} className="object-cover" />
                          <AvatarFallback className="bg-primary/8 text-primary font-headline text-sm">
                            {(expert.name || expert.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-headline text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                            {expert.name || expert.username}
                          </h4>
                          {expert.topCuisines.length > 0 ? (
                            <p className="text-primary font-body text-xs">{expert.topCuisines[0]} specialist</p>
                          ) : (
                            <p className="text-on-surface-variant font-body text-xs">@{expert.username}</p>
                          )}
                        </div>
                      </div>

                      {expert.bio && (
                        <p className="font-body text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-3">
                          {expert.bio}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-body text-[11px] text-on-surface-variant">
                          {expert.restaurantCount} reviews
                          {expert.avgRating > 0 && ` · ${expert.avgRating} avg`}
                        </span>
                        {!followingIds.has(expert.id) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollow(expert.id);
                            }}
                            className="bg-primary text-white rounded-full px-4 py-1.5 font-body text-[11px] font-semibold hover:opacity-90 transition-opacity"
                          >
                            Follow
                          </button>
                        ) : (
                          <span className="text-on-surface-variant font-body text-[11px] bg-background rounded-full px-4 py-1.5 border border-outline-variant/20">
                            Following
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Expert Reviews */}
            {filteredExperts.some(e => e.restaurantCount > 0) && (
              <div className="mb-12">
                <h2 className="font-headline text-xl text-on-surface mb-6">Latest Expert Reviews</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredExperts
                    .filter(e => e.restaurantCount > 0 && e.avgRating > 0)
                    .slice(0, 4)
                    .map((expert) => (
                      <div
                        key={expert.id}
                        onClick={() => handleExpertClick(expert)}
                        className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:shadow-premium transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-9 w-9 rounded-full">
                            <AvatarImage src={expert.avatar_url || ''} className="object-cover" />
                            <AvatarFallback className="bg-primary/8 text-primary font-headline text-xs">
                              {(expert.name || expert.username).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-headline text-sm text-on-surface truncate">
                              {expert.name || expert.username}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full">
                            <span className="font-body font-bold text-sm text-primary">{expert.avgRating}</span>
                            <span className="text-on-surface-variant font-body text-[10px]">/10</span>
                          </div>
                        </div>
                        <p className="font-body text-xs text-on-surface-variant mb-2">
                          {expert.topCuisines.length > 0
                            ? `Known for ${expert.topCuisines.join(', ')} cuisine`
                            : `${expert.restaurantCount} restaurants reviewed`
                          }
                        </p>
                        {expert.bio && (
                          <p className="font-headline text-xs text-on-surface/60 italic line-clamp-2">
                            "{expert.bio}"
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
