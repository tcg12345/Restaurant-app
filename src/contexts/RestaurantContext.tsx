import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Restaurant, RestaurantFormData, CategoryRating } from '@/types/restaurant';
import { toast } from 'sonner';
import { restaurantStorage, generateId, filesToDataUrls } from '@/utils/localStorage';
import { useAuth } from './AuthContext';

interface RestaurantContextType {
  restaurants: Restaurant[];
  addRestaurant: (data: RestaurantFormData) => Promise<string>;
  updateRestaurant: (id: string, data: RestaurantFormData, suppressToast?: boolean) => Promise<void>;
  deleteRestaurant: (id: string) => void;
  getRestaurant: (id: string) => Restaurant | undefined;
  loadRestaurantPhotos: (id: string) => Promise<void>;
  loadAllRestaurantPhotos: () => Promise<void>;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

interface RestaurantProviderProps {
  children: ReactNode;
}

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const { user, isDemo } = useAuth();

  // Load restaurants from localStorage
  useEffect(() => {
    if (!user) {
      setRestaurants([]);
      return;
    }

    setIsLoading(true);
    try {
      const storedRestaurants = restaurantStorage.getAll();
      // Filter by user ID (in demo mode, show all restaurants)
      const userRestaurants = storedRestaurants.filter(
        (r: Restaurant) => r.userId === user.id || isDemo
      );
      setRestaurants(userRestaurants);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemo]);

  const addRestaurant = useCallback(async (data: RestaurantFormData): Promise<string> => {
    if (!user) {
      throw new Error('Authentication required to add restaurants');
    }

    // Check for duplicates
    const existingRestaurant = restaurants.find(restaurant => {
      const nameMatch = restaurant.name.toLowerCase() === data.name.toLowerCase();
      const addressMatch = restaurant.address === data.address;
      return nameMatch && addressMatch;
    });

    if (existingRestaurant) {
      throw new Error(`Restaurant "${data.name}" already exists. Please edit the existing entry instead.`);
    }

    try {
      setIsLoading(true);

      // Convert photos to data URLs
      let photoUrls: string[] = [];
      if (data.photos.length > 0) {
        toast.info('Processing photos...');
        photoUrls = await filesToDataUrls(data.photos, 640, 0.6, (processed, total) => {
          console.log(`Processing photos: ${processed}/${total}`);
        });
      }

      const now = new Date().toISOString();
      const newRestaurant: Restaurant = {
        id: generateId(),
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        cuisine: data.cuisine,
        rating: data.rating,
        notes: data.notes,
        dateVisited: data.dateVisited,
        photos: photoUrls,
        photoDishNames: data.photoDishNames || [],
        photoNotes: data.photoNotes || [],
        isWishlist: data.isWishlist,
        categoryRatings: data.categoryRatings,
        useWeightedRating: data.useWeightedRating || false,
        priceRange: data.priceRange,
        michelinStars: data.michelinStars,
        phone_number: data.phone_number,
        createdAt: now,
        updatedAt: now,
        userId: user.id,
      };

      // Save to localStorage
      restaurantStorage.add(newRestaurant);

      // Update state
      setRestaurants(prev => [newRestaurant, ...prev]);

      toast.success('Restaurant added successfully!');
      return newRestaurant.id;
    } catch (error) {
      console.error('Error adding restaurant:', error);
      toast.error('Failed to add restaurant.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurants]);

  const updateRestaurant = useCallback(async (id: string, data: RestaurantFormData, suppressToast = false) => {
    if (!user) {
      throw new Error('Authentication required to update restaurants');
    }

    try {
      setIsLoading(true);

      const existingRestaurant = restaurants.find(r => r.id === id);
      if (!existingRestaurant) {
        throw new Error('Restaurant not found');
      }

      // Convert new photos to data URLs
      let newPhotoUrls: string[] = [];
      if (data.photos.length > 0) {
        newPhotoUrls = await filesToDataUrls(data.photos, 640, 0.6);
      }

      // Handle photo removal and combine with new photos
      let updatedPhotos = [...existingRestaurant.photos];
      let updatedDishNames = [...(existingRestaurant.photoDishNames || [])];
      let updatedNotes = [...(existingRestaurant.photoNotes || [])];

      // Remove photos marked for deletion (in reverse order)
      if (data.removedPhotoIndexes && data.removedPhotoIndexes.length > 0) {
        const sortedIndexes = [...data.removedPhotoIndexes].sort((a, b) => b - a);
        sortedIndexes.forEach(index => {
          if (index >= 0 && index < updatedPhotos.length) {
            updatedPhotos.splice(index, 1);
            updatedDishNames.splice(index, 1);
            updatedNotes.splice(index, 1);
          }
        });
      }

      // Add new photos
      const combinedPhotos = [...updatedPhotos, ...newPhotoUrls];
      const combinedDishNames = [...updatedDishNames, ...(data.photoDishNames || [])];
      const combinedNotes = [...updatedNotes, ...(data.photoNotes || [])];

      const updatedRestaurant: Restaurant = {
        ...existingRestaurant,
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        cuisine: data.cuisine,
        rating: data.rating,
        notes: data.notes,
        dateVisited: data.dateVisited,
        photos: combinedPhotos,
        photoDishNames: combinedDishNames,
        photoNotes: combinedNotes,
        isWishlist: data.isWishlist,
        categoryRatings: data.categoryRatings,
        useWeightedRating: data.useWeightedRating || false,
        priceRange: data.priceRange,
        michelinStars: data.michelinStars,
        phone_number: data.phone_number,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage
      restaurantStorage.update(id, updatedRestaurant);

      // Update state
      setRestaurants(prev => prev.map(r => r.id === id ? updatedRestaurant : r));

      if (!suppressToast) {
        toast.success('Restaurant updated successfully!');
      }
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast.error('Failed to update restaurant.');
    } finally {
      setIsLoading(false);
    }
  }, [user, restaurants]);

  const deleteRestaurant = useCallback(async (id: string) => {
    try {
      // Delete from localStorage
      restaurantStorage.delete(id);

      // Update state
      setRestaurants(prev => prev.filter(r => r.id !== id));

      toast.success('Restaurant deleted successfully!');
    } catch (error) {
      console.error('Error deleting restaurant:', error);
      toast.error('Failed to delete restaurant.');
    }
  }, []);

  const getRestaurant = useCallback((id: string) => {
    return restaurants.find(restaurant => restaurant.id === id);
  }, [restaurants]);

  // These are no-ops for localStorage since photos are already loaded
  const loadRestaurantPhotos = useCallback(async (_id: string): Promise<void> => {
    // Photos are already stored with the restaurant in localStorage
  }, []);

  const loadAllRestaurantPhotos = useCallback(async (): Promise<void> => {
    // Photos are already stored with the restaurants in localStorage
  }, []);

  const value = useMemo(
    () => ({
      restaurants,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      getRestaurant,
      loadRestaurantPhotos,
      loadAllRestaurantPhotos,
      isLoading,
    }),
    [restaurants, addRestaurant, updateRestaurant, deleteRestaurant, getRestaurant, loadRestaurantPhotos, loadAllRestaurantPhotos, isLoading]
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurants() {
  const context = useContext(RestaurantContext);

  if (context === undefined) {
    throw new Error('useRestaurants must be used within a RestaurantProvider');
  }

  return context;
}
