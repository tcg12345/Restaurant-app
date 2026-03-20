import React, { useState } from 'react';
import { MichelinStarIcon } from '@/components/MichelinStarIcon';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PhotoGallery } from '@/components/PhotoGallery';
import { format } from 'date-fns';

interface PlaceRating {
  id: string;
  place_name: string;
  place_type: string;
  cuisine?: string;
  address?: string;
  overall_rating?: number;
  category_ratings?: any;
  date_visited?: string;
  notes?: string;
  photos?: string[];
  price_range?: number;
  michelin_stars?: number;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone_number?: string;
}

interface PlaceDetailsModalProps {
  place: PlaceRating | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: (placeId: string) => void;
}

export function PlaceDetailsModal({ place, isOpen, onClose, onEdit, onDelete }: PlaceDetailsModalProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  if (!place) return null;

  const getPriceDisplay = (priceRange?: number) => {
    if (!priceRange) return null;
    return '$'.repeat(priceRange);
  };

  const getPlaceIcon = (placeType: string) => {
    switch (placeType.toLowerCase()) {
      case 'restaurant': return '🍽️';
      case 'hotel': return '🏨';
      case 'attraction': return '🎯';
      case 'museum': return '🏛️';
      case 'park': return '🌳';
      case 'shopping': return '🛍️';
      case 'entertainment': return '🎭';
      case 'transport': return '🚌';
      case 'spa': return '💆';
      case 'bar': return '🍷';
      case 'cafe': return '☕';
      case 'beach': return '🏖️';
      case 'landmark': return '🗿';
      case 'activity': return '⚡';
      default: return '📍';
    }
  };

  const renderMichelinStars = (michelinStars?: number) => {
    if (!michelinStars || michelinStars === 0) return null;
    return (
      <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
        <span className="text-sm font-semibold text-yellow-800">Michelin Guide</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: michelinStars }, (_, i) => (
            <MichelinStarIcon key={i} className="w-5 h-5 text-secondary fill-current" />
          ))}
        </div>
      </div>
    );
  };

  const renderStarRating = (rating?: number) => {
    if (!rating || typeof rating !== 'number' || isNaN(rating)) return null;
    
    // Clamp rating between 0 and 5 to prevent invalid array lengths
    const clampedRating = Math.max(0, Math.min(5, rating));
    
    const fullStars = Math.floor(clampedRating);
    const halfStar = clampedRating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));

    return (
      <div className="flex items-center gap-1">
        {fullStars > 0 && [...Array(fullStars)].map((_, i) => (
          <MIcon name="grade" className="text-sm fill-yellow-400 text-secondary" />
        ))}
        {halfStar && <MIcon name="grade" className="text-sm fill-yellow-400/50 text-secondary" />}
        {emptyStars > 0 && [...Array(emptyStars)].map((_, i) => (
          <MIcon name="grade" key={i + fullStars + (halfStar ? 1 : 0)} className="text-sm text-outline-variant" />
        ))}
        <span className="ml-2 text-sm font-medium">{clampedRating.toFixed(1)}/5</span>
      </div>
    );
  };

  const getDirectionsUrl = () => {
    if (place.latitude && place.longitude) {
      // Use coordinates for more accurate directions
      return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    } else if (place.address) {
      // Fall back to address
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
    } else {
      // Search for the place name as last resort
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.place_name)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getPlaceIcon(place.place_type)}</span>
              <div>
                <DialogTitle className="text-xl font-bold">{place.place_name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {place.cuisine && (
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      {place.cuisine}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="capitalize">
                    {place.place_type}
                  </Badge>
                  {place.price_range && (
                    <Badge variant="outline" className="text-secondary border-green-600">
                      {getPriceDisplay(place.price_range)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <MIcon name="edit" className="text-sm mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    onClose();
                    onDelete(place.id);
                  }}
                  className="border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive hover:text-destructive"
                >
                  <MIcon name="delete" className="text-sm mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photos Section */}
          {place.photos && place.photos.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  📸 Photos ({place.photos.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {place.photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={photo}
                        alt={`${place.place_name} photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => {
                          setSelectedPhotoIndex(index);
                          setIsGalleryOpen(true);
                        }}
                        onError={(e) => {
                          console.error('Failed to load image:', photo);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Michelin Stars */}
          {renderMichelinStars(place.michelin_stars)}

          {/* Rating Section */}
          {place.overall_rating && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MIcon name="grade" className="text-base text-secondary" />
                  Overall Rating
                </h3>
                {renderStarRating(place.overall_rating)}
              </CardContent>
            </Card>
          )}

          {/* Category Ratings */}
          {place.category_ratings && Object.keys(place.category_ratings).length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Category Ratings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(place.category_ratings).map(([category, score]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <MIcon
                            name="grade"
                            key={i}
                            className={`text-xs ${
                              i < Math.floor(score as number)
                                ? 'fill-yellow-400 text-secondary'
                                : 'text-outline-variant'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {score as number}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location & Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold mb-3">Details</h3>
              
              {place.address && (
                <div className="flex items-start gap-3">
                  <MIcon name="location_on" className="text-sm text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{place.address}</span>
                </div>
              )}

              {place.date_visited && (
                <div className="flex items-center gap-3">
                  <MIcon name="calendar_month" className="text-sm text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    Visited on {format(new Date(place.date_visited), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}

              {place.price_range && (
                <div className="flex items-center gap-3">
                  <MIcon name="attach_money" className="text-sm text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">
                    Price Range: {getPriceDisplay(place.price_range)}
                  </span>
                </div>
              )}

              {place.website && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start gap-3 h-10 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-blue-700 hover:text-blue-800"
                  >
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MIcon name="language" className="text-sm" />
                      Visit Website
                    </a>
                  </Button>
                </div>
              )}

              {place.phone_number && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start gap-3 h-10 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 hover:border-orange-300 text-orange-700 hover:text-orange-800"
                  >
                    <a
                      href={`tel:${place.phone_number}`}
                    >
                      <MIcon name="phone" className="text-sm" />
                      Call {place.phone_number}
                    </a>
                  </Button>
                </div>
              )}

              {/* Directions Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start gap-3 h-10 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 hover:border-secondary/30 text-secondary hover:text-green-800"
                >
                  <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MIcon name="directions" className="text-sm" />
                    Get Directions
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {place.notes && place.notes.trim() && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Notes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {place.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Photo Gallery */}
        <PhotoGallery
          photos={place.photos || []}
          initialIndex={selectedPhotoIndex}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          restaurantName={place.place_name}
        />
      </DialogContent>
    </Dialog>
  );
}