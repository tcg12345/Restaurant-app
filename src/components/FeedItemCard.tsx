import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ExpertBadge } from '@/components/ExpertBadge';
import { MichelinStars } from '@/components/MichelinStars';
import { FeedItem } from '@/types/feed';
import { formatDistanceToNow } from 'date-fns';

interface FeedItemCardProps {
  item: FeedItem;
  onRestaurantClick?: (item: FeedItem) => void;
  onUserClick?: (userId: string) => void;
}

export function FeedItemCard({ item, onRestaurantClick, onUserClick }: FeedItemCardProps) {
  const navigate = useNavigate();
  const isExpert = item.type.startsWith('expert');
  const isReview = item.type.includes('review');
  const rating = item.overall_rating || item.rating;

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const getPriceDisplay = (priceLevel?: number) => {
    if (!priceLevel) return null;
    return '$'.repeat(Math.min(priceLevel, 4));
  };

  const handleRestaurantClick = () => {
    if (onRestaurantClick) {
      onRestaurantClick(item);
    } else if (item.place_id || item.google_place_id) {
      navigate(`/restaurant/${item.place_id || item.google_place_id}?name=${encodeURIComponent(item.restaurant_name)}`);
    }
  };

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick(item.user_id);
    } else {
      navigate(`/friend-profile/${item.user_id}`);
    }
  };

  const getActivityText = () => {
    if (isReview) {
      return isExpert ? 'wrote an expert review for' : 'reviewed';
    } else {
      return isExpert ? 'rated as an expert' : 'rated';
    }
  };

  return (
    <div className="border-b border-outline-variant/10 py-6 last:border-b-0">
      {/* Header: User info */}
      <div className="flex items-start gap-4">
        <div className="flex-none relative">
          <button onClick={handleUserClick} className="block">
            <Avatar className="h-12 w-12">
              <AvatarImage src={item.avatar_url || ''} alt={item.name} className="object-cover" />
              <AvatarFallback className="bg-surface-container-high text-on-surface-variant font-headline font-bold text-sm">
                {(item.name || item.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>
          {isExpert && (
            <div className="absolute -bottom-1 -right-1 bg-primary w-5 h-5 rounded-full border-2 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
          )}
          {!isExpert && (
            <div className="absolute -bottom-1 -right-1 bg-primary w-5 h-5 rounded-full border-2 border-background flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>grade</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* User and activity */}
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-body">
              <button onClick={handleUserClick} className="font-headline font-bold text-on-surface hover:text-primary transition-colors">
                {item.name || item.username}
              </button>
              {' '}{getActivityText()}{' '}
              <button onClick={handleRestaurantClick} className="font-headline font-bold text-on-surface hover:text-primary transition-colors">
                {item.restaurant_name}
              </button>
            </p>
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter flex-shrink-0 ml-2">
              {formatTimeAgo(item.created_at).replace(' ago', '').replace('about ', '')}
            </span>
          </div>

          {/* Rating stars */}
          {rating && (
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: Math.min(Math.round(Number(rating) / 2), 5) }).map((_, i) => (
                <span key={i} className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
              {Array.from({ length: Math.max(5 - Math.round(Number(rating) / 2), 0) }).map((_, i) => (
                <span key={`empty-${i}`} className="material-symbols-outlined text-outline-variant text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              ))}
            </div>
          )}

          {/* Review text / Notes */}
          {(item.review_text || item.notes) && (
            <div className="bg-surface-container-low rounded-xl p-4 cursor-pointer hover:bg-surface-container transition-colors mb-3" onClick={handleRestaurantClick}>
              <div className="flex gap-4">
                {item.photos && item.photos.length > 0 && (
                  <img
                    src={item.photos[0]}
                    alt={item.photo_dish_names?.[0] || 'Photo'}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-2">
                    "{item.review_text || item.notes}"
                  </p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Read Full Review</p>
                </div>
              </div>
            </div>
          )}

          {/* Photos (if no review text but has photos) */}
          {!(item.review_text || item.notes) && item.photos && item.photos.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto hide-scrollbar pb-1">
              {item.photos.slice(0, 4).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={item.photo_dish_names?.[idx] || `Photo ${idx + 1}`}
                  className="h-20 w-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleRestaurantClick}
                />
              ))}
              {item.photos.length > 4 && (
                <div className="h-20 w-20 bg-surface-container rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-on-surface-variant font-headline font-bold">
                    +{item.photos.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.cuisine && (
              <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-medium">
                {item.cuisine}
              </span>
            )}
            {item.city && (
              <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-medium">
                {item.city}
              </span>
            )}
            {item.price_range && (
              <span className="text-xs bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-medium">
                {getPriceDisplay(item.price_range)}
              </span>
            )}
            {item.michelin_stars && item.michelin_stars > 0 && (
              <MichelinStars stars={item.michelin_stars} size="sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
