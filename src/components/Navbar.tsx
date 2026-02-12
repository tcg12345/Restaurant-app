import { Home, Search, BarChart3, Crown, Heart, User, Settings } from 'lucide-react';
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

const desktopTabs = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'search' as const, label: 'Search', icon: Search },
  { id: 'places' as const, label: 'My Ratings', icon: BarChart3 },
  { id: 'experts' as const, label: 'Experts', icon: Crown },
  { id: 'friends' as const, label: 'Friends', icon: User },
  { id: 'profile' as const, label: 'Profile', icon: User },
];

const mobileTabs = [
  { id: 'home' as const, label: 'Home', icon: Home },
  { id: 'search' as const, label: 'Search', icon: Search },
  { id: 'places' as const, label: 'My Ratings', icon: BarChart3 },
  { id: 'experts' as const, label: 'Experts', icon: Crown },
  { id: 'profile' as const, label: 'Profile', icon: User },
];

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* ─── Desktop: Top Bar with clean navigation ─── */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full border-b border-border/30 bg-background/95 backdrop-blur-xl">
        <div className="w-full flex h-14 items-center px-6">
          {/* Logo */}
          <div className="cursor-pointer mr-8 flex-shrink-0" onClick={() => onTabChange('home')}>
            <GrubbyLogo size="md" />
          </div>

          {/* Desktop Nav Links - Left aligned */}
          <div className="flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {user ? (
              <AppSidebar />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-5 h-9 text-sm font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile: Minimal top bar ─── */}
      <nav className="lg:hidden sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border/20 pt-safe-area-top">
        <div className="flex h-11 items-center justify-between px-4">
          <div className="cursor-pointer" onClick={() => onTabChange('home')}>
            <GrubbyLogo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <AppSidebar />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-4 h-8 text-xs font-semibold"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile: Premium Bottom Navigation ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/20">
        <div className="pb-safe-area-bottom">
          <div className="flex justify-around items-center h-14 px-1">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-primary/10' : ''
                  }`}>
                    <Icon className={`h-[22px] w-[22px] transition-all duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  </div>
                  <span className={`text-[10px] mt-0.5 transition-all duration-200 ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`}>
                    {tab.label}
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
