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

  const featuredRestaurant = useMemo(() => {
    if (ratedRestaurants.length === 0) return null;
    const sorted = [...ratedRestaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted[0];
  }, [ratedRestaurants]);

  const nearYouRestaurants = useMemo(() => {
    return [...ratedRestaurants]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [ratedRestaurants]);

  const topFriend = useMemo(() => {
    const entries = Array.from(friendProfiles.entries());
    if (entries.length === 0) return null;
    const sorted = entries.sort(([, a], [, b]) => (b.avg_rating || 0) - (a.avg_rating || 0));
    const [, friendProfile] = sorted[0];
    const topRestaurant = friendProfile.recent_restaurants?.[0];
    return { profile: friendProfile, restaurant: topRestaurant };
  }, [friendProfiles]);

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
      <div className="max-w-2xl mx-auto px-5 pt-6">

        {/* Editorial Greeting */}
        <div className="mb-6">
          <p className="text-xs font-body font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-headline font-bold text-on-surface">
            {getFirstName()}
          </h1>
        </div>

        {/* Search Bar - editorial style */}
        <div className="mb-6">
          <div
            className="relative cursor-pointer"
            onClick={() => onNavigate('search')}
          >
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-xl">
              search
            </span>
            <div className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline-variant/20 rounded-2xl text-sm font-body text-on-surface-variant/50">
              Search cuisines, chefs, or hidden gems...
            </div>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => onNavigate('search')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full text-xs font-body font-semibold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[14px]">explore</span>
            Discover
          </button>
          <button
            onClick={() => onNavigate('places')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-body font-semibold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[14px]">grade</span>
            My Ratings
          </button>
          <button
            onClick={() => navigate('/friends')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-body font-semibold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[14px]">group</span>
            Friends
          </button>
          <button
            onClick={() => navigate('/experts')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-body font-semibold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Experts
          </button>
        </div>

        {/* Taste Profile Quiz Prompt */}
        {!hasTasteProfile && (
          <section className="mb-6">
            <div
              className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-4 cursor-pointer group"
              onClick={() => navigate('/taste-profile')}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-sm text-on-surface">Discover Your Palate</h4>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">
                  Take a quick taste quiz for personalized recommendations
                </p>
              </div>
              <span className="material-symbols-outlined text-primary text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </section>
        )}

        {/* Featured Restaurant - Editorial Hero Card */}
        {featuredRestaurant && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline text-lg font-bold text-on-surface">Featured</h2>
              <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-primary">Editor's Pick</span>
            </div>
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
                <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-primary/30">restaurant</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-5 left-5 right-16 z-10">
                <h2 className="text-2xl font-headline font-bold text-white leading-tight mb-1">
                  {featuredRestaurant.name}
                </h2>
                <p className="text-white/70 text-sm font-body">
                  {featuredRestaurant.city}{featuredRestaurant.country ? ` \u2022 ${featuredRestaurant.country}` : ''}
                </p>
              </div>

              {featuredRestaurant.rating && (
                <div className="absolute bottom-5 right-5 z-10 bg-white/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-body font-bold text-sm text-on-surface">
                    {featuredRestaurant.rating}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!featuredRestaurant && (
          <section className="mb-8">
            <div className="w-full aspect-[4/3] rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-3">restaurant</span>
              <p className="text-on-surface-variant font-body text-sm mb-4">No restaurants yet</p>
              <button
                onClick={onOpenAddRestaurant}
                className="bg-primary text-white rounded-full px-6 py-2.5 text-sm font-body font-bold"
              >
                Add Your First
              </button>
            </div>
          </section>
        )}

        {/* Top Rated by Friend */}
        {topFriend && topFriend.restaurant && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {topFriend.profile.avatar_url ? (
                  <img
                    src={topFriend.profile.avatar_url}
                    alt={topFriend.profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                )}
              </div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Top rated by {topFriend.profile.name || topFriend.profile.username}
              </h3>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {topFriend.restaurant.photo_url ? (
                  <img
                    src={topFriend.restaurant.photo_url}
                    alt={topFriend.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary/40 text-xl">restaurant</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                  {topFriend.restaurant.name || 'A favorite spot'}
                </h4>
                <p className="text-xs text-on-surface-variant font-body mt-0.5 line-clamp-2">
                  {topFriend.restaurant.notes || topFriend.restaurant.cuisine || 'Highly recommended'}
                </p>
              </div>
              {topFriend.restaurant.rating && (
                <div className="flex items-center gap-1 bg-primary/8 px-2.5 py-1 rounded-full flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-primary text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-body font-bold text-sm text-on-surface">{topFriend.restaurant.rating}</span>
                </div>
              )}
            </div>

            <button
              className="mt-3 text-primary text-sm font-body font-semibold flex items-center gap-1"
              onClick={() => onNavigate('search')}
            >
              View {topFriend.profile.name || topFriend.profile.username}'s Full List
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </section>
        )}

        {/* Friend Activity */}
        {friendActivityCount > 0 && (
          <section className="mb-8">
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex -space-x-2 flex-shrink-0">
                {friendAvatars.map((friend, i) => (
                  <div
                    key={friend.id || i}
                    className="w-8 h-8 rounded-full border-2 border-surface-container-low bg-primary/10 flex items-center justify-center overflow-hidden"
                  >
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-xs">person</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-body text-on-surface-variant">
                <span className="font-bold text-on-surface">{friendActivityCount} friend{friendActivityCount !== 1 ? 's' : ''}</span>
                {' '}rated restaurants this week
              </p>
            </div>
          </section>
        )}

        {/* Near You Section - Bento Grid */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-1">
            <h3 className="font-headline text-xl font-bold text-on-surface">Near You</h3>
            <button
              className="text-primary text-sm font-body font-semibold"
              onClick={() => onNavigate('places')}
            >
              See all
            </button>
          </div>
          <p className="text-on-surface-variant text-sm font-body mb-5">
            Discover what's cooking in your neighborhood
          </p>

          {nearYouRestaurants.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {nearYouRestaurants.map((restaurant, i) => (
                <div
                  key={restaurant.id}
                  className={`cursor-pointer group ${i === 0 ? 'col-span-2' : ''}`}
                  onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                >
                  <div className={`relative ${i === 0 ? 'aspect-[16/9]' : 'aspect-[3/4]'} rounded-2xl overflow-hidden mb-2`}>
                    {restaurant.photos?.[0] ? (
                      <img
                        src={restaurant.photos[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant/20">restaurant</span>
                      </div>
                    )}

                    {/* Rating badge */}
                    {restaurant.rating && restaurant.rating >= 4 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-white/90 backdrop-blur text-primary text-[10px] font-body font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {restaurant.rating}
                        </span>
                      </div>
                    )}

                    {/* Bookmark */}
                    <button
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <span className="material-symbols-outlined text-on-surface text-lg">bookmark</span>
                    </button>

                    {/* Gradient overlay for first card */}
                    {i === 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    )}

                    {/* Name overlay for first card */}
                    {i === 0 && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <h4 className="font-headline font-bold text-lg text-white">{restaurant.name}</h4>
                        <p className="text-white/70 text-xs font-body">
                          {restaurant.cuisine}{restaurant.city ? ` \u2022 ${restaurant.city}` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info below image for non-hero cards */}
                  {i > 0 && (
                    <>
                      <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                        {restaurant.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-body mt-0.5 truncate">
                        {restaurant.cuisine}
                        {restaurant.city ? ` \u2022 ${restaurant.city}` : ''}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 mb-3 block">explore</span>
              <p className="text-sm text-on-surface-variant font-body">No restaurants nearby yet</p>
              <p className="text-xs text-on-surface-variant/60 font-body mt-1">Start adding your discoveries!</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
