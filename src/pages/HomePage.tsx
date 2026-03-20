import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MapPin,
  Heart,
  Plus,
  TrendingUp,
  Award,
  ChefHat,
  Users,
  Clock,
  Utensils,
  ArrowRight,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { useNavigate } from 'react-router-dom';

interface HomePageProps {
  onNavigate: (tab: 'places' | 'search' | 'profile') => void;
  onOpenAddRestaurant: () => void;
}

export default function HomePage({ onNavigate, onOpenAddRestaurant }: HomePageProps) {
  const { user, profile } = useAuth();
  const { restaurants } = useRestaurants();
  const navigate = useNavigate();
  const [rotatingCardIndex, setRotatingCardIndex] = useState(0);

  const ratedRestaurants = restaurants.filter(r => !r.isWishlist);
  const wishlistRestaurants = restaurants.filter(r => r.isWishlist);
  const michelinRestaurants = ratedRestaurants.filter(r => r.michelinStars);

  const averageRating = ratedRestaurants.length > 0
    ? ratedRestaurants.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedRestaurants.length
    : 0;

  const recentRestaurants = [...ratedRestaurants]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const highestRatedRestaurants = [...ratedRestaurants]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

  const randomRestaurants = [...ratedRestaurants]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const recentWishlistRestaurants = [...wishlistRestaurants]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const cuisineStats = ratedRestaurants.reduce((acc, r) => {
    acc[r.cuisine] = (acc[r.cuisine] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCuisines = Object.entries(cuisineStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  const topCuisineRestaurants = topCuisines.length > 0
    ? ratedRestaurants.filter(r => r.cuisine === topCuisines[0][0]).slice(0, 3)
    : [];

  const cardRotationData = [
    { title: "Recently Rated", description: "Your latest dining experiences", restaurants: recentRestaurants, icon: 'schedule' },
    { title: "Highest Rated", description: "Your top-rated restaurants", restaurants: highestRatedRestaurants, icon: 'star' },
    { title: "Random Picks", description: "A random selection from your collection", restaurants: randomRestaurants, icon: 'trending_up' },
    { title: "Recently Added", description: "Latest additions to your wishlist", restaurants: recentWishlistRestaurants, icon: 'favorite' },
    { title: "Top Cuisine", description: `From your favorite ${topCuisines.length > 0 ? topCuisines[0][0] : 'cuisine'}`, restaurants: topCuisineRestaurants, icon: 'restaurant' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRotatingCardIndex((prev) => (prev + 1) % cardRotationData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [cardRotationData.length]);

  const currentCardData = cardRotationData[rotatingCardIndex];

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

  const stats = [
    { title: 'Rated', value: ratedRestaurants.length, icon: 'restaurant' },
    { title: 'Wishlist', value: wishlistRestaurants.length, icon: 'favorite' },
    { title: 'Michelin', value: michelinRestaurants.reduce((sum, r) => sum + (r.michelinStars || 0), 0), icon: 'stars' },
    { title: 'Avg Rating', value: averageRating.toFixed(1), icon: 'grade' },
  ];

  return (
    <>
      {/* Mobile Layout - Editorial Design */}
      <div className="md:hidden min-h-screen bg-background pb-24">
        {/* Hero Greeting */}
        <section className="px-6 pt-6 mb-8">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer shadow-premium">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-primary/20"></div>
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <p className="text-white/70 font-label text-[10px] font-bold uppercase tracking-widest mb-2">
                Daily Recommendation
              </p>
              <h2 className="text-white font-headline font-bold text-3xl mb-2 leading-tight">
                {getGreeting()}, {getFirstName()}
              </h2>
              <p className="text-white/80 text-sm font-body">
                Your culinary journey continues
              </p>
            </div>
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-secondary/90 text-secondary-foreground border-0">
                <span className="material-symbols-outlined text-xs mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                {ratedRestaurants.length} Rated
              </Badge>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="px-6 mb-8">
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="bg-surface-container-low rounded-xl p-3 text-center">
                <span className="material-symbols-outlined text-secondary text-lg mb-1 block">
                  {stat.icon}
                </span>
                <div className="text-lg font-headline font-bold text-primary">{stat.value}</div>
                <div className="text-[10px] font-label font-medium uppercase tracking-wider text-on-surface-variant">{stat.title}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions - Editorial Grid */}
        <section className="px-6 mb-10">
          <div className="grid grid-cols-3 gap-3">
            <button
              className="bg-secondary text-secondary-foreground py-4 px-3 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              onClick={() => onNavigate('search')}
            >
              <span className="material-symbols-outlined text-xl">search</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Discover</span>
            </button>
            <button
              className="bg-primary text-primary-foreground py-4 px-3 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              onClick={onOpenAddRestaurant}
            >
              <span className="material-symbols-outlined text-xl">add</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Rate</span>
            </button>
            <button
              className="bg-surface-container-high text-primary py-4 px-3 rounded-xl flex flex-col items-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all"
              onClick={() => navigate('/map')}
            >
              <span className="material-symbols-outlined text-xl">map</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Map</span>
            </button>
          </div>
        </section>

        {/* Featured Section - Rotating Card */}
        <section className="px-6 mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">Featured</h3>
              <p className="text-on-surface-variant text-sm">{currentCardData.description}</p>
            </div>
            <div className="flex gap-1">
              {cardRotationData.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === rotatingCardIndex ? 'w-8 bg-secondary' : 'w-2 bg-outline-variant/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {currentCardData.restaurants.length > 0 ? (
            <div className="space-y-4">
              {currentCardData.restaurants.map((restaurant) => (
                <div key={restaurant.id} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-surface-container transition-colors">
                  <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-primary-container text-xl">restaurant</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline font-bold text-sm text-primary truncate">{restaurant.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{restaurant.cuisine} &bull; {restaurant.city}</p>
                  </div>
                  {restaurant.rating && (
                    <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-full">
                      <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-headline font-bold text-sm text-primary">{restaurant.rating}</span>
                    </div>
                  )}
                </div>
              ))}
              <button
                className="w-full text-secondary text-sm font-headline font-bold flex items-center justify-center gap-1 py-3"
                onClick={() => onNavigate('places')}
              >
                View All <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">restaurant</span>
              <p className="text-sm text-on-surface-variant">No restaurants yet</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Start your culinary journey!</p>
            </div>
          )}
        </section>

        {/* Cuisine Insights */}
        <section className="px-6 mb-10">
          <h3 className="font-headline text-2xl font-bold tracking-tight text-primary mb-6">Your Palate</h3>
          <div className="bg-surface-container-low rounded-xl p-6">
            {topCuisines.length > 0 ? (
              <div className="space-y-5">
                {topCuisines.map(([cuisine, count]) => (
                  <div key={cuisine} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-semibold text-sm text-primary">{cuisine}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{count} places</span>
                    </div>
                    <Progress value={(count / ratedRestaurants.length) * 100} className="h-1.5" />
                  </div>
                ))}
                <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-lg font-headline font-bold text-secondary">{averageRating.toFixed(1)}</div>
                    <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Avg Rating</div>
                  </div>
                  {michelinRestaurants.length > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-headline font-bold text-primary">{michelinRestaurants.length}</div>
                      <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Michelin</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-3 block">psychology</span>
                <p className="text-sm text-on-surface-variant">Rate restaurants to see insights!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 mb-8">
          <div className="bg-primary-container rounded-xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-7xl text-white">restaurant</span>
            </div>
            <span className="material-symbols-outlined text-3xl text-secondary-container mb-3 block">
              {ratedRestaurants.length > 0 ? 'trending_up' : 'restaurant'}
            </span>
            <h3 className="font-headline font-bold text-white text-lg mb-2">
              {ratedRestaurants.length > 0 ? 'Keep Exploring!' : 'Start Your Journey'}
            </h3>
            <p className="text-on-primary-container text-sm mb-4">
              {ratedRestaurants.length > 0
                ? `${ratedRestaurants.length} restaurants rated. Discover more!`
                : 'Rate your first restaurant for personalized recommendations'
              }
            </p>
            <Button
              className="bg-secondary text-secondary-foreground rounded-full px-6 font-headline font-bold"
              onClick={onOpenAddRestaurant}
            >
              <span className="material-symbols-outlined text-sm mr-1">add</span>
              Add Restaurant
            </Button>
          </div>
        </section>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block w-full py-8 space-y-10 px-6">
        {/* Hero Section */}
        <section className="relative w-full aspect-[21/9] rounded-xl overflow-hidden group cursor-pointer shadow-premium-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-primary/10"></div>
          <div className="absolute top-6 left-6 z-20">
            <Badge className="bg-secondary/90 text-secondary-foreground border-0 shadow-lg">
              <span className="material-symbols-outlined text-xs mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {ratedRestaurants.length} Restaurants Rated
            </Badge>
          </div>
          <div className="absolute bottom-8 left-8 right-8 z-20">
            <p className="text-white/70 font-headline font-medium text-sm uppercase tracking-widest mb-2">Welcome Back</p>
            <h2 className="text-white font-headline font-bold text-5xl mb-4 leading-tight">
              {getGreeting()}, {getFirstName()}
            </h2>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">restaurant</span>
                <span className="text-sm font-medium">{ratedRestaurants.length} rated</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-background/40"></div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">favorite</span>
                <span className="text-sm font-medium">{wishlistRestaurants.length} wishlisted</span>
              </div>
              {michelinRestaurants.length > 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-background/40"></div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-lg">stars</span>
                    <span className="text-sm font-medium">{michelinRestaurants.length} Michelin</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">Quick Actions</h3>
              <p className="text-on-surface-variant text-sm">Start exploring your culinary world</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <button
              className="bg-secondary text-secondary-foreground py-5 px-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-secondary/20"
              onClick={() => onNavigate('search')}
            >
              <span className="material-symbols-outlined text-2xl">search</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Discover</span>
            </button>
            <button
              className="bg-primary text-primary-foreground py-5 px-4 rounded-xl flex flex-col items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              onClick={onOpenAddRestaurant}
            >
              <span className="material-symbols-outlined text-2xl">add_circle</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Add Rating</span>
            </button>
            <button
              className="bg-surface-container-high text-primary py-5 px-4 rounded-xl flex flex-col items-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all"
              onClick={() => navigate('/map')}
            >
              <span className="material-symbols-outlined text-2xl">map</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Map View</span>
            </button>
            <button
              className="bg-surface-container-high text-primary py-5 px-4 rounded-xl flex flex-col items-center gap-2 hover:bg-surface-container-highest active:scale-95 transition-all"
              onClick={() => onNavigate('places')}
            >
              <span className="material-symbols-outlined text-2xl">favorite</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">Wishlist</span>
            </button>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Featured Restaurants */}
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">{currentCardData.title}</h3>
                <p className="text-on-surface-variant text-sm">{currentCardData.description}</p>
              </div>
              <div className="flex gap-1">
                {cardRotationData.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      index === rotatingCardIndex ? 'w-8 bg-secondary' : 'w-2 bg-outline-variant/40'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {currentCardData.restaurants.length > 0 ? (
                <>
                  {currentCardData.restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4 group cursor-pointer hover:bg-surface-container transition-colors">
                      <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-on-primary-container text-xl">restaurant</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline font-bold text-sm text-primary truncate">{restaurant.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">{restaurant.cuisine} &bull; {restaurant.city}</p>
                      </div>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 bg-secondary/10 px-2.5 py-1 rounded-full">
                          <span className="material-symbols-outlined text-secondary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="font-headline font-bold text-sm text-primary">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-border/20 text-secondary hover:bg-secondary/5"
                    onClick={() => onNavigate('places')}
                  >
                    View All Ratings
                  </Button>
                </>
              ) : (
                <div className="bg-surface-container-low rounded-xl p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 block">restaurant</span>
                  <p className="text-on-surface-variant">No restaurants rated yet</p>
                  <p className="text-sm text-on-surface-variant/60 mt-1">Start your culinary journey!</p>
                </div>
              )}
            </div>
          </section>

          {/* Cuisine Insights */}
          <section>
            <div className="mb-6">
              <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">Your Palate</h3>
              <p className="text-on-surface-variant text-sm">Most visited cuisine types</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-6 space-y-5">
              {topCuisines.length > 0 ? (
                <>
                  {topCuisines.map(([cuisine, count]) => (
                    <div key={cuisine} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-headline font-semibold text-sm text-primary">{cuisine}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{count} restaurants</span>
                      </div>
                      <Progress value={(count / ratedRestaurants.length) * 100} className="h-1.5" />
                    </div>
                  ))}
                  <div className="pt-4 border-t border-outline-variant/10 grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-lg p-3 text-center">
                      <div className="text-2xl font-headline font-bold text-secondary">{averageRating.toFixed(1)}</div>
                      <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mt-1">Avg Rating</div>
                    </div>
                    {michelinRestaurants.length > 0 && (
                      <div className="bg-background rounded-lg p-3 text-center">
                        <div className="text-2xl font-headline font-bold text-primary">{michelinRestaurants.length}</div>
                        <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mt-1">Michelin Starred</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3 block">psychology</span>
                  <p className="text-on-surface-variant">No cuisine data yet</p>
                  <p className="text-sm text-on-surface-variant/60 mt-1">Start rating restaurants!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* CTA Banner */}
        <section className="bg-primary-container rounded-xl p-8 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <span className="material-symbols-outlined text-[120px] text-white">format_quote</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-white text-xl mb-2">
              {ratedRestaurants.length > 0 ? 'Continue Your Culinary Journey' : 'Start Your Culinary Journey'}
            </h3>
            <p className="text-on-primary-container text-sm">
              {ratedRestaurants.length > 0
                ? `${ratedRestaurants.length} restaurants rated, ${wishlistRestaurants.length} on your wishlist`
                : 'Rate your first restaurant and unlock personalized recommendations'
              }
            </p>
          </div>
          <Button
            className="bg-secondary text-secondary-foreground rounded-full px-8 py-4 font-headline font-bold shadow-lg shadow-secondary/20"
            onClick={onOpenAddRestaurant}
          >
            Add Restaurant
          </Button>
        </section>
      </div>
    </>
  );
}
