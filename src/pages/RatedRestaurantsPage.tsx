import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, ChevronDown, X, Sliders, MapPin, Filter, Trash2, ArrowUpDown, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantCardList } from '@/components/RestaurantCardList';
import { ViewToggle, useViewToggle } from '@/components/ViewToggle';
import { RestaurantDialog } from '@/components/Dialog/RestaurantDialog';
import { ConfirmDialog } from '@/components/Dialog/ConfirmDialog';
import { Restaurant, RestaurantFormData } from '@/types/restaurant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RatedRestaurantsFilterDialog } from '@/components/RatedRestaurantsFilterDialog';
import { resolveImageUrl } from '@/utils/imageUtils';
import { useRestaurantLists } from '@/hooks/useRestaurantLists';
import { CreateListDialog } from '@/components/CreateListDialog';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Add jiggle animation styles
const jiggleKeyframes = `
@keyframes jiggle {
  0% { transform: rotate(-1deg); }
  25% { transform: rotate(1deg); }
  50% { transform: rotate(-1deg); }
  75% { transform: rotate(1deg); }
  100% { transform: rotate(-1deg); }
}

.animate-jiggle {
  animation: jiggle 0.3s infinite ease-in-out;
}
`;

// Inject the styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = jiggleKeyframes;
  if (!document.head.querySelector('style[data-jiggle-animation]')) {
    styleElement.setAttribute('data-jiggle-animation', 'true');
    document.head.appendChild(styleElement);
  }
}

interface RatedRestaurantsPageProps {
  restaurants: Restaurant[];
  onAddRestaurant: (data: RestaurantFormData) => void;
  onEditRestaurant: (id: string, data: RestaurantFormData) => void;
  onDeleteRestaurant: (id: string) => void;
  shouldOpenAddDialog?: boolean;
  onAddDialogClose?: () => void;
  onNavigateToMap?: () => void;
  onOpenSettings?: () => void;
  onBackToLists?: () => void;
}

