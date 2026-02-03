import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Search, Star, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RestaurantList, useRestaurantLists } from '@/hooks/useRestaurantLists';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ImportFromItineraryDialog } from '@/components/ImportFromItineraryDialog';
import { RestaurantDialog } from '@/components/Dialog/RestaurantDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RestaurantFormData } from '@/types/restaurant';

interface RestaurantListDetailViewProps {
  list: RestaurantList;
  onBack: () => void;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating?: number;
  address: string;
  city: string;
  country: string;
  price_range?: number;
  michelin_stars?: number;
  photos?: string[];
  date_visited?: string;
  created_at: string;
  is_wishlist: boolean;
  notes?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  phone_number?: string;
  opening_hours?: string;
  reservable?: boolean;
  reservation_url?: string;
}

export function RestaurantListDetailView({ list, onBack }: RestaurantListDetailViewProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddRestaurantDialog, setShowAddRestaurantDialog] = useState(false);
  const { addRestaurantToList } = useRestaurantLists();
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurants();
  }, [list.id]);

  const loadRestaurants = async () => {
    setLoading(true);
    setRestaurants([]);
    
    // First, test if we can connect to Supabase at all
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setLoading(false);
        setRestaurants([]);
        toast({
          variant: 'destructive',
          title: 'Network Connection Failed',
          description: 'Unable to connect to the database. Please check your internet connection and try again.',
        });
        return;
      }

      let restaurantsData: Restaurant[] = [];

      if (list.is_default) {
        // For "All" list, get all user's rated restaurants
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_wishlist', false)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to load restaurants: ${error.message}`);
        }
        restaurantsData = data || [];
      } else {
        // For custom lists, get restaurants through junction table
        const { data, error } = await supabase
          .from('restaurant_list_items')
          .select(`
            restaurants (*)
          `)
          .eq('list_id', list.id)
          .order('added_at', { ascending: false });

        if (error) {
          throw new Error(`Failed to load list restaurants: ${error.message}`);
        }

        restaurantsData = (data || [])
          .map(item => (item as any).restaurants)
          .filter(Boolean);
      }

      setRestaurants(restaurantsData);
    } catch (error: any) {
      setRestaurants([]);
      
      // Show a clear error message to the user
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('Failed to fetch');
      
      toast({
        variant: 'destructive',
        title: isNetworkError ? 'Connection Error' : 'Loading Error',
        description: isNetworkError 
          ? 'Cannot connect to the database. Please check your internet connection and refresh the page.'
          : `Could not load restaurants: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    (restaurant.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (restaurant.cuisine ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (restaurant.city ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImportRestaurants = async (newRestaurants: any[]) => {
    try {
      // First, insert the restaurants
      const { data: insertedRestaurants, error: insertError } = await supabase
        .from('restaurants')
        .insert(newRestaurants)
        .select();

      if (insertError) throw insertError;

      // Then add them to the current list (if not default)
      if (insertedRestaurants && !list.is_default) {
        const listItems = insertedRestaurants.map(restaurant => ({
          restaurant_id: restaurant.id,
          list_id: list.id
        }));

        const { error: listError } = await supabase
          .from('restaurant_list_items')
          .insert(listItems);

        if (listError) throw listError;
      }

      // Reload the restaurants
      await loadRestaurants();

      toast({
        title: 'Import Successful',
        description: `Imported ${newRestaurants.length} restaurants to ${list.name}`,
      });

    } catch (error: any) {
      console.error('Error importing restaurants:', error);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'Failed to import restaurants from itinerary',
      });
      throw error;
    }
  };

  const handleAddRestaurant = async (data: RestaurantFormData) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First, process photos to convert File[] to string[] URLs
      const photoUrls: string[] = [];
      if (data.photos && data.photos.length > 0) {
        for (const photo of data.photos) {
          try {
            // Upload photo to Supabase storage
            const fileName = `${Date.now()}-${photo.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('restaurant-photos')
              .upload(fileName, photo);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('restaurant-photos')
              .getPublicUrl(fileName);

            photoUrls.push(publicUrl);
          } catch (error) {
            console.warn('Failed to upload photo:', error);
          }
        }
      }

      // Insert the restaurant into the restaurants table
      const restaurantData = {
        name: data.name,
        cuisine: data.cuisine,
        rating: data.rating,
        address: data.address,
        city: data.city,
        country: data.country,
        price_range: data.priceRange,
        michelin_stars: data.michelinStars,
        photos: photoUrls,
        date_visited: data.dateVisited,
        is_wishlist: false, // Always false since we're adding to rated lists
        notes: data.notes,
        phone_number: data.phone_number,
        user_id: user.id,
        category_ratings: data.categoryRatings ? JSON.stringify(data.categoryRatings) : null,
        use_weighted_rating: data.useWeightedRating
      };

      const { data: insertedRestaurant, error: insertError } = await supabase
        .from('restaurants')
        .insert([restaurantData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to the current list if it's not the default list
      if (!list.is_default) {
        await addRestaurantToList(insertedRestaurant.id, list.id);
      }

      // Reload restaurants to show the new addition
      await loadRestaurants();

      toast({
        title: 'Restaurant Added',
        description: `"${data.name}" has been added to ${list.name}`,
      });

    } catch (error: any) {
      console.error('Error adding restaurant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add restaurant to list',
      });
      throw error;
    }
  };

  const averageRating = restaurants.length > 0 
    ? restaurants
        .filter(r => r.rating)
        .reduce((sum, r) => sum + (r.rating || 0), 0) / restaurants.filter(r => r.rating).length
    : 0;

  const michelinCount = restaurants.filter(r => r.michelin_stars && r.michelin_stars > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lists
        </Button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{list.name}</h1>
            {list.is_default && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Default
              </Badge>
            )}
          </div>
          
          {list.description && (
            <p className="text-muted-foreground mb-4">{list.description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>{restaurants.length} restaurants</span>
            {averageRating > 0 && (
              <span>Avg rating: {averageRating.toFixed(1)}</span>
            )}
            {michelinCount > 0 && (
              <span>{michelinCount} Michelin starred</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowAddRestaurantDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Restaurant
          </Button>
          
          {/* Import Button for non-default lists */}
          {!list.is_default && (
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Import from Itinerary
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Restaurants Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? 'No restaurants found' : 'No restaurants in this list'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : list.is_default 
                ? 'Start rating restaurants to see them here'
                : 'Add restaurants to this list or import from your itineraries'
            }
          </p>
          {!searchQuery && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowAddRestaurantDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
              {!list.is_default && (
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Import from Itinerary
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={{
                ...restaurant,
                photos: restaurant.photos || [],
                isWishlist: restaurant.is_wishlist,
                createdAt: restaurant.created_at,
                updatedAt: restaurant.created_at,
                userId: '',
                categoryRatings: { food: 0, service: 0, atmosphere: 0 },
                useWeightedRating: false
              }}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}

      {/* Add Restaurant Dialog */}
      <RestaurantDialog
        isOpen={showAddRestaurantDialog}
        onOpenChange={setShowAddRestaurantDialog}
        onSave={handleAddRestaurant}
        dialogType="add"
        defaultWishlist={false}
        hideSearch={false}
      />

      {/* Import from Itinerary Dialog */}
      <ImportFromItineraryDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportRestaurants}
        listName={list.name}
      />
    </div>
  );
}