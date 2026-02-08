import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const UnifiedSearchPage = lazy(() => import('./UnifiedSearchPage'));
const FriendsActivityPage = lazy(() => import('./FriendsActivityPage').then(m => ({ default: m.FriendsActivityPage })));

type SearchTab = 'global' | 'friends';

export default function SearchTabsPage() {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [activeTab, setActiveTab] = useState<SearchTab>('global');

  useEffect(() => {
    if (tab === 'global' || tab === 'friends') {
      setActiveTab(tab);
    } else if (window.location.pathname.includes('friends-activity')) {
      setActiveTab('friends');
    }
  }, [tab]);

  const handleTabChange = (value: SearchTab) => {
    setActiveTab(value);
    navigate(`/search/${value}`);
  };

  const LoadingFallback = () => (
    <div className="p-4 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted h-20 rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Tab Switcher */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-3">
        <div className="flex justify-center">
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => handleTabChange('global')}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'global'
                  ? 'bg-background text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Restaurants
            </button>
            <button
              onClick={() => handleTabChange('friends')}
              className={cn(
                'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'friends'
                  ? 'bg-background text-primary shadow-sm border border-border/50'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Friends & Experts
            </button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as SearchTab)}>
        {activeTab === 'global' && (
          <TabsContent value="global" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <UnifiedSearchPage />
            </Suspense>
          </TabsContent>
        )}

        {activeTab === 'friends' && (
          <TabsContent value="friends" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <FriendsActivityPage />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
