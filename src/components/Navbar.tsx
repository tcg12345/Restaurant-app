import { Home, Search, Star, Users, User, Crown, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { GrubbyLogo } from '@/components/GrubbyLogo';
import { AppSidebar } from '@/components/AppSidebar';

type TabId = 'home' | 'places' | 'search' | 'settings' | 'profile' | 'travel' | 'friends' | 'experts';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tabsDesktop = [
    { id: 'home' as const, label: 'Home', icon: Home, shortLabel: 'Home' },
    { id: 'search' as const, label: 'Search', icon: Search, shortLabel: 'Search' },
    { id: 'places' as const, label: 'My Ratings', icon: Star, shortLabel: 'Ratings' },
    { id: 'experts' as const, label: 'Experts', icon: Crown, shortLabel: 'Experts' },
    { id: 'friends' as const, label: 'Friends', icon: Users, shortLabel: 'Friends' },
    { id: 'profile' as const, label: 'Profile', icon: User, shortLabel: 'Profile' },
  ];

  const tabsMobile = [
    { id: 'home' as const, label: 'Home', icon: Home, shortLabel: 'Home' },
    { id: 'search' as const, label: 'Search', icon: Search, shortLabel: 'Search' },
    { id: 'places' as const, label: 'Ratings', icon: Star, shortLabel: 'Ratings' },
    { id: 'experts' as const, label: 'Experts', icon: Crown, shortLabel: 'Experts' },
    { id: 'profile' as const, label: 'Profile', icon: User, shortLabel: 'Profile' },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none flex h-14 items-center px-6">
          <div className="cursor-pointer mr-8" onClick={() => onTabChange('home')}>
            <GrubbyLogo size="md" />
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1">
              {tabsDesktop.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTabChange(tab.id)}
                    className={`relative rounded-full px-4 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {user ? (
              <AppSidebar />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2 rounded-full"
              >
                <Settings className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="lg:hidden sticky top-0 z-50 w-full bg-background border-b border-border/50 pt-safe-area-top">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="cursor-pointer" onClick={() => onTabChange('home')}>
            <GrubbyLogo size="sm" />
          </div>
          <div className="flex items-center space-x-3">
            {user ? (
              <AppSidebar />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-4 h-8 text-xs"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/30">
        <div className="pb-safe-area-bottom">
          <div className="flex justify-around items-center px-2 pt-1 pb-1">
            {tabsMobile.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center min-w-0 py-1 px-2 transition-all duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`transition-all duration-200 ${
                    isActive ? 'h-6 w-6' : 'h-5 w-5'
                  }`} />
                  <span className={`mt-0.5 transition-all duration-200 ${
                    isActive ? 'text-[10px] font-semibold' : 'text-[10px] font-medium'
                  }`}>
                    {tab.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
