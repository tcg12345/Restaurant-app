import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useFriendProfiles } from '@/contexts/FriendProfilesContext';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onNavigate: (tab: 'places' | 'search' | 'profile') => void;
  onOpenAddRestaurant: () => void;
}

export default function HomePage({ onNavigate, onOpenAddRestaurant }: HomePageProps) {
  const { user, profile } = useAuth();
  const { restaurants } = useRestaurants();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'friends' | 'near'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasTasteProfile, setHasTasteProfile] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('taste_profile');
      setHasTasteProfile(!!saved);
    } catch {
      setHasTasteProfile(false);
    }
  }, []);

  const { profilesCache: friendProfiles } = useFriendProfiles();

  const ratedRestaurants = restaurants.filter(r => !r.isWishlist);

  // Featured restaurant: highest rated, fallback to most recent
  const featuredRestaurant = useMemo(() => {
    if (ratedRestaurants.length === 0) return null;
    const sorted = [...ratedRestaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted[0];
  }, [ratedRestaurants]);

  // Near you restaurants (all rated, shown as discovery)
  const nearYouRestaurants = useMemo(() => {
    return [...ratedRestaurants]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [ratedRestaurants]);

  // Top rated friend data
  const topFriend = useMemo(() => {
    const entries = Array.from(friendProfiles.entries());
    if (entries.length === 0) return null;
    // Pick the friend with the highest avg rating
    const sorted = entries.sort(([, a], [, b]) => (b.avg_rating || 0) - (a.avg_rating || 0));
    const [, friendProfile] = sorted[0];
    const topRestaurant = friendProfile.recent_restaurants?.[0];
    return { profile: friendProfile, restaurant: topRestaurant };
  }, [friendProfiles]);

  // Friend activity summary
  const friendActivityCount = friendProfiles.size;
  const friendAvatars = useMemo(() => {
    return Array.from(friendProfiles.values()).slice(0, 3);
  }, [friendProfiles]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getFirstName = () => {
    if (profile?.name) {
      const firstName = profile.name.split(' ')[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      const firstName = emailName.split(/[._]/)[0];
      return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }
    return 'Food Lover';
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-2xl mx-auto px-5 pt-5">

        {/* Greeting */}
        <p className="text-sm text-on-surface-variant font-body mb-3">
          {getGreeting()}, {getFirstName()}
        </p>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cuisines, chefs, or hidden gems..."
              className="w-full pl-12 pr-4 py-3 bg-surface-container-high rounded-full text-sm font-body text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveFilter('friends')}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
              activeFilter === 'friends'
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Friends' Favorites
          </button>
          <button
            onClick={() => setActiveFilter('near')}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
              activeFilter === 'near'
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Near You
          </button>
        </div>

        {/* Taste Profile Quiz Prompt */}
        {!hasTasteProfile && (
          <section className="mb-6">
            <div
              className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4 cursor-pointer group border border-secondary/20"
              onClick={() => navigate('/taste-profile')}
            >
              <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-sm text-primary">Discover Your Palate</h4>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  Take a quick taste quiz to get personalized recommendations
                </p>
              </div>
              <span className="material-symbols-outlined text-secondary text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </section>
        )}

        {/* Featured Restaurant Hero Card */}
        {featuredRestaurant && (
          <section className="mb-8">
            <div
              className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/restaurant/${featuredRestaurant.id}`)}
            >
              {featuredRestaurant.photos?.[0] ? (
                <img
                  src={featuredRestaurant.photos[0]}
                  alt={featuredRestaurant.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-primary/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Restaurant Name Overlay */}
              <div className="absolute bottom-5 left-5 right-16 z-10">
                <h2 className="text-2xl font-headline font-bold text-white leading-tight mb-1">
                  {featuredRestaurant.name}
                </h2>
                <p className="text-white/80 text-sm font-body">
                  {featuredRestaurant.city}{featuredRestaurant.country ? ` \u2022 ${featuredRestaurant.country}` : ''}
                </p>
              </div>

              {/* Rating Badge */}
              {featuredRestaurant.rating && (
                <div className="absolute bottom-5 right-5 z-10 bg-background/90 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-secondary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-headline font-bold text-sm text-primary">
                    {featuredRestaurant.rating}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty state when no restaurants */}
        {!featuredRestaurant && (
          <section className="mb-8">
            <div className="w-full aspect-[4/3] rounded-2xl bg-surface-container-low flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">restaurant</span>
              <p className="text-on-surface-variant font-body text-sm">No restaurants yet</p>
              <button
                onClick={onOpenAddRestaurant}
                className="mt-4 bg-primary text-white rounded-full px-6 py-2 text-sm font-headline font-bold"
              >
                Add Your First
              </button>
            </div>
          </section>
        )}

        {/* Top Rated by Friend Section */}
        {topFriend && topFriend.restaurant && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                {topFriend.profile.avatar_url ? (
                  <img
                    src={topFriend.profile.avatar_url}
                    alt={topFriend.profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-secondary text-sm">person</span>
                )}
              </div>
              <h3 className="font-headline font-bold text-base text-primary">
                Top rated by {topFriend.profile.name || topFriend.profile.username}
              </h3>
            </div>

            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                {topFriend.restaurant.photo_url ? (
                  <img
                    src={topFriend.restaurant.photo_url}
                    alt={topFriend.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-on-primary-container text-xl">restaurant</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-sm text-primary truncate">
                  {topFriend.restaurant.name || 'A favorite spot'}
                </h4>
                <p className="text-xs text-on-surface-variant font-body mt-0.5 line-clamp-2">
                  {topFriend.restaurant.notes || topFriend.restaurant.cuisine || 'Highly recommended'}
                </p>
              </div>
              {topFriend.restaurant.rating && (
                <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-full flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-secondary text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-headline font-bold text-sm text-primary">{topFriend.restaurant.rating}</span>
                </div>
              )}
            </div>

            <button
              className="mt-3 text-secondary text-sm font-headline font-medium flex items-center gap-1"
              onClick={() => onNavigate('search')}
            >
              View {topFriend.profile.name || topFriend.profile.username}'s Full List
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </section>
        )}

        {/* Friend Activity Pill */}
        {friendActivityCount > 0 && (
          <section className="mb-8">
            <div className="bg-surface-container-low rounded-2xl p-4 flex items-center gap-3">
              {/* Overlapping Avatars */}
              <div className="flex -space-x-2 flex-shrink-0">
                {friendAvatars.map((friend, i) => (
                  <div
                    key={friend.id || i}
                    className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-secondary/20 flex items-center justify-center overflow-hidden"
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-xs">person</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-body text-on-surface-variant">
                <span className="font-bold text-primary">{friendActivityCount} friend{friendActivityCount !== 1 ? 's' : ''}</span>
                {' '}rated restaurants this week
              </p>
            </div>
          </section>
        )}

        {/* Near You Section */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-1">
            <h3 className="font-headline text-xl font-bold text-primary">Near You</h3>
            <button
              className="text-secondary text-sm font-headline font-medium"
              onClick={() => onNavigate('places')}
            >
              See all
            </button>
          </div>
          <p className="text-on-surface-variant text-sm font-body mb-5">
            Discover what's cooking in your neighborhood
          </p>

          {nearYouRestaurants.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {nearYouRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  {/* Photo */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2">
                    {restaurant.photos?.[0] ? (
                      <img
                        src={restaurant.photos[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">restaurant</span>
                      </div>
                    )}

                    {/* Bookmark Overlay */}
                    <button
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/70 backdrop-blur flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        // bookmark action placeholder
                      }}
                    >
                      <span className="material-symbols-outlined text-primary text-lg">bookmark</span>
                    </button>

                    {/* Social Proof Badge */}
                    {restaurant.rating && restaurant.rating >= 4 && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="bg-secondary/10 text-secondary uppercase text-[10px] tracking-wider font-bold px-2 py-1 rounded-full backdrop-blur">
                          Top Rated by Friends
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <h4 className="font-headline font-bold text-sm text-primary truncate">
                    {restaurant.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-body mt-0.5 truncate">
                    {restaurant.cuisine}
                    {restaurant.city ? ` \u2022 ${restaurant.city}` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">explore</span>
              <p className="text-sm text-on-surface-variant font-body">No restaurants nearby yet</p>
              <p className="text-xs text-on-surface-variant/60 font-body mt-1">Start adding your discoveries!</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
