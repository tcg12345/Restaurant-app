import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useInstantImageCache, useOnDemandImageLoader } from '@/hooks/useInstantImageCache';
import { format } from 'date-fns';
import { MapPin, Clock, Tag, Edit2, Trash2, Eye, Bot, ExternalLink, Phone, Globe, Share2, X, Plus, ListPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StarRating } from '@/components/StarRating';
import { PriceRange } from '@/components/PriceRange';
import { MichelinStars } from '@/components/MichelinStars';
import { WeightedRating } from '@/components/WeightedRating';
import { PhotoGallery } from '@/components/PhotoGallery';
import { OpeningHoursDisplay } from '@/components/OpeningHoursDisplay';
import { AIReviewAssistant } from '@/components/AIReviewAssistant';
import { ShareRestaurantDialog } from '@/components/ShareRestaurantDialog';
import { Restaurant } from '@/types/restaurant';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { getStateFromCoordinatesCached } from '@/utils/geocoding';
import { supabase } from '@/integrations/supabase/client';

// Image URL resolution
import { resolveImageUrl, getLqipUrl } from '@/utils/imageUtils';
interface RestaurantCardProps {
  restaurant: Restaurant;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
  onRate?: (id: string) => void;
  showAIReviewAssistant?: boolean;
  showAddToList?: boolean;
  onAddToList?: (listId: string) => void;
  availableLists?: Array<{ id: string; name: string }>;
}

// Component for displaying location with geocoding
function LocationDisplay({
  restaurant
}: {
  restaurant: Restaurant;
}) {
  const [locationText, setLocationText] = useState<string>('');
  useEffect(() => {
    async function determineLocation() {
      if (restaurant.country === 'United States' && restaurant.latitude && restaurant.longitude) {
        try {
          const state = await getStateFromCoordinatesCached(restaurant.latitude, restaurant.longitude);
          setLocationText(state ? `${restaurant.city}, ${state}` : `${restaurant.city}, United States`);
        } catch (error) {
          console.error('Error getting state:', error);
          setLocationText(`${restaurant.city}, United States`);
        }
      } else {
        setLocationText(`${restaurant.city}${restaurant.country ? `, ${restaurant.country}` : ''}`);
      }
    }
    determineLocation();
  }, [restaurant.city, restaurant.country, restaurant.latitude, restaurant.longitude]);

  // Show immediate fallback while loading
  const displayText = locationText || `${restaurant.city}${restaurant.country ? `, ${restaurant.country}` : ''}`;
  return <span>{displayText}</span>;
}

