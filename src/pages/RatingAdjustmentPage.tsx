import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { Restaurant } from '@/types/restaurant';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RatingAdjustment {
  restaurant: Restaurant;
  currentRating: number;
  requiredMinRating: number;
  requiredMaxRating: number;
  newPosition: number;
  oldPosition: number;
  adjustedRating?: number;
}

export default function RatingAdjustmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateRestaurant } = useRestaurants();
  
  const { rankedRestaurants, originalRestaurants, reorderChanges, listId } = location.state || {};
  const [adjustments, setAdjustments] = useState<RatingAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!rankedRestaurants || !reorderChanges) {
      navigate('/places');
      return;
    }

    calculateRatingAdjustments();
  }, [rankedRestaurants, reorderChanges]);

  const calculateRatingAdjustments = () => {
    const newAdjustments: RatingAdjustment[] = [];

    Object.keys(reorderChanges).forEach(restaurantId => {
      const change = reorderChanges[restaurantId];
      const { oldIndex, newIndex, restaurant } = change;
      
      if (oldIndex === newIndex) return; // No change needed
      
      const currentPosition = newIndex + 1;
      const oldPosition = oldIndex + 1;
      
      // Get surrounding restaurants in the new list
      const prevRestaurant = rankedRestaurants[newIndex - 1];
      const nextRestaurant = rankedRestaurants[newIndex + 1];
      
      let requiredMinRating = 0;
      let requiredMaxRating = 10;
      
      // Calculate required rating range based on neighbors
      if (prevRestaurant && nextRestaurant) {
        // Between two restaurants
        requiredMinRating = Math.round((nextRestaurant.rating || 0) * 10 + 1) / 10; // Slightly higher than next
        requiredMaxRating = Math.round((prevRestaurant.rating || 0) * 10 - 1) / 10; // Slightly lower than prev
      } else if (prevRestaurant && !nextRestaurant) {
        // Moved to last position
        requiredMaxRating = Math.round((prevRestaurant.rating || 0) * 10 - 1) / 10;
        requiredMinRating = 1; // Minimum possible rating
      } else if (!prevRestaurant && nextRestaurant) {
        // Moved to first position
        requiredMinRating = Math.round((nextRestaurant.rating || 0) * 10 + 1) / 10;
        requiredMaxRating = 10; // Maximum possible rating
      }
      
      // Ensure valid range
      if (requiredMaxRating <= requiredMinRating) {
        requiredMaxRating = requiredMinRating + 0.1;
      }
      
      newAdjustments.push({
        restaurant,
        currentRating: restaurant.rating || 0,
        requiredMinRating,
        requiredMaxRating,
        newPosition: currentPosition,
        oldPosition,
        adjustedRating: restaurant.rating || 0
      });
    });

    setAdjustments(newAdjustments);
  };

  const handleRatingChange = (adjustmentIndex: number, newRating: string) => {
    const rating = parseFloat(newRating);
    
    setAdjustments(prev => 
      prev.map((adj, idx) => 
        idx === adjustmentIndex 
          ? { ...adj, adjustedRating: rating }
          : adj
      )
    );
    
    // Clear error for this field
    const adjustment = adjustments[adjustmentIndex];
    if (adjustment && errors[adjustment.restaurant.id]) {
      setErrors(prev => ({
        ...prev,
        [adjustment.restaurant.id]: ''
      }));
    }
  };

  const validateAdjustments = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;

    adjustments.forEach(adj => {
      const rating = adj.adjustedRating || 0;
      
      if (rating < adj.requiredMinRating || rating > adj.requiredMaxRating) {
        newErrors[adj.restaurant.id] = `Rating must be between ${adj.requiredMinRating.toFixed(1)} and ${adj.requiredMaxRating.toFixed(1)}`;
        isValid = false;
      } else if (rating < 1 || rating > 10) {
        newErrors[adj.restaurant.id] = 'Rating must be between 1.0 and 10.0';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSaveAdjustments = async () => {
    if (!validateAdjustments()) return;

    setIsLoading(true);
    try {
      // Update all adjusted restaurants
      await Promise.all(
        adjustments.map(async (adj) => {
          const updatedData = {
            name: adj.restaurant.name,
            address: adj.restaurant.address,
            city: adj.restaurant.city,
            country: adj.restaurant.country,
            cuisine: adj.restaurant.cuisine,
            rating: adj.adjustedRating || adj.currentRating,
            categoryRatings: adj.restaurant.categoryRatings,
            useWeightedRating: adj.restaurant.useWeightedRating,
            priceRange: adj.restaurant.priceRange,
            michelinStars: adj.restaurant.michelinStars,
            photos: [], // Empty since we're not updating photos
            photoDishNames: adj.restaurant.photoDishNames?.slice(0, 50) || [],
            photoNotes: adj.restaurant.photoNotes?.slice(0, 50) || [],
            notes: adj.restaurant.notes,
            dateVisited: adj.restaurant.dateVisited,
            isWishlist: adj.restaurant.isWishlist,
            customRank: adj.newPosition,
            phone_number: adj.restaurant.phone_number,
          };
          
          return updateRestaurant(adj.restaurant.id, updatedData, false);
        })
      );

      // Update custom ranks for all restaurants in the new order
      await Promise.all(
        rankedRestaurants.map(async (restaurant: Restaurant, index: number) => {
          // Skip if this restaurant was already updated above
          const wasAdjusted = adjustments.some(adj => adj.restaurant.id === restaurant.id);
          if (wasAdjusted) return;

          const updatedData = {
            name: restaurant.name,
            address: restaurant.address,
            city: restaurant.city,
            country: restaurant.country,
            cuisine: restaurant.cuisine,
            rating: restaurant.rating,
            categoryRatings: restaurant.categoryRatings,
            useWeightedRating: restaurant.useWeightedRating,
            priceRange: restaurant.priceRange,
            michelinStars: restaurant.michelinStars,
            photos: [], // Empty since we're not updating photos
            photoDishNames: restaurant.photoDishNames?.slice(0, 50) || [],
            photoNotes: restaurant.photoNotes?.slice(0, 50) || [],
            notes: restaurant.notes,
            dateVisited: restaurant.dateVisited,
            isWishlist: restaurant.isWishlist,
            customRank: index + 1,
            phone_number: restaurant.phone_number,
          };
          
          return updateRestaurant(restaurant.id, updatedData, true); // suppress toast
        })
      );

      navigate('/places');
    } catch (error) {
      console.error('Error saving rating adjustments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!adjustments.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/places')} 
                className="p-2 h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">All Set!</h1>
                  <p className="text-muted-foreground mt-1">No rating adjustments needed</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Perfect!</h2>
            <p className="text-muted-foreground mb-6 text-lg">
              Your restaurant order has been updated without requiring any rating adjustments.
            </p>
            <Button 
              onClick={() => navigate('/places')}
              className="px-8 h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>View Your Rankings</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)} 
              className="p-2 h-10 w-10 rounded-full hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Adjust Ratings</h1>
                <p className="text-muted-foreground mt-1">Fine-tune your ratings to match your new rankings</p>
              </div>
            </div>
          </div>

          {/* Modern Info Banner */}
          <div className="bg-gradient-to-r from-primary/5 via-primary/8 to-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg mt-0.5">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  You've reordered some restaurants
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Adjust their ratings to match their new positions in your rankings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Rating Adjustments */}
        <div className="space-y-4">
          {adjustments.map((adjustment, index) => (
            <div key={adjustment.restaurant.id} className="group">
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/70 transition-all duration-200 hover:shadow-lg hover:border-border/70">
                {/* Restaurant Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{adjustment.restaurant.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {adjustment.restaurant.cuisine}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{adjustment.restaurant.city}</span>
                      </div>
                    </div>
                    
                    {/* Position Changes */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">From</span>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg">
                          #{adjustment.oldPosition}
                        </span>
                      </div>
                      <div className="w-8 h-px bg-border"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">To</span>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg">
                          #{adjustment.newPosition}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Rating Display */}
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Current Rating</div>
                    <div className="text-2xl font-bold text-primary">{adjustment.currentRating.toFixed(1)}</div>
                  </div>
                </div>

                {/* Rating Guidance */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Recommended Range for Position #{adjustment.newPosition}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {adjustment.requiredMinRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {adjustment.requiredMaxRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Rating Input */}
                <div className="space-y-2">
                  <Label htmlFor={`rating-${adjustment.restaurant.id}`} className="text-sm font-medium">
                    New Rating
                  </Label>
                  <div className="relative">
                    <Input
                      id={`rating-${adjustment.restaurant.id}`}
                      type="number"
                      min="1"
                      max="10"
                      step="0.1"
                      value={adjustment.adjustedRating?.toString() || adjustment.currentRating.toString()}
                      onChange={(e) => handleRatingChange(index, e.target.value)}
                      className={`h-12 text-lg font-medium transition-all duration-200 ${
                        errors[adjustment.restaurant.id] 
                          ? 'border-destructive bg-destructive/5 focus:border-destructive focus:ring-destructive/20' 
                          : 'border-border/50 focus:border-primary focus:ring-primary/20'
                      }`}
                      placeholder="Enter new rating (1.0 - 10.0)"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      /10
                    </div>
                  </div>
                  {errors[adjustment.restaurant.id] && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors[adjustment.restaurant.id]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modern Action Buttons */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)} 
            disabled={isLoading}
            className="px-8 h-12 rounded-xl border-border/50 hover:bg-muted/50 transition-all duration-200"
          >
            Go Back
          </Button>
          <Button 
            onClick={handleSaveAdjustments} 
            disabled={isLoading}
            className="px-8 h-12 rounded-xl bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Save All Changes</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}