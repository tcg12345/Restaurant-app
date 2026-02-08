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

  useEffect(() => {
    setCurrentTab(activeSubTab);
  }, [activeSubTab]);

  const handleCreateList = async (name: string, description?: string) => {
    return await createList(name, description);
  };

  const tabs = [
    { id: 'rated' as const, label: 'My Ratings' },
    { id: 'wishlist' as const, label: 'Wishlist' },
    { id: 'recommendations' as const, label: 'Recs' },
  ];

  return (
    <div className="w-full min-h-screen bg-background">
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'rated' | 'wishlist' | 'recommendations')} className="w-full">
        {/* Premium tab switcher */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/20 px-5 py-3">
          <div className="flex justify-center">
            <div className="inline-flex bg-muted/50 rounded-full p-1 gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    currentTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
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
