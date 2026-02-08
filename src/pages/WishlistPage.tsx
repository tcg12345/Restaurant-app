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
                className="w-full h-10 pl-4 pr-12 rounded-full border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-muted rounded-full"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
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
                    className="h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm font-medium border border-transparent hover:border-border transition-all duration-200"
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
                    className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all duration-200"
                    title="Map View"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
                
                {/* View Toggle */}
                <div className="flex items-center bg-muted/50 rounded-lg p-1 ml-1">
                  <Button
                    onClick={() => setView('grid')}
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-9 p-0 rounded-md transition-all duration-200 ${
                      view === 'grid' 
                        ? 'bg-background shadow-sm text-foreground border border-border' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                        ? 'bg-background shadow-sm text-foreground border border-border' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      : 'border-border hover:border-primary hover:bg-primary/10'
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
                        : 'border-border hover:border-primary hover:bg-primary/10'
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
                className="w-full h-10 pl-4 pr-12 rounded-full border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-muted-foreground"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1 h-8 w-8 p-0 hover:bg-muted rounded-full"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
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
                  className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm font-medium border border-transparent hover:border-border transition-all duration-200"
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
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-transparent hover:border-border transition-all duration-200"
                  title="Map View"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              )}
              
              {/* View Toggle */}
              <div className="flex items-center bg-muted/50 rounded-lg p-1 ml-1">
                <Button
                  onClick={() => setView('grid')}
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-8 p-0 rounded-md transition-all duration-200 ${
                    view === 'grid' 
                      ? 'bg-background shadow-sm text-foreground border border-border' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      ? 'bg-background shadow-sm text-foreground border border-border' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                        : 'border-border hover:border-primary hover:bg-primary/10'
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
                          : 'border-border hover:border-primary hover:bg-primary/10'
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