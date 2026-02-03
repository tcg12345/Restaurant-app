import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BottomSheet, BottomSheetContent, BottomSheetHeader } from '@/components/ui/bottom-sheet';
import { StarRating } from '@/components/StarRating';
import { Restaurant } from '@/types/restaurant';
import { X } from 'lucide-react';

interface RatingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
  onSubmitRating: (restaurantId: string, rating: number) => void;
}

export function RatingBottomSheet({ 
  isOpen, 
  onClose, 
  restaurant, 
  onSubmitRating 
}: RatingBottomSheetProps) {
  const [rating, setRating] = useState<number>(5);
  
  if (!restaurant) return null;

  const handleSubmit = () => {
    onSubmitRating(restaurant.id, rating);
    onClose();
  };

  return (
    <BottomSheet open={isOpen} onOpenChange={onClose}>
      <BottomSheetContent className="max-h-[80vh] p-0">
        <BottomSheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Rate Restaurant</h2>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </BottomSheetHeader>
        
        <div className="px-6 pb-6 space-y-6">
          {/* Restaurant Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {restaurant.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {restaurant.cuisine} • {restaurant.city}
            </p>
          </div>
          
          {/* Rating Component */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                How would you rate this restaurant?
              </p>
              <div className="flex justify-center">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size="lg"
                  showValue={true}
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Add to My Ratings
            </Button>
          </div>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}