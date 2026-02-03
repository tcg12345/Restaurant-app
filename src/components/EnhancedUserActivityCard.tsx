import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, MessageSquare, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExpertBadge } from '@/components/ExpertBadge';
import { MichelinStars } from '@/components/MichelinStars';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EnhancedUserActivityCardProps {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  isExpert?: boolean;
  activityType: 'review' | 'rating' | 'visit';
  restaurantName: string;
  restaurantAddress?: string;
  city?: string;
  country?: string;
  cuisine?: string;
  rating?: number;
  priceRange?: number;
  michelinStars?: number;
  reviewText?: string;
  photos?: string[];
  createdAt: string;
  dateVisited?: string;
  placeId?: string;
  onUserClick?: () => void;
  onRestaurantClick?: () => void;
}

export function EnhancedUserActivityCard({
  id,
  userId,
  userName,
  userAvatar,
  isExpert,
  activityType,
  restaurantName,
  restaurantAddress,
  city,
  country,
  cuisine,
  rating,
  priceRange,
  michelinStars,
  reviewText,
  photos,
  createdAt,
  dateVisited,
  placeId,
  onUserClick,
  onRestaurantClick
}: EnhancedUserActivityCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    try {
      const distance = formatDistanceToNow(new Date(dateString), { addSuffix: false });
      // Simplify: "3 days" instead of "3 days ago"
      return distance.replace(/^about /, '');
    } catch {
      return 'Recently';
    }
  };

  const getPriceDisplay = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(Math.min(level, 4));
  };

  const getActivityText = () => {
    if (activityType === 'review') {
      return isExpert ? 'wrote an expert review for' : 'reviewed';
    } else if (activityType === 'rating') {
      return isExpert ? 'rated as an expert' : 'rated';
    } else {
      return 'visited';
    }
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick();
    } else {
      navigate(`/friend-profile/${userId}`);
    }
  };

  const handleRestaurantClick = () => {
    if (onRestaurantClick) {
      onRestaurantClick();
    } else if (placeId) {
      navigate(`/restaurant/${placeId}?name=${encodeURIComponent(restaurantName)}`);
    }
  };

  const locationText = city && country ? `${city}, ${country}` : restaurantAddress;
  const hasReviewContent = reviewText && reviewText.length > 0;
  const shouldTruncate = hasReviewContent && reviewText.length > 200;

  return (
    <Card 
      className={cn(
        "border-0 border-b border-border/50 rounded-none overflow-hidden",
        "transition-all duration-300",
        isHovered && "bg-muted/30"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header: User info */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            className="p-0 h-auto hover:scale-105 transition-transform"
            onClick={handleUserClick}
          >
            <Avatar className="h-12 w-12 ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
              <AvatarImage src={userAvatar || ''} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                {(userName || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                className="p-0 h-auto font-bold text-base hover:underline hover:text-primary transition-colors"
                onClick={handleUserClick}
              >
                {userName}
              </Button>
              {isExpert && <ExpertBadge size="sm" />}
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-medium">{getActivityText()}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTimeAgo(createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Rating badge */}
          {rating && (
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              "bg-gradient-to-r from-primary/10 to-primary/5",
              "ring-2 ring-primary/20",
              "transition-all duration-300",
              isHovered && "scale-105 ring-primary/40"
            )}>
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="text-base font-bold text-primary">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Restaurant card */}
        <div 
          className={cn(
            "ml-[60px] rounded-2xl overflow-hidden cursor-pointer",
            "transition-all duration-300",
            "hover:shadow-lg hover:scale-[1.01]"
          )}
          onClick={handleRestaurantClick}
        >
          <div className="bg-gradient-to-br from-muted/50 to-muted p-4 space-y-3">
            {/* Restaurant name and location */}
            <div>
              <h3 className="font-bold text-lg leading-tight hover:text-primary transition-colors line-clamp-1">
                {restaurantName}
              </h3>
              {locationText && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground line-clamp-1">
                    {locationText}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {cuisine && (
                <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full">
                  {cuisine}
                </Badge>
              )}
              {priceRange && (
                <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full">
                  {getPriceDisplay(priceRange)}
                </Badge>
              )}
              {michelinStars && michelinStars > 0 && (
                <MichelinStars stars={michelinStars} size="sm" />
              )}
              {dateVisited && (
                <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full">
                  Visited {new Date(dateVisited).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Badge>
              )}
            </div>

            {/* View Details button */}
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full rounded-xl font-medium hover:bg-primary hover:text-primary-foreground transition-all"
            >
              View Details
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>

          {/* Review text */}
          {hasReviewContent && (
            <div className="bg-background/50 backdrop-blur-sm p-4 border-t border-border/50">
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {isExpert ? 'Expert Review' : 'Review'}
                </span>
              </div>
              
              <p className={cn(
                "text-sm leading-relaxed",
                !isExpanded && shouldTruncate && "line-clamp-3"
              )}>
                {reviewText}
              </p>
              
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-primary hover:text-primary/80 p-0 h-auto font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                  ) : (
                    <>Read Full Review <ChevronDown className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Photos */}
        {photos && photos.length > 0 && (
          <div className="ml-[60px]">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {photos.slice(0, 5).map((url, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "relative h-28 rounded-xl overflow-hidden flex-shrink-0",
                    "cursor-pointer transition-all duration-300",
                    "hover:scale-105 hover:shadow-lg",
                    idx === 0 ? "w-40" : "w-28"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open photo gallery
                  }}
                >
                  <img 
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                </div>
              ))}
              {photos.length > 5 && (
                <div className="h-28 w-28 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-muted/80 transition-colors">
                  <span className="text-sm text-muted-foreground font-bold">
                    +{photos.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