export function RatedRestaurantsPage({
  restaurants,
  onAddRestaurant,
  onEditRestaurant,
  onDeleteRestaurant,
  shouldOpenAddDialog = false,
  onAddDialogClose,
  onNavigateToMap,
  onOpenSettings,
}: RatedRestaurantsPageProps) {
  const navigate = useNavigate();
  
  // Debug logging
  console.log('RatedRestaurantsPage - restaurants:', restaurants.length, 'shouldOpenAddDialog:', shouldOpenAddDialog);
  const { lists, createList, deleteList, addRestaurantToList, removeRestaurantFromList, getRestaurantsInList } = useRestaurantLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [cachedLists, setCachedLists] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isListDeleteDialogOpen, setIsListDeleteDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'rating-high' | 'rating-low' | 'name-az' | 'name-za' | 'price-low'
| 'price-high' | 'michelin-high' | 'michelin-low'>('rating-high');
  const [filterCuisines, setFilterCuisines] = useState<string[]>([]);
  const [filterPrices, setFilterPrices] = useState<string[]>([]);
  const [filterMichelins, setFilterMichelins] = useState<string[]>([]);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 10]);
  const [tempRatingRange, setTempRatingRange] = useState<[number, number]>([0, 10]);
  const { view, setView } = useViewToggle('rated-restaurants-view', 'grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const photosLoadedRef = useRef(false);
  const [cachedRestaurants, setCachedRestaurants] = useState<Restaurant[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [listRestaurants, setListRestaurants] = useState<Restaurant[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listCache, setListCache] = useState<{[key: string]: Restaurant[]}>({});
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<any>(null);
  const { toast } = useToast();

  const handleDeleteClick = (listId: string) => {
    const list = lists.find(l => l.id === listId) || displayLists.find(l => l.id === listId);
    if (list) {
      setListToDelete(list);
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (listToDelete) {
      await deleteList(listToDelete.id);
      setShowDeleteDialog(false);
      setListToDelete(null);
      setIsDeleteMode(false);
      setSelectedListId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setListToDelete(null);
  };

  const handleReorderClick = () => {
    if (selectedListId) {
      // Navigate to reorder page with specific list
      navigate('/restaurant-rankings', {
        state: { listId: selectedListId }
      });
    } else {
      // Navigate to reorder page for all restaurants
      navigate('/restaurant-rankings');
    }
  };

  const refreshSelectedList = useCallback(async () => {
    if (!selectedListId) return;
    
    // Check cache first for instant loading
    if (listCache[selectedListId]) {
      setListRestaurants(listCache[selectedListId]);
      return;
    }
    
    setIsListLoading(true);
    
    try {
      const restaurants = await getRestaurantsInList(selectedListId);
      
      // Cache the results for instant future loading
      setListCache(prev => ({
        ...prev,
        [selectedListId]: restaurants
      }));
      
      setListRestaurants(restaurants);
    } catch (error) {
      console.error('Error loading list restaurants:', error);
      setListRestaurants([]);
    } finally {
      setIsListLoading(false);
    }
  }, [selectedListId, listCache, getRestaurantsInList]);

  // Function to invalidate cache when restaurants are added/removed from lists
  const invalidateListCache = useCallback((listId: string) => {
    setListCache(prev => {
      const newCache = { ...prev };
      delete newCache[listId];
      return newCache;
    });
  }, []);

  // Clear all cache to force fresh data loading with proper mapping
  const clearAllCache = useCallback(() => {
    setListCache({});
  }, []);

  // Function to add restaurant to a specific list
  const handleAddRestaurantToList = useCallback(async (restaurantId: string, targetListId: string) => {
    try {
      await addRestaurantToList(restaurantId, targetListId);
      // Invalidate cache for the target list to refresh it
      invalidateListCache(targetListId);
      // If we're currently viewing that list, refresh it
      if (selectedListId === targetListId) {
        refreshSelectedList();
      }
    } catch (error) {
      console.error('Error adding restaurant to list:', error);
    }
  }, [addRestaurantToList, invalidateListCache, selectedListId, refreshSelectedList]);

  const sourceRestaurants = restaurants.length > 0 ? restaurants : cachedRestaurants;
  const ratedRestaurants = sourceRestaurants.filter((r) => !r.isWishlist);

  // Handle opening the add dialog when triggered from HomePage
  useEffect(() => {
    if (shouldOpenAddDialog) {
      setIsAddDialogOpen(true);
      onAddDialogClose?.();
    }
  }, [shouldOpenAddDialog, onAddDialogClose]);

  // Hydrate from localStorage for instant first paint
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ratedRestaurantsCache');
      if (raw) {
        const parsed: Restaurant[] = JSON.parse(raw);
        setCachedRestaurants(parsed);
      }
    } catch (e) {
      console.warn('Failed to load ratedRestaurantsCache');
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist cache when real data arrives
  useEffect(() => {
    if (restaurants.length > 0 && ratedRestaurants.length > 0) {
      try {
        localStorage.setItem('ratedRestaurantsCache', JSON.stringify(ratedRestaurants));
      } catch (e) {
        // ignore
      }
    }
  }, [restaurants.length, ratedRestaurants.length]);

  // Hydrate lists from localStorage for instant first paint
  useEffect(() => {
    try {
      const raw = localStorage.getItem('restaurantListsCache');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCachedLists(parsed);
      }
    } catch (e) {
      console.warn('Failed to load restaurantListsCache');
    }
  }, []);

  // Persist lists cache when real data arrives
  useEffect(() => {
    if (lists.length > 0) {
      try {
        localStorage.setItem('restaurantListsCache', JSON.stringify(lists));
      } catch (e) {
        // ignore
      }
    }
  }, [lists]);

  // Use cached lists if real lists haven't loaded yet
  const displayLists = lists.length > 0 ? lists : cachedLists;

  // Clear cache on mount to ensure fresh data with proper mapping
  useEffect(() => {
    clearAllCache();
  }, [clearAllCache]);

  // Load restaurants for the selected list
  useEffect(() => {
    if (selectedListId) {
      refreshSelectedList();
    } else {
      setListRestaurants([]);
    }
  }, [selectedListId, refreshSelectedList]);

  // Preload cover photos for faster perceived load, limited to first 10 for performance
  useEffect(() => {
    if (ratedRestaurants.length > 0 && !photosLoadedRef.current) {
      photosLoadedRef.current = true;
const preloadImages = async () => {
  const coverPhotos = ratedRestaurants
    .filter(r => r.photos && r.photos.length > 0)
    .slice(0, 10)  // only preload first 10 images for performance
    .map(r => resolveImageUrl(r.photos[0], { width: 800 }))
    .filter(Boolean);
  const preloadPromises = coverPhotos.map(url => new Promise<void>((resolve) => {
    // Add prefetch hint
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = url as string;
      document.head.appendChild(link);
    } catch {}
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't block on errors
    img.src = url as string;
  }));
  // Fire-and-forget
  Promise.allSettled(preloadPromises);
};
      preloadImages();
    }
  }, [ratedRestaurants.length]);

  // Get unique cuisines
  const cuisines = Array.from(new Set(ratedRestaurants.map(r => r.cuisine).filter(cuisine => cuisine && cuisine.trim() !== '')))
;

  // Helper functions for multi-select
  const toggleCuisine = (cuisine: string) => {
    setFilterCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const togglePrice = (price: string) => {
    setFilterPrices(prev =>
      prev.includes(price)
        ? prev.filter(p => p !== price)
        : [...prev, price]
    );
  };

  const toggleMichelin = (michelin: string) => {
    setFilterMichelins(prev =>
      prev.includes(michelin)
        ? prev.filter(m => m !== michelin)
        : [...prev, michelin]
    );
  };

  const clearFilters = () => {
    setFilterCuisines([]);
    setFilterPrices([]);
    setFilterMichelins([]);
    setRatingRange([0, 10]);
    setTempRatingRange([0, 10]);
  };

  const applyRatingFilter = () => {
    setRatingRange(tempRatingRange);
  };

  // Calculate counts for each filter option based on current filters
  const getFilterCounts = () => {
    const baseFilteredRestaurants = ratedRestaurants.filter((restaurant) => {
      const matchesSearch = searchTerm === ''
        || restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
        || restaurant.city.toLowerCase().includes(searchTerm.toLowerCase())
        || restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRating = !restaurant.rating ||
        (restaurant.rating >= ratingRange[0] && restaurant.rating <= ratingRange[1]);

      return matchesSearch && matchesRating;
    });

    // Calculate counts for each cuisine
    const cuisineCounts = cuisines.map(cuisine => ({
      cuisine,
      count: baseFilteredRestaurants.filter(r =>
        r.cuisine === cuisine &&
        (filterPrices.length === 0 ||
         (r.priceRange && filterPrices.includes(r.priceRange.toString()))) &&
         (filterMichelins.length === 0 ||
          (r.michelinStars && filterMichelins.includes(r.michelinStars.toString())))
      ).length
    }));

    // Calculate counts for each price range
    const priceCounts = [
      { price: '1', count: baseFilteredRestaurants.filter(r =>
        r.priceRange === 1 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
         (filterMichelins.length === 0 ||
          (r.michelinStars && filterMichelins.includes(r.michelinStars.toString())))
      ).length },
      { price: '2', count: baseFilteredRestaurants.filter(r =>
        r.priceRange === 2 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
         (filterMichelins.length === 0 ||
          (r.michelinStars && filterMichelins.includes(r.michelinStars.toString())))
      ).length },
      { price: '3', count: baseFilteredRestaurants.filter(r =>
        r.priceRange === 3 &&
         (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
         (filterMichelins.length === 0 ||
          (r.michelinStars && filterMichelins.includes(r.michelinStars.toString())))
      ).length },
      { price: '4', count: baseFilteredRestaurants.filter(r =>
        r.priceRange === 4 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
         (filterMichelins.length === 0 ||
          (r.michelinStars && filterMichelins.includes(r.michelinStars.toString())))
      ).length },
    ];

    // Calculate counts for Michelin stars
    const michelinCounts = [
      { michelin: '1', count: baseFilteredRestaurants.filter(r =>
        r.michelinStars === 1 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
        (filterPrices.length === 0 ||
         (r.priceRange && filterPrices.includes(r.priceRange.toString())))
      ).length },
      { michelin: '2', count: baseFilteredRestaurants.filter(r =>
        r.michelinStars === 2 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
        (filterPrices.length === 0 ||
         (r.priceRange && filterPrices.includes(r.priceRange.toString())))
      ).length },
      { michelin: '3', count: baseFilteredRestaurants.filter(r =>
        r.michelinStars === 3 &&
        (filterCuisines.length === 0 || filterCuisines.includes(r.cuisine)) &&
        (filterPrices.length === 0 ||
         (r.priceRange && filterPrices.includes(r.priceRange.toString())))
      ).length },
    ];

    return { cuisineCounts, priceCounts, michelinCounts };
  };

  const { cuisineCounts, priceCounts, michelinCounts } = getFilterCounts();

  // Filter and sort restaurants
  const displayRestaurants = selectedListId ? listRestaurants : ratedRestaurants;

  const filteredRestaurants = displayRestaurants
    .filter((restaurant) => {
      // Apply search filter
      const matchesSearch = searchTerm === ''
        || restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
        || restaurant.city.toLowerCase().includes(searchTerm.toLowerCase())
        || restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply cuisine filter
      const matchesCuisine = filterCuisines.length === 0
        || filterCuisines.includes(restaurant.cuisine);

      // Apply price filter
      const matchesPrice = filterPrices.length === 0
        || (restaurant.priceRange && filterPrices.includes(restaurant.priceRange.toString()));

      // Apply Michelin star filter
      const matchesMichelin = filterMichelins.length === 0
        || (restaurant.michelinStars && filterMichelins.includes(restaurant.michelinStars.toString()));

      // Apply rating range filter
      const matchesRating = !restaurant.rating ||
        (restaurant.rating >= ratingRange[0] && restaurant.rating <= ratingRange[1]);

      return matchesSearch && matchesCuisine && matchesPrice && matchesMichelin && matchesRating;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === 'latest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortBy === 'rating-high') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'rating-low') {
        return (a.rating || 0) - (b.rating || 0);
      } else if (sortBy === 'name-az') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-za') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'price-low') {
        return (a.priceRange || 0) - (b.priceRange || 0);
      } else if (sortBy === 'price-high') {
        return (b.priceRange || 0) - (a.priceRange || 0);
      } else if (sortBy === 'michelin-high') {
        return (b.michelinStars || 0) - (a.michelinStars || 0);
      } else if (sortBy === 'michelin-low') {
        return (a.michelinStars || 0) - (b.michelinStars || 0);
      }
      return 0;
    });

  const handleOpenEditDialog = (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setIsEditDialogOpen(true);
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    // Check both main restaurants and list restaurants
    const restaurant = restaurants.find((r) => r.id === id) || listRestaurants.find((r) => r.id === id);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      
      // If we're in a custom list, show the list delete dialog
      if (selectedListId) {
        setIsListDeleteDialogOpen(true);
      } else {
        // If we're in the "All" list, show the regular delete dialog
        setIsDeleteDialogOpen(true);
      }
    }
  };

  const handleAdd = async (data: RestaurantFormData) => {
    await Promise.resolve(onAddRestaurant(data));
    if (selectedListId) {
      refreshSelectedList();
    }
  };

  const handleEdit = async (data: RestaurantFormData) => {
    if (selectedRestaurant) {
      await Promise.resolve(onEditRestaurant(selectedRestaurant.id, data));
      if (selectedListId) {
        refreshSelectedList();
      }
    }
  };

  const handleDelete = async () => {
    if (selectedRestaurant) {
      // If we're in a custom list, show the list delete dialog
      if (selectedListId) {
        setIsListDeleteDialogOpen(true);
        return;
      }
      
      // If we're in the "All" list, delete from main collection
      await Promise.resolve(onDeleteRestaurant(selectedRestaurant.id));
    }
  };

  const handleDeleteFromListOnly = async () => {
    if (selectedRestaurant && selectedListId) {
      try {
        await removeRestaurantFromList(selectedRestaurant.id, selectedListId);
        invalidateListCache(selectedListId);
        refreshSelectedList();
        toast({
          title: "Restaurant removed from list",
          description: `${selectedRestaurant.name} has been removed from the list.`,
        });
      } catch (error) {
        console.error('Error removing restaurant from list:', error);
        toast({
          title: "Error",
          description: "Failed to remove restaurant from list.",
          variant: "destructive",
        });
      }
    }
    setIsListDeleteDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteFromBoth = async () => {
    if (selectedRestaurant) {
      await Promise.resolve(onDeleteRestaurant(selectedRestaurant.id));
      if (selectedListId) {
        invalidateListCache(selectedListId);
        refreshSelectedList();
      }
    }
    setIsListDeleteDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };

  return (
    <div className="w-full py-4 px-2 sm:px-4 lg:px-6">
      {/* Streamlined Modern Header */}
      <div className="mb-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search restaurants, cuisines, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800/30 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
              >
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </Button>
            </div>

            {/* Actions and Lists Row */}
            <div className="flex items-center justify-between">
              {/* Secondary Actions - Left Side */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReorderClick}
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Reorder
                </Button>
                <Button
                  onClick={() => setIsCreateListDialogOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List
                </Button>
                {onNavigateToMap && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToMap}
                    className="h-10 w-10 p-0 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                    title="Map View"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
                
                {/* View Toggle */}
                <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 ml-1">
                  <Button
                    onClick={() => setView('grid')}
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-9 p-0 rounded-md transition-all duration-200 ${
                      view === 'grid' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                    title="Grid View"
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setView('list')}
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-9 p-0 rounded-md transition-all duration-200 ${
                      view === 'list' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                    title="List View"
                  >
                    <div className="w-4 h-4 flex flex-col gap-0.5 justify-center">
                      <div className="w-full h-0.5 bg-current rounded-full"></div>
                      <div className="w-full h-0.5 bg-current rounded-full"></div>
                      <div className="w-full h-0.5 bg-current rounded-full"></div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Primary Action - Right Side */}
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="h-9 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </div>

            {/* Lists Tabs - Integrated */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                <Button
                  variant={selectedListId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedListId(null)}
                  className={`rounded-full px-4 py-1.5 font-medium transition-all duration-200 text-sm flex-shrink-0 ${
                    selectedListId === null 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  All Restaurants
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs px-1.5 py-0.5">
                    {ratedRestaurants.length}
                  </Badge>
                </Button>
                
                {displayLists.map((list) => (
                  <Button
                    key={list.id}
                    variant={selectedListId === list.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isDeleteMode && !list.is_default) {
                        setListToDelete(list);
                        setShowDeleteDialog(true);
                      } else if (!isDeleteMode) {
                        setSelectedListId(list.id);
                      }
                    }}
                    className={`rounded-full px-4 py-1.5 font-medium transition-all duration-200 text-sm flex-shrink-0 ${
                      selectedListId === list.id 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    } ${
                      isDeleteMode && !list.is_default ? 'animate-jiggle border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    {list.name}
                    {isDeleteMode && !list.is_default && (
                      <X className="h-3 w-3 ml-1 text-red-500" />
                    )}
                  </Button>
                ))}
              </div>
              
              {/* Edit Lists Button - Small and Subtle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDeleteMode(!isDeleteMode);
                  if (isDeleteMode) {
                    setSelectedListId(null);
                  }
                }}
                className={`ml-3 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 ${
                  isDeleteMode 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                data-testid="delete-mode-toggle"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isDeleteMode ? 'Done' : 'Edit'}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Header */}
        <div className="lg:hidden">
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search restaurants, cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800/30 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(true)}
                className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
              >
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </Button>
            </div>

            {/* Primary Action */}
            <div className="">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </div>

            {/* Secondary Actions Row */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button
                onClick={handleReorderClick}
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Reorder
              </Button>
              <Button
                onClick={() => setIsCreateListDialogOpen(true)}
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                List
              </Button>
              {onNavigateToMap && (
                <Button
                  onClick={onNavigateToMap}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                  title="Map View"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
              
              {/* View Toggle */}
              <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 ml-1">
                <Button
                  onClick={() => setView('grid')}
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-8 p-0 rounded-md transition-all duration-200 ${
                    view === 'grid' 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="Grid View"
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  onClick={() => setView('list')}
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-8 p-0 rounded-md transition-all duration-200 ${
                    view === 'list' 
                      ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                  title="List View"
                >
                  <div className="w-4 h-4 flex flex-col gap-0.5 justify-center">
                    <div className="w-full h-0.5 bg-current rounded-full"></div>
                    <div className="w-full h-0.5 bg-current rounded-full"></div>
                    <div className="w-full h-0.5 bg-current rounded-full"></div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Lists Tabs - Mobile */}
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-2 items-center scrollbar-hide">
                <Button
                  variant={selectedListId === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedListId(null)}
                  className={`rounded-full px-3 py-1.5 font-medium transition-all duration-200 text-xs flex-shrink-0 ${
                    selectedListId === null 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  All Restaurants
                  <Badge variant="secondary" className="ml-1.5 bg-white/20 text-white text-xs px-1 py-0.5">
                    {ratedRestaurants.length}
                  </Badge>
                </Button>
                
                {displayLists.map((list) => (
                  <Button
                    key={list.id}
                    variant={selectedListId === list.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isDeleteMode && !list.is_default) {
                        setListToDelete(list);
                        setShowDeleteDialog(true);
                      } else if (!isDeleteMode) {
                        setSelectedListId(list.id);
                      }
                    }}
                    className={`rounded-full px-3 py-1.5 font-medium transition-all duration-200 text-xs flex-shrink-0 ${
                      selectedListId === list.id 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    } ${
                      isDeleteMode && !list.is_default ? 'animate-jiggle border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    {list.name}
                    {isDeleteMode && !list.is_default && (
                      <X className="h-3 w-3 ml-1 text-red-500" />
                    )}
                  </Button>
                ))}
                
                {/* Edit Lists Button - Red Trash Icon */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsDeleteMode(!isDeleteMode);
                    if (isDeleteMode) {
                      setSelectedListId(null);
                    }
                  }}
                  className={`h-8 w-8 p-0 rounded-full transition-all duration-200 flex-shrink-0 ${
                    isDeleteMode 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  data-testid="delete-mode-toggle"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Enhanced Desktop Filters */}
      <div className="mb-8 hidden lg:block">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Filters & Sorting
            </h3>
            {(filterCuisines.length > 0 || filterPrices.length > 0 || filterMichelins.length > 0 || ratingRange[0] > 0 || ratingRange[1] < 10) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters} 
                className="rounded-xl bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cuisine Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cuisine Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 font-medium">
                    <span className="text-left truncate">
                      {filterCuisines.length === 0
                        ? 'Any Cuisine'
                        : filterCuisines.length === 1
                          ? filterCuisines[0]
                          : `${filterCuisines.length} Selected`
                      }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0">
                  <div className="p-4">
                    <div className="space-y-3">
                      {cuisineCounts.map(({ cuisine, count }) => (
                        <div key={cuisine} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <Checkbox
                            id={`cuisine-${cuisine}`}
                            checked={filterCuisines.includes(cuisine)}
                            onCheckedChange={() => toggleCuisine(cuisine)}
                          />
                          <label htmlFor={`cuisine-${cuisine}`} className="text-sm font-medium cursor-pointer flex-1">
                            {cuisine}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Price Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 font-medium">
                    <span className="text-left truncate">
                      {filterPrices.length === 0
                        ? 'Any Price'
                        : filterPrices.length === 1
                          ? filterPrices[0] === '1' ? '$' : filterPrices[0] === '2' ? '$$' : filterPrices[0] === '3' ? '$$$' : '$$$$'
                          : `${filterPrices.length} Selected`
                      }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <div className="p-4">
                    <div className="space-y-3">
                      {priceCounts.map(({ price, count }) => (
                        <div key={price} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <Checkbox
                            id={`price-${price}`}
                            checked={filterPrices.includes(price)}
                            onCheckedChange={() => togglePrice(price)}
                          />
                          <label htmlFor={`price-${price}`} className="text-sm font-medium cursor-pointer flex-1">
                            {price === '1' ? '$' : price === '2' ? '$$' : price === '3' ? '$$$' : '$$$$'}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Michelin Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Michelin Stars</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 font-medium">
                    <span className="text-left truncate">
                      {filterMichelins.length === 0
                        ? 'Any Rating'
                        : filterMichelins.length === 1
                          ? `${filterMichelins[0]} Star${filterMichelins[0] === '1' ? '' : 's'}`
                          : `${filterMichelins.length} Selected`
                      }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0">
                  <div className="p-4">
                    <div className="space-y-3">
                      {michelinCounts.map(({ michelin, count }) => (
                        <div key={michelin} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <Checkbox
                            id={`michelin-${michelin}`}
                            checked={filterMichelins.includes(michelin)}
                            onCheckedChange={() => toggleMichelin(michelin)}
                          />
                          <label htmlFor={`michelin-${michelin}`} className="text-sm font-medium cursor-pointer flex-1">
                            {`${michelin} Michelin Star${michelin === '1' ? '' : 's'}`}
                          </label>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Sort & Advanced Options */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sort & More</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 font-medium">
                    <span className="text-left truncate">
                      {sortBy === 'latest' ? 'Latest First' :
                       sortBy === 'oldest' ? 'Oldest First' :
                       sortBy === 'rating-high' ? 'Highest Rated' :
                       sortBy === 'rating-low' ? 'Lowest Rated' :
                       sortBy === 'name-az' ? 'Name A-Z' :
                       sortBy === 'name-za' ? 'Name Z-A' :
                       sortBy === 'price-low' ? 'Price Low-High' :
                       sortBy === 'price-high' ? 'Price High-Low' :
                       sortBy === 'michelin-high' ? 'Most Stars' :
                       'Least Stars'}
                    </span>
                    <Sliders className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Sort Options */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Sort Options</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: 'latest', label: 'Latest' },
                            { key: 'oldest', label: 'Oldest' },
                            { key: 'rating-high', label: 'Rating ↓' },
                            { key: 'rating-low', label: 'Rating ↑' },
                            { key: 'name-az', label: 'Name A-Z' },
                            { key: 'name-za', label: 'Name Z-A' },
                            { key: 'price-low', label: 'Price ↑' },
                            { key: 'price-high', label: 'Price ↓' },
                            { key: 'michelin-high', label: 'Stars ↓' },
                            { key: 'michelin-low', label: 'Stars ↑' }
                          ].map(({ key, label }) => (
                            <Button
                              key={key}
                              variant={sortBy === key ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSortBy(key as any)}
                              className="justify-start rounded-lg font-medium"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Rating Range Filter */}
                      <div>
                        <Label className="text-base font-semibold mb-3 block">Rating Range</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                            <span>{tempRatingRange[0]}</span>
                            <span>{tempRatingRange[1]}</span>
                          </div>
                          <Slider
                            value={tempRatingRange}
                            onValueChange={(value) => setTempRatingRange(value as [number, number])}
                            max={10}
                            min={0}
                            step={0.1}
                            className="w-full"
                          />
                          <Button 
                            onClick={applyRatingFilter} 
                            size="sm" 
                            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700"
                          >
                            Apply Rating Filter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {selectedListId && isListLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading list...</div>
      ) : selectedListId && displayRestaurants.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">No restaurants in this list</h3>
          <p className="mb-4 text-muted-foreground">This list is empty. Add some restaurants to get started!</p>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
            <Button variant="outline" onClick={handleReorderClick}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Reorder
            </Button>
          </div>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">
            {displayRestaurants.length === 0 ? 'No rated restaurants yet' : 'No restaurants found'}
          </h3>
          <p className="mb-4 text-muted-foreground">
            {displayRestaurants.length === 0
              ? "Start adding restaurants you've visited!"
              : 'No restaurants match your search criteria.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {displayRestaurants.length === 0 ? 'Add Your First Restaurant' : 'Add Restaurant'}
            </Button>
            {displayRestaurants.length > 0 && (
              <Button variant="outline" onClick={handleReorderClick}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Reorder
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full' : 'space-y-4 w-full'}>
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="relative w-full">
              {view === 'grid' ? (
                <RestaurantCard
                  restaurant={restaurant}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                  showAIReviewAssistant={true}
                  showAddToList={!selectedListId}
                  onAddToList={(listId) => handleAddRestaurantToList(restaurant.id, listId)}
                  availableLists={lists.filter(list => !list.is_default)}
                />
              ) : (
                <RestaurantCardList
                  restaurant={restaurant}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleOpenDeleteDialog}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <RestaurantDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAdd}
        dialogType="add"
        defaultSelectedListId={selectedListId || undefined}
      />

      <RestaurantDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        restaurant={selectedRestaurant}
        onSave={handleEdit}
        dialogType="edit"
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Restaurant"
        description="Are you sure you want to delete this restaurant? This action cannot be undone."
        confirmText="Delete"
      />

      {/* List Delete Confirmation Dialog */}
      <AlertDialog open={isListDeleteDialogOpen} onOpenChange={setIsListDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md shadow-2xl border border-border bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Restaurant from List</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to remove "{selectedRestaurant?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleDeleteFromListOnly}
              className="w-full justify-start h-12"
            >
              <ListPlus className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Remove from list only</span>
                <span className="text-xs text-muted-foreground">Keeps in your main collection</span>
              </div>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteFromBoth}
              className="w-full justify-start h-12"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Delete completely</span>
                <span className="text-xs text-muted-foreground">Removes from all lists</span>
              </div>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mobile Filter Dialog */}
      <RatedRestaurantsFilterDialog
        open={showMobileFilters}
        onOpenChange={setShowMobileFilters}
        filterCuisines={filterCuisines}
        filterPrices={filterPrices}
        filterMichelins={filterMichelins}
        ratingRange={ratingRange}
        sortBy={sortBy}
        cuisineCounts={cuisineCounts}
        priceCounts={priceCounts}
        michelinCounts={michelinCounts}
        onCuisineToggle={toggleCuisine}
        onPriceToggle={togglePrice}
        onMichelinToggle={toggleMichelin}
        onRatingRangeChange={setRatingRange}
        onSortByChange={setSortBy}
        onClearFilters={clearFilters}
      />

      <CreateListDialog
        isOpen={isCreateListDialogOpen}
        onClose={() => setIsCreateListDialogOpen(false)}
        onCreateList={createList}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? 
              This action cannot be undone and will remove the list and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


