import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
const UnifiedSearchPage = lazy(() => import('./UnifiedSearchPage'));
const DiscoverPage = lazy(() => import('./DiscoverPage').then(m => ({ default: m.DiscoverPage })));
const FriendsActivityPage = lazy(() => import('./FriendsActivityPage').then(m => ({ default: m.FriendsActivityPage })));
const ExpertSearchPage = lazy(() => import('../components/mobile/MobileExpertSearchPage').then(m => ({ default: m.MobileExpertSearchPage })));

type SearchTab = 'global' | 'smart' | 'recommendations' | 'friends' | 'experts';

export default function SearchTabsPage() {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const [activeTab, setActiveTab] = useState<SearchTab>('global');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab as SearchTab);
    } else if (window.location.pathname === '/friends-activity') {
      // If accessed via legacy route, show friends tab
      setActiveTab('friends');
    }
  }, [tab]);

  const handleTabChange = (value: string) => {
    const newTab = value as SearchTab;
    setActiveTab(newTab);
    
    // Handle routing for the friends tab specifically to maintain backwards compatibility
    if (newTab === 'friends') {
      // Check if this is accessed via the legacy /friends-activity route
      if (window.location.pathname === '/friends-activity') {
        // Don't navigate, just update state to show friends content
        return;
      }
    }
    
    navigate(`/search/${newTab}`);
  };

  return (
    <>
      {/* Mobile Version - Simplified */}
      <div className="lg:hidden w-full mobile-container py-3">
        <div className="mb-4 hidden">
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Mobile Tab Buttons */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-full p-1 backdrop-blur-sm">
              <Button
                onClick={() => handleTabChange('global')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'global'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Restaurants
              </Button>
              <Button
                onClick={() => handleTabChange('friends')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'friends'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Friends
              </Button>
              <Button
                onClick={() => handleTabChange('experts')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'experts'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Experts
              </Button>
            </div>
          </div>

{activeTab === 'global' && (
  <TabsContent value="global" className="mt-0">
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
      <UnifiedSearchPage />
    </Suspense>
  </TabsContent>
)}

{activeTab === 'friends' && (
  <TabsContent value="friends" className="mt-0">
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
      <FriendsActivityPage />
    </Suspense>
  </TabsContent>
)}

{activeTab === 'experts' && (
  <TabsContent value="experts" className="mt-0">
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading...</div>}>
      <ExpertSearchPage />
    </Suspense>
  </TabsContent>
)}
        </Tabs>
      </div>

      {/* Desktop Version - Full Tabs */}
      <div className="hidden lg:block w-full p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Search & Discover Restaurants
          </h1>
          <p className="text-muted-foreground text-lg">
            Find restaurants worldwide with multiple search methods and personalized recommendations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-slate-100/80 dark:bg-slate-800/80 rounded-full p-1 backdrop-blur-sm">
              <Button
                onClick={() => handleTabChange('global')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'global'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Restaurants
              </Button>
              <Button
                onClick={() => handleTabChange('smart')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'smart'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Discovery
              </Button>
              <Button
                onClick={() => handleTabChange('friends')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'friends'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Friends
              </Button>
              <Button
                onClick={() => handleTabChange('experts')}
                variant="ghost"
                size="sm"
                className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-200 text-sm ${
                  activeTab === 'experts'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Experts
              </Button>
            </div>
          </div>

{activeTab === 'global' && (
  <TabsContent value="global" className="space-y-6">
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading search...</div>}>
      <UnifiedSearchPage />
    </Suspense>
  </TabsContent>
)}

{activeTab === 'smart' && (
  <TabsContent value="smart" className="space-y-6">
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading discovery...</div>}>
      <DiscoverPage />
    </Suspense>
  </TabsContent>
)}

{activeTab === 'friends' && (
  <TabsContent value="friends" className="space-y-6">
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading friends...</div>}>
      <FriendsActivityPage />
    </Suspense>
  </TabsContent>
)}

{activeTab === 'experts' && (
  <TabsContent value="experts" className="space-y-6">
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading experts...</div>}>
      <ExpertSearchPage />
    </Suspense>
  </TabsContent>
)}
        </Tabs>
      </div>
    </>
  );
}