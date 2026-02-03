import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RatedRestaurantsPage } from './RatedRestaurantsPage';
import { WishlistPage } from './WishlistPage';
import { RecommendationsPage } from './RecommendationsPage';
import { CreateListDialog } from '@/components/CreateListDialog';
import { useRestaurantLists } from '@/hooks/useRestaurantLists';
import { Restaurant, RestaurantFormData } from '@/types/restaurant';

interface SavedPlacesPageProps {
  restaurants: Restaurant[];
  onAddRestaurant: (data: RestaurantFormData) => void;
  onEditRestaurant: (id: string, data: RestaurantFormData) => void;
  onDeleteRestaurant: (id: string) => void;
  shouldOpenAddDialog?: boolean;
  onAddDialogClose?: () => void;
  onNavigateToMap: () => void;
  onOpenSettings: () => void;
  onNavigateToLists?: () => void;
  activeSubTab?: 'rated' | 'wishlist' | 'recommendations';
}

export function SavedPlacesPage({
  restaurants,
  onAddRestaurant,
  onEditRestaurant,
  onDeleteRestaurant,
  shouldOpenAddDialog,
  onAddDialogClose,
  onNavigateToMap,
  onOpenSettings,
  onNavigateToLists,
  activeSubTab = 'rated'
}: SavedPlacesPageProps) {
  const [currentTab, setCurrentTab] = useState(activeSubTab);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const { createList } = useRestaurantLists();

  // Sync currentTab with activeSubTab when it changes
  useEffect(() => {
    setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  // Debug logging
  console.log('SavedPlacesPage - restaurants:', restaurants.length, 'currentTab:', currentTab, 'activeSubTab:', activeSubTab);

  const handleCreateList = async (name: string, description?: string) => {
    return await createList(name, description);
  };

  return (
    <div className="w-full min-h-screen bg-background">
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'rated' | 'wishlist' | 'recommendations')} className="w-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 px-4 py-3">
          <div className="flex justify-center">
            <div className="flex bg-muted/50 rounded-xl p-1">
              <button
                onClick={() => setCurrentTab('rated')}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'rated'
                    ? 'bg-background text-primary shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Ratings
              </button>
              <button
                onClick={() => setCurrentTab('wishlist')}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'wishlist'
                    ? 'bg-background text-primary shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Wishlist
              </button>
              <button
                onClick={() => setCurrentTab('recommendations')}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'recommendations'
                    ? 'bg-background text-primary shadow-sm border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Recs
              </button>
            </div>
          </div>
        </div>
        
        
        <TabsContent value="rated" className="mt-0">
          <RatedRestaurantsPage
            restaurants={restaurants}
            onAddRestaurant={onAddRestaurant}
            onEditRestaurant={onEditRestaurant}
            onDeleteRestaurant={onDeleteRestaurant}
            shouldOpenAddDialog={shouldOpenAddDialog}
            onAddDialogClose={onAddDialogClose}
            onNavigateToMap={onNavigateToMap}
            onOpenSettings={onOpenSettings}
          />
        </TabsContent>
        
        <TabsContent value="wishlist" className="mt-0">
          <WishlistPage
            restaurants={restaurants}
            onAddRestaurant={onAddRestaurant}
            onEditRestaurant={onEditRestaurant}
            onDeleteRestaurant={onDeleteRestaurant}
            onNavigateToMap={onNavigateToMap}
          />
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-0">
          <RecommendationsPage
            restaurants={restaurants}
            onAddRestaurant={onAddRestaurant}
          />
        </TabsContent>
      </Tabs>

      <CreateListDialog
        isOpen={isCreateListDialogOpen}
        onClose={() => setIsCreateListDialogOpen(false)}
        onCreateList={handleCreateList}
      />
    </div>
  );
}