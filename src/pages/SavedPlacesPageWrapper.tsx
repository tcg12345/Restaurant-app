import { useNavigate } from 'react-router-dom';
import { useRestaurants } from '@/contexts/RestaurantContext';
import { SavedPlacesPage } from './SavedPlacesPage';
import { RestaurantFormData } from '@/types/restaurant';

interface SavedPlacesPageWrapperProps {
  shouldOpenAddDialog?: boolean;
  onAddDialogClose?: () => void;
  activeSubTab?: 'rated' | 'wishlist' | 'recommendations';
}

export default function SavedPlacesPageWrapper({ 
  shouldOpenAddDialog, 
  onAddDialogClose,
  activeSubTab = 'rated'
}: SavedPlacesPageWrapperProps) {
  const navigate = useNavigate();
  const { restaurants, addRestaurant, updateRestaurant, deleteRestaurant, isLoading } = useRestaurants();

  // Debug logging
  console.log('SavedPlacesPageWrapper - restaurants:', restaurants.length, 'isLoading:', isLoading);
  console.log('SavedPlacesPageWrapper - activeSubTab:', activeSubTab);
  console.log('SavedPlacesPageWrapper - shouldOpenAddDialog:', shouldOpenAddDialog);

  const handleAddRestaurant = async (data: RestaurantFormData) => {
    const restaurantId = await addRestaurant(data);
    // If it's a rated restaurant (not wishlist), navigate to rankings page
    if (!data.isWishlist && data.rating && data.rating > 0) {
      navigate('/restaurant-rankings', { 
        state: { newlyAddedRestaurantId: restaurantId } 
      });
    }
  };

  // Show loading state while restaurants are being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/20"></div>
          <p className="mt-4 text-muted-foreground">Loading your restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <SavedPlacesPage
      restaurants={restaurants}
      onAddRestaurant={handleAddRestaurant}
      onEditRestaurant={updateRestaurant}
      onDeleteRestaurant={deleteRestaurant}
      shouldOpenAddDialog={shouldOpenAddDialog}
      onAddDialogClose={onAddDialogClose}
      onNavigateToMap={() => navigate('/map')}
      onOpenSettings={() => navigate('/settings')}
      onNavigateToLists={() => navigate('/restaurant-lists')}
      activeSubTab={activeSubTab}
    />
  );
}