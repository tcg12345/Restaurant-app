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
    <div className="p-6 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container h-20 rounded-xl" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Segmented Control - Stitch Style */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl px-6 py-4">
        <div className="flex p-1 bg-surface-container rounded-xl">
          <button
            onClick={() => handleTabChange('global')}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'global'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Global
          </button>
          <button
            onClick={() => handleTabChange('friends')}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'friends'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            Social Circle
          </button>
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
