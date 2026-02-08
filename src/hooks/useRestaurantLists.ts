import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Restaurant } from '@/types/restaurant';

export type RestaurantList = Database['public']['Tables']['restaurant_lists']['Row'] & {
  restaurant_count?: number;
  restaurant_list_items?: any[];
};

// Database restaurant type
type DbRestaurant = Database['public']['Tables']['restaurants']['Row'];

// Map database restaurant to Restaurant type
const mapDbRestaurantToRestaurant = (dbRestaurant: DbRestaurant): Restaurant => ({
  id: dbRestaurant.id,
  name: dbRestaurant.name,
  address: dbRestaurant.address,
  city: dbRestaurant.city,
  country: dbRestaurant.country,
  cuisine: dbRestaurant.cuisine,
  rating: dbRestaurant.rating,
  notes: dbRestaurant.notes,
  dateVisited: dbRestaurant.date_visited,
  isWishlist: dbRestaurant.is_wishlist,
  latitude: dbRestaurant.latitude,
  longitude: dbRestaurant.longitude,
  categoryRatings: dbRestaurant.category_ratings,
  useWeightedRating: dbRestaurant.use_weighted_rating,
  priceRange: dbRestaurant.price_range ?? undefined,
  michelinStars: dbRestaurant.michelin_stars ?? undefined,
  createdAt: dbRestaurant.created_at,
  updatedAt: dbRestaurant.updated_at,
  userId: dbRestaurant.user_id,
  openingHours: dbRestaurant.opening_hours,
  website: dbRestaurant.website,
  phoneNumber: dbRestaurant.phone_number,
  reservable: dbRestaurant.reservable,
  reservationUrl: dbRestaurant.reservation_url,
  photoDishNames: dbRestaurant.photo_dish_names,
  photoNotes: dbRestaurant.photo_notes,
  googlePlaceId: dbRestaurant.google_place_id,
  photos: [], // Initialize with empty array, load photos lazily when needed
  photoCaptions: [],
});

export type RestaurantListItem = Database['public']['Tables']['restaurant_list_items']['Row'];

export function useRestaurantLists() {
  const [lists, setLists] = useState<RestaurantList[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLists = async () => {
    try {
      setLoading(true);
      
      // Get basic lists
      const { data: listsData, error: listsError } = await supabase
        .from('restaurant_lists')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      if (listsError) throw listsError;

      // Get counts for each list
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count } = await supabase
            .from('restaurant_list_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);
          
          return {
            ...list,
            restaurant_count: count || 0
          };
        })
      );

      setLists(listsWithCounts as RestaurantList[]);
    } catch {
      // Table may not exist yet — silently fail with empty lists
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const createList = async (name: string, description?: string) => {
    try {
      // We need to get the current user to set user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('restaurant_lists')
        .insert([{ 
          name, 
          description: description || null,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'List Created',
        description: `"${name}" has been created successfully`,
      });

      await fetchLists();
      return data;
    } catch (error: any) {
      void('Error creating list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create list',
      });
      throw error;
    }
  };

  const updateList = async (listId: string, updates: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('restaurant_lists')
        .update(updates)
        .eq('id', listId);

      if (error) throw error;

      toast({
        title: 'List Updated',
        description: 'List has been updated successfully',
      });

      await fetchLists();
    } catch (error: any) {
      void('Error updating list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update list',
      });
      throw error;
    }
  };

  const deleteList = async (listId: string) => {
    try {
      // First check if this is the default list
      const list = lists.find(l => l.id === listId);
      if (list?.is_default) {
        toast({
          variant: 'destructive',
          title: 'Cannot Delete',
          description: 'The default "All Restaurants" list cannot be deleted',
        });
        return;
      }

      const { error } = await supabase
        .from('restaurant_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      toast({
        title: 'List Deleted',
        description: 'List has been deleted successfully',
      });

      await fetchLists();
    } catch (error: any) {
      void('Error deleting list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete list',
      });
      throw error;
    }
  };

  const addRestaurantToList = async (restaurantId: string, listId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_list_items')
        .insert([{ restaurant_id: restaurantId, list_id: listId }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            variant: 'destructive',
            title: 'Already Added',
            description: 'This restaurant is already in the list',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Added to List',
        description: 'Restaurant has been added to the list',
      });

      await fetchLists();
    } catch (error: any) {
      void('Error adding restaurant to list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add restaurant to list',
      });
      throw error;
    }
  };

  const removeRestaurantFromList = async (restaurantId: string, listId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_list_items')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('list_id', listId);

      if (error) throw error;

      toast({
        title: 'Removed from List',
        description: 'Restaurant has been removed from the list',
      });

      await fetchLists();
    } catch (error: any) {
      void('Error removing restaurant from list:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove restaurant from list',
      });
      throw error;
    }
  };

  const getRestaurantsInList = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('restaurant_list_items')
        .select(`
          restaurant_id,
          restaurants!inner(*)
        `)
        .eq('list_id', listId)
        .order('added_at', { ascending: false });

      if (error) throw error;
      
      const restaurants = data?.map(item => mapDbRestaurantToRestaurant((item as any).restaurants)).filter(Boolean) || [];
      return restaurants;
    } catch (error: any) {
      void('Error fetching restaurants in list:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return {
    lists,
    loading,
    createList,
    updateList,
    deleteList,
    addRestaurantToList,
    removeRestaurantFromList,
    getRestaurantsInList,
    fetchLists,
  };
}