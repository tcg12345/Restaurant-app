import { useState } from 'react';
import { Plus, Heart, RotateCcw, MapPin, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantCard } from '@/components/RestaurantCard';
import { RestaurantCardList } from '@/components/RestaurantCardList';
import { ViewToggle, useViewToggle } from '@/components/ViewToggle';
import { RestaurantDialog } from '@/components/Dialog/RestaurantDialog';
import { ConfirmDialog } from '@/components/Dialog/ConfirmDialog';
import { Restaurant, RestaurantFormData } from '@/types/restaurant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface WishlistPageProps {
  restaurants: Restaurant[];
  onAddRestaurant: (data: RestaurantFormData) => void;
  onEditRestaurant: (id: string, data: RestaurantFormData) => void;
  onDeleteRestaurant: (id: string) => void;
  onRefresh?: () => void;
  onNavigateToMap?: () => void;
}

export function WishlistPage({
  restaurants,
  onAddRestaurant,
  onEditRestaurant,
  onDeleteRestaurant,
  onRefresh,
  onNavigateToMap,
}: WishlistPageProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCity, setActiveCity] = useState<string>('all');
  const { view, setView } = useViewToggle('wishlist-view', 'grid');

  const wishlistRestaurants = restaurants.filter((r) => r.isWishlist);
  
  // Get unique cities and sort alphabetically
  const cities = Array.from(new Set(wishlistRestaurants.map(r => r.city).filter(city => city && city.trim() !== ''))).sort();

  // Filter restaurants
  const filteredRestaurants = wishlistRestaurants
    .filter((restaurant) => {
      // Apply search filter
      const matchesSearch = searchTerm === '' 
        || restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
        || restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply city filter
      const matchesCity = activeCity === 'all' || restaurant.city === activeCity;

      return matchesSearch && matchesCity;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenEditDialog = (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setIsEditDialogOpen(true);
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleEdit = (data: RestaurantFormData) => {
    if (selectedRestaurant) {
      onEditRestaurant(selectedRestaurant.id, data);
    }
  };

  const handleDelete = () => {
    if (selectedRestaurant) {
      onDeleteRestaurant(selectedRestaurant.id);
    }
  };

  const handleAddRestaurant = (data: RestaurantFormData) => {
    onAddRestaurant({
      ...data,
      isWishlist: true,
    });
  };

  return (
    <div className="w-full max-w-none py-6 mobile-container">
      {/* Streamlined Modern Header */}
      <div className="mb-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="space-y-4 px-4 lg:px-6">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800/30 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
              >
                <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </Button>
            </div>

            {/* Actions and Cities Row */}
            <div className="flex items-center justify-between">
              {/* Secondary Actions - Left Side */}
              <div className="flex items-center gap-2">
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                )}
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

            {/* Cities Tabs - Integrated */}
            {cities.length > 0 && (
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                <Button
                  variant={activeCity === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCity('all')}
                  className={`rounded-full px-4 py-1.5 font-medium transition-all duration-200 text-sm flex-shrink-0 ${
                    activeCity === 'all' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  All Cities
                </Button>
                
                {cities.map((city) => (
                  <Button
                    key={city}
                    variant={activeCity === city ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCity(city)}
                    className={`rounded-full px-4 py-1.5 font-medium transition-all duration-200 text-sm flex-shrink-0 ${
                      activeCity === city 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                  >
                    {city}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile & Tablet Header */}
        <div className="lg:hidden">
          <div className="space-y-3 px-4">
            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Search wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800/30 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              <Button
                variant="ghost"
                size="sm"
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
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
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

            {/* Cities Tabs - Mobile */}
            {cities.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={activeCity === 'all' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCity('all')}
                    className={`rounded-full px-3 py-1.5 font-medium transition-all duration-200 text-xs flex-shrink-0 ${
                      activeCity === 'all' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    All Cities
                  </Button>
                  
                  {cities.map((city) => (
                    <Button
                      key={city}
                      variant={activeCity === city ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCity(city)}
                      className={`rounded-full px-3 py-1.5 font-medium transition-all duration-200 text-xs flex-shrink-0 ${
                        activeCity === city 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">

      {cities.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <h3 className="mb-2 text-lg font-medium">Your wishlist is empty</h3>
          <p className="mb-4 text-muted-foreground">
            Add restaurants you want to visit in the future.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Wishlist Item
          </Button>
        </div>
      ) : (
        <div>
          {filteredRestaurants.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
              <h3 className="mb-2 text-lg font-medium">No restaurants found</h3>
              <p className="mb-4 text-muted-foreground">
                {searchTerm
                  ? "No restaurants match your search criteria."
                  : "No restaurants in this city yet."}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Restaurant
              </Button>
            </div>
          ) : (
            <div className={view === 'grid' ? "grid gap-3 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="relative">
                  {view === 'grid' ? (
                    <RestaurantCard
                      restaurant={restaurant}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleOpenDeleteDialog}
                    />
                  ) : (
                    <RestaurantCardList
                      restaurant={restaurant}
                      onEdit={handleOpenEditDialog}
                      onDelete={handleOpenDeleteDialog}
                    />
                  )}
                  {view === 'grid' && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-3 right-3 h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handleOpenDeleteDialog(restaurant.id)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <RestaurantDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleAddRestaurant}
        dialogType="add"
        defaultWishlist={true}
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
        title="Remove from Wishlist"
        description="Are you sure you want to remove this restaurant from your wishlist?"
        confirmText="Remove"
      />
      </div>
    </div>
  );
}