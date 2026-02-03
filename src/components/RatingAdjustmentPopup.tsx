import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Star, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';

interface RatingAdjustment {
  restaurant: Restaurant;
  currentRating: number;
  requiredMinRating: number;
  requiredMaxRating: number;
  newPosition: number;
  oldPosition: number;
  adjustedRating?: number;
}

interface RatingAdjustmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  adjustments: RatingAdjustment[];
  onSave: (adjustments: RatingAdjustment[]) => Promise<void>;
}

export function RatingAdjustmentPopup({ 
  isOpen, 
  onClose, 
  adjustments, 
  onSave 
}: RatingAdjustmentPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localAdjustments, setLocalAdjustments] = useState<RatingAdjustment[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && adjustments.length > 0) {
      setLocalAdjustments([...adjustments]);
      setCurrentIndex(0);
      setErrors({});
    }
  }, [isOpen, adjustments]);

  const currentAdjustment = localAdjustments[currentIndex];
  const isLast = currentIndex === localAdjustments.length - 1;
  const isFirst = currentIndex === 0;

  const handleRatingChange = (newRating: string) => {
    if (!currentAdjustment) return;
    
    const rating = parseFloat(newRating);
    
    setLocalAdjustments(prev => 
      prev.map((adj, idx) => 
        idx === currentIndex 
          ? { ...adj, adjustedRating: rating }
          : adj
      )
    );
    
    // Clear error for this field
    if (errors[currentAdjustment.restaurant.id]) {
      setErrors(prev => ({
        ...prev,
        [currentAdjustment.restaurant.id]: ''
      }));
    }
  };

  const validateCurrentRating = (): boolean => {
    if (!currentAdjustment) return false;
    
    const rating = currentAdjustment.adjustedRating || currentAdjustment.currentRating;
    
    if (rating < currentAdjustment.requiredMinRating || rating > currentAdjustment.requiredMaxRating) {
      setErrors(prev => ({
        ...prev,
        [currentAdjustment.restaurant.id]: `Rating must be between ${currentAdjustment.requiredMinRating.toFixed(1)} and ${currentAdjustment.requiredMaxRating.toFixed(1)}`
      }));
      return false;
    } else if (rating < 1 || rating > 10) {
      setErrors(prev => ({
        ...prev,
        [currentAdjustment.restaurant.id]: 'Rating must be between 1.0 and 10.0'
      }));
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentRating()) return;
    
    if (isLast) {
      handleSaveAll();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(localAdjustments);
      onClose();
    } catch (error) {
      console.error('Error saving adjustments:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      handleSaveAll();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!isOpen || !currentAdjustment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full w-full bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Adjust Rating</h2>
              <p className="text-sm text-muted-foreground">
                {currentIndex + 1} of {localAdjustments.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center p-6 space-y-6 overflow-y-auto">
          {/* Restaurant Info */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{currentAdjustment.restaurant.name}</h3>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <span className="text-sm bg-muted px-2 py-1 rounded-full">{currentAdjustment.restaurant.cuisine}</span>
              <span>•</span>
              <span className="text-sm">{currentAdjustment.restaurant.city}</span>
            </div>
          </div>

          {/* Position Change */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg">
                #{currentAdjustment.oldPosition}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-lg">
                #{currentAdjustment.newPosition}
              </span>
            </div>
          </div>

          {/* Current Rating */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Current Rating</div>
            <div className="text-3xl font-bold text-primary">{currentAdjustment.currentRating.toFixed(1)}</div>
          </div>

          {/* Rating Guidance */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Recommended for position #{currentAdjustment.newPosition}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {currentAdjustment.requiredMinRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {currentAdjustment.requiredMaxRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Rating Input */}
          <div className="space-y-3">
            <Label htmlFor="new-rating" className="text-sm font-medium">
              New Rating
            </Label>
            <div className="relative">
              <Input
                id="new-rating"
                type="number"
                min="1"
                max="10"
                step="0.1"
                value={currentAdjustment.adjustedRating?.toString() || currentAdjustment.currentRating.toString()}
                onChange={(e) => handleRatingChange(e.target.value)}
                className={`h-12 text-lg font-medium text-center transition-all duration-200 ${
                  errors[currentAdjustment.restaurant.id] 
                    ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20' 
                    : 'border-border/50 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="Enter rating"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                /10
              </div>
            </div>
            {errors[currentAdjustment.restaurant.id] && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors[currentAdjustment.restaurant.id]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-sm font-medium border-border/50 hover:bg-muted/50 transition-all duration-200"
            >
              Cancel
            </Button>
            {!isFirst && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1 h-10 rounded-xl text-sm font-medium border-border/50 hover:bg-muted/50 transition-all duration-200"
              >
                Previous
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 h-10 rounded-xl text-sm font-medium border-border/50 hover:bg-muted/50 transition-all duration-200"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              disabled={isSaving}
              className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary/90 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : isLast ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Save All</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