// Helper function to get current day's hours
const getCurrentDayHours = (hours: string) => {
  if (!hours) return 'Hours not available';
  
  // Handle special cases
  if (hours.includes('Call for hours') || hours.includes('Hours vary')) {
    return 'Call for hours';
  }
  
  // Get current day name and index
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDayName = dayNames[currentDayIndex];
  const currentDayShort = dayNamesShort[currentDayIndex];
  
  // Split hours by lines and filter empty lines
  const lines = hours.split('\n').filter(line => line.trim());
  
  // If we have exactly 7 lines, assume it's ordered Sunday to Saturday
  if (lines.length === 7) {
    const todayHours = lines[currentDayIndex];
    if (todayHours) {
      // Extract time from the line (remove day name)
      const timeMatch = todayHours.match(/:\s*(.+)/) || todayHours.match(/\w+\s+(.+)/);
      if (timeMatch) {
        return timeMatch[1].trim() || 'Closed';
      }
      return todayHours;
    }
  }
  
  // Try to find today's line by matching day names
  const todayLine = lines.find(line => {
    const lowerLine = line.toLowerCase();
    return lowerLine.includes(currentDayName.toLowerCase()) || 
           lowerLine.includes(currentDayShort.toLowerCase()) ||
           lowerLine.startsWith(currentDayName.toLowerCase()) ||
           lowerLine.startsWith(currentDayShort.toLowerCase());
  });
  
  if (todayLine) {
    // Extract time from the line (remove day name)
    const timeMatch = todayLine.match(/:\s*(.+)/) || todayLine.match(/\w+\s+(.+)/);
    if (timeMatch) {
      const timeStr = timeMatch[1].trim();
      return timeStr || 'Closed';
    }
    return todayLine;
  }
  
  // If no specific day found, return first line or indicate hours unavailable
  return lines.length > 0 ? 'Hours available' : 'Hours not available';
};
export function RestaurantCard({
  restaurant,
  onEdit,
  onDelete,
  onClose,
  onRate,
  showAIReviewAssistant = false,
  showAddToList = false,
  onAddToList,
  availableLists = []
}: RestaurantCardProps) {
  const formatRating = (rating: number) => {
    // Check if it's a whole number
    if (rating === Math.floor(rating)) {
      return rating.toString();
    }
    
    // Check if it needs only 1 decimal by seeing if the second decimal is 0
    const twoDecimal = Math.round(rating * 100) / 100;
    const oneDecimal = Math.round(rating * 10) / 10;
    
    // If the two-decimal version rounds to the same as one-decimal, show one decimal
    if (Math.abs(twoDecimal - oneDecimal) < 0.001) {
      return oneDecimal.toFixed(1);
    }
    
    // Otherwise show 2 decimal places
    return twoDecimal.toFixed(2);
  };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAIReviewOpen, setIsAIReviewOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [prefetched, setPrefetched] = useState(false);
  const {
    loadRestaurantPhotos
  } = useRestaurants();
  const photos = restaurant.photos || [];
  const hasMultiplePhotos = photos.length > 1;

  // Only preload first photo for instant display
  useInstantImageCache(photos, 1);
  const {
    loadImage
  } = useOnDemandImageLoader();

  // Optimized loading - minimal delay for better perceived performance
  useEffect(() => {
    const initializeCard = () => {
      setIsDataReady(true);
      setImageLoading(false);
    };

    // Proactively load photos if missing
    if (photos.length === 0) {
      loadRestaurantPhotos(restaurant.id).catch(e => console.warn('Photo load failed', e));
    }

    // Initialize immediately for better performance
    initializeCard();
  }, [restaurant.id]); // Remove loadRestaurantPhotos from dependencies to prevent infinite loop
  const nextPhoto = () => {
    setImageLoading(true);
    const nextIndex = (currentPhotoIndex + 1) % photos.length;
    setCurrentPhotoIndex(nextIndex);
    // Preload next photo on demand
    loadImage(photos[nextIndex]);
  };
  const previousPhoto = () => {
    setImageLoading(true);
    const prevIndex = currentPhotoIndex === 0 ? photos.length - 1 : currentPhotoIndex - 1;
    setCurrentPhotoIndex(prevIndex);
    // Preload previous photo on demand
    loadImage(photos[prevIndex]);
  };
  const openGallery = () => {
    setIsGalleryOpen(true);
  };
  const handleOpenWebsite = () => {
    if (restaurant.website) {
      window.open(restaurant.website, '_blank');
    }
  };
  const handleCallPhone = () => {
    if (restaurant.phone_number) {
      window.open(`tel:${restaurant.phone_number}`, '_blank');
    }
  };
  const handleCardClick = () => {
    if (restaurant?.id) {
      navigate(`/restaurant/${restaurant.id}`);
    }
  };
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };
  const handlePrefetch = async () => {
    if (prefetched) return;
    setPrefetched(true);
    try {
      // Warm community stats (by name fallback)
      await supabase.functions.invoke('community-reviews', {
        body: {
          restaurant_name: restaurant.name
        }
      });
      // Warm DB for details fetch (lightweight select)
      await supabase.from('restaurants').select('id,name,address,city,country,cuisine,rating,price_range,michelin_stars,website,phone_number,opening_hours,latitude,longitude,is_wishlist,created_at,updated_at,user_id').eq('id', restaurant.id).limit(1);
    } catch (e) {
      // Silent prefetch errors
    }
  };
  // Show skeleton until all data is ready
  if (!isDataReady) {
    return <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full" />
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>;
  }
  return <>
      <PhotoGallery photos={photos} photoCaptions={restaurant.photoDishNames || []} initialIndex={currentPhotoIndex} isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} restaurantName={restaurant.name} isMobile={isMobile} />
      <Card className="overflow-hidden bg-card border-0 shadow-[0_6px_25px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 rounded-3xl flex flex-col h-full group cursor-pointer" onClick={handleCardClick}>
        {/* Hero Restaurant Image */}
        {photos.length > 0 && !restaurant.isWishlist && <div className="relative w-full h-52 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60">
            <img src={resolveImageUrl(photos[currentPhotoIndex], {
          width: 600
        })} alt={`${restaurant.name} photo ${currentPhotoIndex + 1}`} className="h-full w-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-[1.02]" onLoad={() => setImageLoading(false)} onError={() => setImageLoading(false)} loading="lazy" />
            
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-black/5" />
            
            {/* Gallery Click Area - opens gallery instead of navigating */}
            <div className="absolute inset-0 cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              openGallery();
            }} />
            
            {/* Minimal Carousel Indicators */}
            {hasMultiplePhotos && <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5">
                {photos.slice(0, 5).map((_, index) => <button key={index} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentPhotoIndex ? 'bg-white scale-125 shadow-sm' : 'bg-white/60 hover:bg-white/80'}`} onClick={e => {
            e.stopPropagation();
            setCurrentPhotoIndex(index);
            loadImage(photos[index]);
          }} />)}
                {photos.length > 5 && <span className="text-white/80 text-xs font-medium ml-1">+{photos.length - 5}</span>}
              </div>}

            {/* Subtle Navigation Arrows (edge-aligned) */}
            {hasMultiplePhotos && <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 border-0 transition-all duration-200 hover:scale-105" onClick={e => {
            e.stopPropagation();
            previousPhoto();
          }}>
                  <span className="text-white text-sm">‹</span>
                </Button>
                
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 border-0 transition-all duration-200 hover:scale-105" onClick={e => {
            e.stopPropagation();
            nextPhoto();
          }}>
                  <span className="text-white text-sm">›</span>
                </Button>
              </div>}

            {/* Edit button moved to left side */}
            {onEdit && <Button size="icon" variant="ghost" className="absolute top-3 left-3 h-7 w-7 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 border-0 transition-all duration-200 hover:scale-105" onClick={e => handleButtonClick(e, () => onEdit(restaurant.id))}>
                <Edit2 className="h-3.5 w-3.5 text-white" />
              </Button>}

            {/* Close button in top-right corner */}
            {onClose && <Button size="icon" variant="ghost" className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/20 backdrop-blur-md hover:bg-black/30 border-0 transition-all duration-200 hover:scale-105" onClick={e => handleButtonClick(e, () => onClose())}>
                <X className="h-3.5 w-3.5 text-white" />
              </Button>}
          </div>}
        
        {/* Premium Content Layout */}
        <div className="relative flex flex-col flex-1 p-3 sm:p-4 space-y-3" style={{
        backgroundColor: 'rgb(10,23,43)'
      }}>

          {/* Close button for no-photos layout */}
          {onClose && <Button size="icon" variant="ghost" className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border-0 transition-all duration-200 hover:scale-105 z-10" onClick={e => handleButtonClick(e, () => onClose())}>
              <X className="h-3.5 w-3.5 text-white" />
            </Button>}

          {/* Restaurant Name with Inline Rating */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <h3 className="text-2xl font-bold text-foreground leading-tight truncate flex-1">
                {restaurant.name}
              </h3>
              
              {/* Inline Star Rating - aligned to right */}
              {restaurant.rating !== undefined && !restaurant.isWishlist && <div className="flex items-center gap-1.5 flex-shrink-0 pr-0">
                  <div className="text-amber-400 text-lg">★</div>
                  <span className="text-lg font-bold text-foreground">
                    {formatRating(restaurant.rating)}
                  </span>
                  {restaurant.reviewCount && restaurant.reviewCount > 0 && <span className="text-sm text-muted-foreground">
                      ({restaurant.reviewCount.toLocaleString()})
                    </span>}
                </div>}
            </div>

            {/* Cuisine, Price & Michelin Row */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 text-sm">
                <span className="font-medium text-foreground">{restaurant.cuisine}</span>
                {restaurant.priceRange && <>
                    <span className="text-muted-foreground">•</span>
                     <div className="flex items-center gap-1">
                       <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                         {'$'.repeat(restaurant.priceRange)}
                       </span>
                    </div>
                  </>}
              </div>
              
              {/* Michelin Stars - aligned to right */}
              {restaurant.michelinStars && <div className="flex items-center">
                  <MichelinStars stars={restaurant.michelinStars} readonly size="sm" />
                </div>}
            </div>
          </div>

          {/* Location & Hours - Tighter Spacing */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
              <LocationDisplay restaurant={restaurant} />
            </div>

            {restaurant.openingHours && <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
                <span className="truncate">{getCurrentDayHours(restaurant.openingHours)}</span>
              </div>}
          </div>

          {/* Compact Status Tags */}
          {(restaurant.dateVisited || restaurant.isWishlist) && <div className="flex items-center gap-2 flex-wrap">
              {restaurant.dateVisited && <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{format(new Date(restaurant.dateVisited), 'MMM d')}</span>
                </div>}
              
              {restaurant.isWishlist && <div className="inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Saved
                </div>}
            </div>}

          {/* Compact Action Row */}
          <div className="flex items-center justify-end mx-0 py-0">
            <div className="flex items-center gap-1">
              {onEdit && <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-105 shadow-none" onClick={(e) => handleButtonClick(e, () => onEdit(restaurant.id))} data-testid={`button-edit-${restaurant.id}`}>
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>}
              
              {showAddToList && availableLists.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-105 shadow-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ListPlus className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end" sideOffset={8}>
                    <div className="space-y-1">
                      <div className="text-sm font-medium px-2 py-1">Add to List</div>
                      {availableLists.map((list) => (
                        <Button
                          key={list.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-sm h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToList?.(list.id);
                          }}
                        >
                          <ListPlus className="h-3 w-3 mr-2" />
                          {list.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all duration-200 hover:scale-105 shadow-none" onClick={(e) => handleButtonClick(e, () => setIsShareDialogOpen(true))}>
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              
              {onDelete && <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-105 shadow-none" onClick={(e) => handleButtonClick(e, () => onDelete(restaurant.id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>}
            </div>
          </div>
        </div>
     </Card>
     
     {/* AI Review Assistant Dialog */}
     {showAIReviewAssistant && <Dialog open={isAIReviewOpen} onOpenChange={setIsAIReviewOpen}>
         <DialogContent className="max-w-4xl">
           <DialogHeader>
             <DialogTitle>AI Review Assistant - {restaurant.name}</DialogTitle>
           </DialogHeader>
           <AIReviewAssistant restaurantName={restaurant.name} cuisine={restaurant.cuisine} rating={restaurant.rating} priceRange={restaurant.priceRange} currentReview={restaurant.notes} onReviewUpdate={review => {
          // This is just for viewing, not editing, so we'll show a message
          navigator.clipboard.writeText(review);
          // You could add a toast here to show it was copied
        }} />
         </DialogContent>
        </Dialog>}
      
      {/* Share Restaurant Dialog */}
      <ShareRestaurantDialog restaurant={restaurant} isOpen={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} />
     </>;
}