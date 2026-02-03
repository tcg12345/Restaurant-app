import { Restaurant } from '@/types/restaurant';
import { Card } from '@/components/ui/card';
import { MapPin, Calendar, Edit } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { MichelinStars } from '@/components/MichelinStars';

interface RatedRestaurantCardProps {
  restaurant: Restaurant;
  rank: number;
  isNewlyAdded?: boolean;
  isDraggable?: boolean;
  onEdit?: (restaurant: Restaurant) => void;
}

export function RatedRestaurantCard({ 
  restaurant, 
  rank, 
  isNewlyAdded = false, 
  isDraggable = true,
  onEdit
}: RatedRestaurantCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: restaurant.id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : (transition || 'transform 100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'),
    zIndex: isDragging ? 1000 : 'auto',
    touchAction: 'none', // Prevents scrolling issues on mobile
    willChange: isDragging ? 'transform' : 'auto', // Optimize for transforms
  };

  const rating = restaurant.rating || 0;

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

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100';
    return 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground';
  };

  const getCardClassName = () => {
    let baseClasses = 'p-4 border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/90 relative rounded-lg backdrop-blur-sm';
    
    if (isNewlyAdded) {
      baseClasses += ' border-primary border-2 shadow-lg bg-gradient-to-br from-primary/5 via-primary/8 to-primary/10';
    }
    
    if (isDraggable) {
      baseClasses += ' cursor-grab active:cursor-grabbing select-none';
      
      if (!isDragging) {
        baseClasses += ' transition-all duration-150 ease-out hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 hover:-translate-y-0.5 hover:bg-gradient-to-br hover:from-card hover:via-primary/8 hover:to-primary/12';
      }
    } else {
      baseClasses += ' cursor-not-allowed opacity-60';
    }
    
    if (isDragging) {
      baseClasses += ' opacity-95 shadow-2xl scale-[1.02] ring-2 ring-primary/40 bg-gradient-to-br from-primary/15 via-primary/20 to-primary/25 backdrop-blur-md';
    }
    
    return baseClasses;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      data-id={restaurant.id}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      className={getCardClassName()}
    >
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold shadow-md ${getRankColor(rank)} ${
          isNewlyAdded ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}>
          {rank}
        </div>

        {/* Restaurant Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{restaurant.name}</h3>
              {isNewlyAdded && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium animate-pulse">
                  NEW
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="truncate font-medium">{restaurant.cuisine}</span>
            
            {restaurant.priceRange && (
              <>
                <span>•</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {'$'.repeat(restaurant.priceRange)}
                </span>
              </>
            )}
            
            {restaurant.michelinStars && (
              <>
                <span>•</span>
                <MichelinStars stars={restaurant.michelinStars} readonly size="sm" />
              </>
            )}
            
            <span>•</span>
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {restaurant.city}
            </span>
          </div>

          {restaurant.dateVisited && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Visited {format(new Date(restaurant.dateVisited), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Edit Button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(restaurant);
            }}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors flex-shrink-0 text-muted-foreground hover:text-foreground"
            data-testid={`button-edit-${restaurant.id}`}
          >
            <Edit className="w-4 h-4" />
          </button>
        )}

        {/* Rating Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-primary">
            {formatRating(rating)}
          </div>
          <div className="text-xs text-muted-foreground">out of 10</div>
        </div>
      </div>
    </Card>
  );
}