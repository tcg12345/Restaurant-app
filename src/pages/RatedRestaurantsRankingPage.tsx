import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trophy, Target, Search, X, MapPin } from 'lucide-react';
import { RatedRestaurantCard } from '@/components/RatedRestaurantCard';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Restaurant, RestaurantFormData } from '@/types/restaurant';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantLists } from '@/hooks/useRestaurantLists';
import { RestaurantDialog } from '@/components/Dialog/RestaurantDialog';
import { RatingAdjustmentPopup } from '@/components/RatingAdjustmentPopup';

function sortByRankThenRating(list: Restaurant[]) {
  // never mutate the input
  return [...list]
    .filter(r => !r.isWishlist && r.rating && r.rating > 0)
    .sort((a, b) => {
      const aRank = a.customRank;
      const bRank = b.customRank;
      if (aRank != null && bRank != null) return aRank - bRank;
      if (aRank != null) return -1;
      if (bRank != null) return 1;
      return (b.rating || 0) - (a.rating || 0); // highest rating first
    });
}

export default function RatedRestaurantsRankingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurants, updateRestaurant } = useRestaurants();
  const { lists } = useRestaurantLists();

  // Get newly added restaurant ID and list ID from navigation state
  const newlyAddedRestaurantId = location.state?.newlyAddedRestaurantId;
  const listId = location.state?.listId;
  
  // State for list-specific restaurants
  const [listRestaurants, setListRestaurants] = useState<Restaurant[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listCache, setListCache] = useState<{[key: string]: Restaurant[]}>({});
  
  // Get current list info for display
  const currentList = listId ? lists.find(l => l.id === listId) : null;

  // A *local* ordered list we can optimistically update
  const [rankedRestaurants, setRankedRestaurants] = useState<Restaurant[]>([]);
  // Track original state for cancel functionality
  const [originalRestaurants, setOriginalRestaurants] = useState<Restaurant[]>([]);
  const [originalRating, setOriginalRating] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [reorderChanges, setReorderChanges] = useState<{[key: string]: {oldIndex: number, newIndex: number, restaurant: Restaurant}}>({})
  // While we're pushing ranks to the server/context, don't let remote refresh overwrite the local order
  const isSyncingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const restaurantRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  
  // Rating adjustment popup state
  const [isRatingPopupOpen, setIsRatingPopupOpen] = useState(false);
  const [ratingAdjustments, setRatingAdjustments] = useState<any[]>([]);
  
  // Configure drag sensors for smoother, more responsive dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1, // Minimal distance for immediate response
        delay: 0, // No delay for immediate response
        tolerance: 2, // Minimal tolerance for precise control
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleLocateRestaurant = () => {
    if (!searchQuery.trim()) {
      setSearchMessage('Please enter a restaurant name, cuisine, or city to locate');
      setTimeout(() => setSearchMessage(''), 3000);
      return;
    }
    
    // Find restaurant that matches the search query
    const matchedRestaurant = rankedRestaurants.find(restaurant => 
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (matchedRestaurant) {
      // Clear any previous messages
      setSearchMessage('');
      
      // Scroll to the matched restaurant
      const element = restaurantRefs.current[matchedRestaurant.id];
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the restaurant temporarily
        setHighlightedId(matchedRestaurant.id);
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      }
    } else {
      // Restaurant not found
      setSearchMessage(`"${searchQuery}" not found in your restaurant list`);
      setHighlightedId(null);
      
      // Clear message after 4 seconds
      setTimeout(() => {
        setSearchMessage('');
      }, 4000);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setHighlightedId(null);
    setSearchMessage('');
  };

  // Load list-specific restaurants if listId is provided
  useEffect(() => {
    if (listId) {
      setIsListLoading(true);
      loadListRestaurants();
    }
  }, [listId]);

  const loadListRestaurants = async () => {
    if (!listId) return;
    
    // Check cache first for instant loading
    if (listCache[listId]) {
      setListRestaurants(listCache[listId]);
      setIsListLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('restaurant_list_items')
        .select(`
          restaurants (*)
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      
      const listRests = (data || [])
        .map(item => (item as any).restaurants)
        .filter(Boolean);
      
      // Cache the results for instant future loading
      setListCache(prev => ({
        ...prev,
        [listId]: listRests
      }));
      
      setListRestaurants(listRests);
    } catch (error) {
      console.error('Error loading list restaurants:', error);
      setListRestaurants([]);
    } finally {
      setIsListLoading(false);
    }
  };

  // Compute the canonical "remote" order for when we want to refresh local state
  const remoteOrdered = useMemo(() => {
    const sourceRestaurants = listId ? listRestaurants : restaurants;
    return sortByRankThenRating(sourceRestaurants);
  }, [restaurants, listRestaurants, listId]);

  // Initialize/refresh local order and store original state
  useEffect(() => {
    if (isSyncingRef.current || isDraggingRef.current) return;

    const localIds = rankedRestaurants.map(r => r.id);
    const remoteIds = remoteOrdered.map(r => r.id);
    
    // Only replace if different to avoid unnecessary rerenders
    if (JSON.stringify(localIds) !== JSON.stringify(remoteIds)) {
      setRankedRestaurants(remoteOrdered);
      setOriginalRestaurants(remoteOrdered);
      
      // Store original rating of newly added restaurant
      if (newlyAddedRestaurantId) {
        const newlyAdded = remoteOrdered.find(r => r.id === newlyAddedRestaurantId);
        if (newlyAdded) {
          setOriginalRating(newlyAdded.rating || null);
        }
      }
      setHasChanges(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteOrdered, newlyAddedRestaurantId]); // intentionally not depending on rankedRestaurants

  const persistCustomRanks = async (ordered: Restaurant[]) => {
    // Persist only rows whose rank actually changed
    const updates = ordered.map((r, idx) => {
      const nextRank = idx + 1;
      return r.customRank === nextRank ? null : { restaurant: r, customRank: nextRank };
    }).filter(Boolean) as { restaurant: Restaurant; customRank: number }[];

    if (updates.length === 0) return;

    // Mark syncing so incoming context updates won't clobber our local order
    isSyncingRef.current = true;
    try {
      await Promise.all(
        updates.map(({ restaurant, customRank }) => {
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
            photoDishNames: restaurant.photoDishNames?.slice(0, 50) || [], // Limit to prevent massive arrays
            photoNotes: restaurant.photoNotes?.slice(0, 50) || [], // Limit to prevent massive arrays
            notes: restaurant.notes,
            dateVisited: restaurant.dateVisited,
            isWishlist: restaurant.isWishlist,
            customRank: customRank,
            phone_number: restaurant.phone_number,
          };
          return updateRestaurant(restaurant.id, updatedData, true); // suppress toast notifications
        })
      );
      // when context pushes fresh data, our effect will reconcile (because isSyncingRef is about to be false)
    } finally {
      isSyncingRef.current = false;
    }
  };

  const handleDragStart = (evt: DragStartEvent) => {
    // If we have a newly added restaurant ID, only allow dragging that specific restaurant
    // Otherwise, allow dragging any restaurant (for general reorder functionality)
    if (newlyAddedRestaurantId && evt.active.id !== newlyAddedRestaurantId) {
      return;
    }
    
    setActiveId(evt.active.id as string);
    isDraggingRef.current = true;
    
    // Add smooth transition for better visual feedback
    const element = document.querySelector(`[data-id="${evt.active.id}"]`);
    if (element) {
      (element as HTMLElement).style.transition = 'none';
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    isDraggingRef.current = false;

    // Restore smooth transitions after drag
    const element = document.querySelector(`[data-id="${active.id}"]`);
    if (element) {
      (element as HTMLElement).style.transition = 'transform 100ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }

    if (!over || active.id === over.id) return;

    const oldIndex = rankedRestaurants.findIndex(r => r.id === active.id);
    const newIndex = rankedRestaurants.findIndex(r => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const draggedRestaurant = rankedRestaurants[oldIndex];
    
    // Track this change for rating adjustment calculation
    const changeKey = active.id as string;
    setReorderChanges(prev => ({
      ...prev,
      [changeKey]: {
        oldIndex,
        newIndex,
        restaurant: draggedRestaurant
      }
    }));

    // Update local state with smooth animation
    const next = arrayMove(rankedRestaurants, oldIndex, newIndex);
    setRankedRestaurants(next);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!hasChanges) return;

    // Calculate rating adjustments
    const adjustments = calculateRatingAdjustments();
    
    if (adjustments.length === 0) {
      // No adjustments needed, just save the order
      handleSaveOrderOnly();
    } else {
      // Show rating adjustment popup
      setRatingAdjustments(adjustments);
      setIsRatingPopupOpen(true);
    }
  };

  const calculateRatingAdjustments = () => {
    const newAdjustments: any[] = [];

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

    return newAdjustments;
  };

  const handleSaveOrderOnly = async () => {
    try {
      // Update custom ranks for all restaurants in the new order
      await Promise.all(
        rankedRestaurants.map(async (restaurant: Restaurant, index: number) => {
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
      console.error('Error saving restaurant order:', error);
    }
  };

  const handleCancel = () => {
    // Discard changes and navigate back to places
    navigate('/places');
  };
  
  const handleEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSave = async (data: RestaurantFormData) => {
    if (!editingRestaurant) return;
    
    try {
      await updateRestaurant(editingRestaurant.id, data, false);
      setIsEditDialogOpen(false);
      setEditingRestaurant(null);
      // Force refresh of the local state
      window.location.reload();
    } catch (error) {
      console.error('Error updating restaurant:', error);
    }
  };

  const handleRatingPopupSave = async (adjustments: any[]) => {
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-1 h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">
                {currentList ? `Reorder "${currentList.name}"` : 'Your Restaurant Rankings'}
              </h1>
            </div>
          </div>
          
          {/* Search Bar */}
          {rankedRestaurants.length > 0 && (
            <div className="relative max-w-lg mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search restaurants by name, cuisine, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLocateRestaurant();
                      }
                    }}
                    className="pl-10 pr-10 h-10 bg-background/50 backdrop-blur-sm border-border/30 focus:border-primary/50 transition-colors"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSearch}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Button
                  onClick={handleLocateRestaurant}
                  size="sm"
                  className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Locate
                </Button>
              </div>
              {searchMessage && (
                <div className={`text-xs mt-2 px-1 py-1 rounded ${
                  searchMessage.includes('not found') 
                    ? 'text-destructive bg-destructive/10' 
                    : 'text-muted-foreground'
                }`}>
                  {searchMessage}
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">
                  {newlyAddedRestaurantId ? 'Drag to Reorder Your New Restaurant' : 'Drag to Reorder'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {newlyAddedRestaurantId 
                    ? 'You can now reorder your newly rated restaurant. The highlighted restaurant can be moved to your preferred position.'
                    : currentList 
                      ? `Drag and drop to reorder restaurants in "${currentList.name}" based on your preference.`
                      : 'Your restaurants are initially sorted by rating. Drag and drop to reorder them based on your personal preference.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rankings List */}
        {rankedRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Rated Restaurants Yet</h2>
            <p className="text-muted-foreground mb-4">
              Start rating restaurants to see your personal rankings here.
            </p>
            <Button onClick={() => navigate('/places')}>Rate Your First Restaurant</Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rankedRestaurants.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {rankedRestaurants.map((restaurant, index) => (
                  <div
                    key={restaurant.id}
                    ref={(el) => {
                      restaurantRefs.current[restaurant.id] = el;
                    }}
                    className={`transition-all duration-500 ${
                      highlightedId === restaurant.id 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                        : ''
                    }`}
                  >
                    <RatedRestaurantCard
                      restaurant={restaurant}
                      rank={index + 1}
                      isNewlyAdded={restaurant.id === newlyAddedRestaurantId}
                      isDraggable={!newlyAddedRestaurantId || restaurant.id === newlyAddedRestaurantId}
                      onEdit={handleEdit}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay
              adjustScale={false}
              style={{
                transformOrigin: '0 0',
              }}
            >
              {activeId ? (
                <div className="transform scale-105 opacity-95 shadow-2xl">
                  <RatedRestaurantCard
                    restaurant={rankedRestaurants.find(r => r.id === activeId)!}
                    rank={rankedRestaurants.findIndex(r => r.id === activeId) + 1}
                    isNewlyAdded={activeId === newlyAddedRestaurantId}
                    isDraggable={false}
                    onEdit={handleEdit}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Universal Save/Cancel buttons */}
        {rankedRestaurants.length > 0 && (
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </div>
        )}

      </div>
      
      {/* Edit Restaurant Dialog */}
      <RestaurantDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        restaurant={editingRestaurant || undefined}
        onSave={handleEditSave}
        dialogType="edit"
      />

      {/* Rating Adjustment Popup */}
      <RatingAdjustmentPopup
        isOpen={isRatingPopupOpen}
        onClose={() => setIsRatingPopupOpen(false)}
        adjustments={ratingAdjustments}
        onSave={handleRatingPopupSave}
      />
    </div>
  );
}