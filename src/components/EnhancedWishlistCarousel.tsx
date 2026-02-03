import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, MapPin, Heart, Trash2, ChevronRight, GripVertical, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MichelinStars } from '@/components/MichelinStars';

interface WishlistRestaurant {
  id: string;
  place_id: string;
  name: string;
  cuisine?: string;
  city?: string;
  country?: string;
  price_range?: number;
  michelin_stars?: number;
  photo_url?: string;
  created_at: string;
}

export function EnhancedWishlistCarousel() {
  const [savedPlaces, setSavedPlaces] = useState<WishlistRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [swipingCard, setSwipingCard] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    try {
      if (!user) {
        setSavedPlaces([]);
        setLoading(false);
        return;
      }
      const { data: wishlistData } = await supabase
        .from('restaurants')
        .select('id, google_place_id, name, cuisine, city, country, price_range, michelin_stars, photos, created_at')
        .eq('user_id', user.id)
        .eq('is_wishlist', true)
        .order('created_at', { ascending: false })
        .limit(15);
      
      const places = (wishlistData || []).map(item => ({
        id: item.id,
        place_id: item.google_place_id,
        name: item.name,
        cuisine: item.cuisine || undefined,
        city: item.city || undefined,
        country: item.country || undefined,
        price_range: item.price_range || undefined,
        michelin_stars: item.michelin_stars || undefined,
        photo_url: item.photos?.[0] || undefined,
        created_at: item.created_at
      }));
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setSavedPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, placeId: string, placeName: string) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('google_place_id', placeId)
        .eq('user_id', user?.id)
        .eq('is_wishlist', true);

      if (error) throw error;

      setSavedPlaces(prev => prev.filter(p => p.place_id !== placeId));
      toast.success(`Removed ${placeName} from wishlist`);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleTouchStart = (e: React.TouchEvent, cardId: string) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipingCard(cardId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingCard) return;
    touchCurrentX.current = e.touches[0].clientX;
    const offset = touchCurrentX.current - touchStartX.current;
    if (offset < 0) { // Only allow swipe left
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = async (placeId: string, placeName: string) => {
    if (swipeOffset < -100) {
      // Swipe threshold reached - remove item
      await handleRemove(new MouseEvent('click') as any, placeId, placeName);
    }
    setSwipingCard(null);
    setSwipeOffset(0);
  };

  const handleClick = (place: WishlistRestaurant) => {
    if (swipingCard) return; // Don't navigate if swiping
    if (place.place_id) {
      navigate(`/restaurant/${place.place_id}?name=${encodeURIComponent(place.name)}`);
    }
  };

  const getPriceDisplay = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(Math.min(level, 4));
  };

  if (loading) {
    return (
      <div className="px-4 py-6 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Your Wishlist
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[280px] h-[260px] bg-muted/50 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (savedPlaces.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-6 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            Your Wishlist
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {savedPlaces.length} {savedPlaces.length === 1 ? 'place' : 'places'} saved
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/wishlist')}
          className="text-primary hover:text-primary/80 font-medium"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Wishlist carousel */}
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin">
        {savedPlaces.map(place => {
          const isHovered = hoveredCard === place.id;
          const isSwiping = swipingCard === place.id;
          const showDelete = swipeOffset < -50;
          
          return (
            <div
              key={place.id}
              className="min-w-[280px] relative"
              onMouseEnter={() => setHoveredCard(place.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Delete background (revealed on swipe) */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-red-500 to-red-600",
                "rounded-2xl flex items-center justify-end px-6",
                "transition-opacity duration-200",
                showDelete ? "opacity-100" : "opacity-0"
              )}>
                <Trash2 className="h-6 w-6 text-white" />
              </div>

              {/* Card */}
              <Card
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300",
                  "border-border/50 rounded-2xl relative",
                  isHovered && !isSwiping && "shadow-2xl scale-[1.02]",
                  isSwiping && "transition-none"
                )}
                style={isSwiping ? { transform: `translateX(${swipeOffset}px)` } : undefined}
                onClick={() => handleClick(place)}
                onTouchStart={(e) => handleTouchStart(e, place.id)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd(place.place_id, place.name)}
              >
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
                  {place.photo_url ? (
                    <img 
                      src={place.photo_url}
                      alt={place.name}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        isHovered && "scale-110"
                      )}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Remove button (desktop) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-3 right-3 h-9 w-9 rounded-full",
                      "bg-background/80 backdrop-blur-sm hover:bg-red-500 hover:text-white",
                      "transition-all duration-300",
                      "group/remove",
                      isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
                    )}
                    onClick={(e) => handleRemove(e, place.place_id, place.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {/* Wishlist heart */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm shadow-lg">
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  {/* Restaurant name */}
                  <div>
                    <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                      {place.name}
                    </h3>
                    {(place.city || place.country) && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-sm line-clamp-1">
                          {place.city && place.country 
                            ? `${place.city}, ${place.country}` 
                            : place.city || place.country}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {place.cuisine && (
                      <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {place.cuisine}
                      </Badge>
                    )}
                    {place.price_range && (
                      <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full">
                        {getPriceDisplay(place.price_range)}
                      </Badge>
                    )}
                    {place.michelin_stars && place.michelin_stars > 0 && (
                      <MichelinStars stars={place.michelin_stars} size="sm" />
                    )}
                  </div>

                  {/* Action hint for mobile */}
                  <div className="text-xs text-muted-foreground/60 text-center pt-1 md:hidden">
                    Swipe left to remove
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

