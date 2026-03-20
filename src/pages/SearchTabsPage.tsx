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
    <div className="p-5 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-container h-20 rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Segmented Control */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl px-5 py-4 border-b border-outline-variant/10">
        <div className="flex p-1 bg-surface-container-low rounded-2xl border border-outline-variant/15">
          <button
            onClick={() => handleTabChange('global')}
            className={cn(
              'flex-1 py-2.5 text-sm font-body font-semibold rounded-xl transition-all duration-200',
              activeTab === 'global'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            Global
          </button>
          <button
            onClick={() => handleTabChange('friends')}
            className={cn(
              'flex-1 py-2.5 text-sm font-body font-semibold rounded-xl transition-all duration-200',
              activeTab === 'friends'
                ? 'bg-white shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
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
