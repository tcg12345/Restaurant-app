import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MichelinStars } from '@/components/MichelinStars';
import { cn } from '@/lib/utils';

interface EnhancedRestaurantCardProps {
  id?: string;
  placeId?: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  cuisine?: string;
  rating?: number;
  priceRange?: number;
  michelinStars?: number;
  imageUrl?: string;
  isFavorite?: boolean;
  className?: string;
  onFavoriteToggle?: () => void;
  onCardClick?: () => void;
  showActions?: boolean;
}

export function EnhancedRestaurantCard({
  id,
  placeId,
  name,
  address,
  city,
  country,
  cuisine,
  rating,
  priceRange,
  michelinStars,
  imageUrl,
  isFavorite = false,
  className,
  onFavoriteToggle,
  onCardClick,
  showActions = true
}: EnhancedRestaurantCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    } else if (placeId) {
      navigate(`/restaurant/${placeId}?name=${encodeURIComponent(name)}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.();
  };

  const getPriceDisplay = (level?: number) => {
    if (!level) return null;
    return Array.from({ length: Math.min(level, 4) }).map((_, i) => (
      <MIcon key={i} name="attach_money" className="text-xs" />
    ));
  };

  const locationText = city && country ? `${city}, ${country}` : address || 'Location unknown';

  return (
    <Card 
      className={cn(
        "group overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]",
        "border-border/50 rounded-2xl",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl}
              alt={name}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                "group-hover:scale-110",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted/50" />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <MIcon name="location_on" className="text-5xl text-muted-foreground/30" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent",
          "transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-70"
        )} />

        {/* Favorite button */}
        {showActions && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full",
              "bg-background/80 backdrop-blur-sm hover:bg-background/90",
              "transition-all duration-300",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
            onClick={handleFavoriteClick}
          >
            <MIcon
              name="favorite"
              className={cn(
                "text-sm transition-all",
                isFavorite ? "text-destructive" : "text-foreground"
              )}
              filled={isFavorite}
            />
          </Button>
        )}

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm shadow-lg">
            <MIcon name="grade" className="text-sm text-secondary" filled />
            <span className="text-sm font-bold">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Michelin stars */}
        {michelinStars && michelinStars > 0 && (
          <div className="absolute bottom-3 left-3">
            <MichelinStars stars={michelinStars} size="sm" />
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Restaurant name */}
        <div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
            <MIcon name="location_on" className="text-sm flex-shrink-0" />
            <span className="text-sm line-clamp-1">{locationText}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {cuisine && (
            <Badge 
              variant="secondary" 
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            >
              {cuisine}
            </Badge>
          )}
          {priceRange && (
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-0.5"
            >
              {getPriceDisplay(priceRange)}
            </Badge>
          )}
        </div>

        {/* Action button */}
        {showActions && (
          <Button 
            className={cn(
              "w-full rounded-xl font-medium transition-all duration-300",
              "group-hover:shadow-lg group-hover:scale-[1.02]"
            )}
            size="sm"
          >
            View Details
            <MIcon name="open_in_new" className="text-sm ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

