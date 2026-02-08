import { Button } from '@/components/ui/button';
import { MapPin, Plus, Heart, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  restaurant: {
    name: string;
    cuisine: string;
    address: string;
    distance?: number;
    rating?: number;
    priceRange?: number;
    openingHours?: string;
    isOpen?: boolean;
    photos?: string[];
    place_id?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    website?: string;
    phone?: string;
    confidenceScore?: number;
    matchFactors?: string[];
  };
  onAdd?: () => void;
  onAddToWishlist?: () => void;
}

export function RecommendationCard({ restaurant, onAdd, onAddToWishlist }: RecommendationCardProps) {
  const navigate = useNavigate();

  const getPriceDisplay = (priceRange?: number) => {
    if (!priceRange) return '';
    return '$'.repeat(priceRange);
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-muted-foreground bg-muted';
    if (score >= 80) return 'text-emerald-700 bg-emerald-500/15 border-emerald-500/30';
    if (score >= 60) return 'text-amber-700 bg-amber-500/15 border-amber-500/30';
    return 'text-muted-foreground bg-muted/50 border-border';
  };

  const handleCardClick = () => {
    const place_id = restaurant.place_id || 'unknown';
    navigate(`/recommendation/${place_id}`, { state: { restaurant } });
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="mb-3 rounded-xl border border-border/50 bg-card overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-sm active:scale-[0.99]"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header with name, confidence score, and rating */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground leading-snug mb-1 truncate">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              {restaurant.priceRange && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {getPriceDisplay(restaurant.priceRange)}
                </span>
              )}
              {restaurant.priceRange && restaurant.cuisine && (
                <span className="text-border">·</span>
              )}
              <span className="text-muted-foreground">{restaurant.cuisine}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Confidence Score */}
            {restaurant.confidenceScore != null && restaurant.confidenceScore > 0 && (
              <div className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                getConfidenceColor(restaurant.confidenceScore)
              )}>
                <Sparkles className="h-3 w-3" />
                {restaurant.confidenceScore}%
              </div>
            )}

            {/* Google Rating */}
            {restaurant.rating && (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                <span className="text-amber-700 dark:text-amber-300 font-medium text-xs">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Match Factors */}
        {restaurant.matchFactors && restaurant.matchFactors.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {restaurant.matchFactors.map((factor, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal bg-primary/5 text-primary border-0">
                {factor}
              </Badge>
            ))}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-2">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-muted-foreground text-xs line-clamp-1">
            {restaurant.address}
          </span>
        </div>

        {/* Bottom row: status and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {restaurant.isOpen !== undefined && (
              <span className={cn(
                'text-[11px] font-medium px-1.5 py-0.5 rounded-full',
                restaurant.isOpen
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-red-500 bg-red-500/10'
              )}>
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </span>
            )}
            {restaurant.distance && (
              <span className="text-[11px] text-muted-foreground">
                {restaurant.distance.toFixed(1)} mi
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={(e) => handleButtonClick(e, onAdd || (() => {}))}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-red-500/10 hover:text-red-500"
              onClick={(e) => handleButtonClick(e, onAddToWishlist || (() => {}))}
            >
              <Heart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
