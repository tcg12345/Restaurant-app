import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';

type TabId = 'home' | 'places' | 'search' | 'settings' | 'profile' | 'travel' | 'friends' | 'experts';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const desktopTabs = [
  { id: 'home' as const, label: 'Home', icon: 'home' },
  { id: 'search' as const, label: 'Search', icon: 'search' },
  { id: 'places' as const, label: 'My Ratings', icon: 'grade' },
  { id: 'experts' as const, label: 'Experts', icon: 'auto_awesome' },
  { id: 'friends' as const, label: 'Friends', icon: 'group' },
  { id: 'profile' as const, label: 'Profile', icon: 'person' },
];

const mobileTabs = [
  { id: 'home' as const, label: 'Home', icon: 'home' },
  { id: 'search' as const, label: 'Search', icon: 'search' },
  { id: 'places' as const, label: 'Ratings', icon: 'grade' },
  { id: 'experts' as const, label: 'Experts', icon: 'auto_awesome' },
  { id: 'profile' as const, label: 'Profile', icon: 'person' },
];

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* ─── Desktop: Editorial Top Bar ─── */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="w-full max-w-screen-xl mx-auto flex h-16 items-center justify-between px-6">
          {/* Logo / Brand */}
          <div className="cursor-pointer flex items-center gap-2" onClick={() => onTabChange('home')}>
            <span className="text-xl font-headline font-bold text-primary tracking-tight italic">Grubby</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="flex items-center gap-1">
            {desktopTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${isActive ? 'text-primary' : ''}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {tab.icon}
                  </span>
                  <span className="font-body text-[11px] font-semibold uppercase tracking-wider">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">notifications</span>
            </button>
            {user ? (
              <AppSidebar />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-5 h-9 text-sm font-body font-bold bg-primary text-primary-foreground hover:opacity-90"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile: Editorial Top Bar ─── */}
      <nav className="lg:hidden sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl border-b border-outline-variant/15 pt-safe-area-top">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
                <AppSidebar />
              </div>
            )}
            <div className="cursor-pointer" onClick={() => onTabChange('home')}>
              <span className="text-lg font-headline font-bold text-primary tracking-tight italic">Grubby</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">notifications</span>
            </button>
            {!user && (
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
                className="rounded-full px-4 h-8 text-xs font-body font-bold bg-primary text-primary-foreground hover:opacity-90"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile: Bottom Navigation ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-2xl border-t border-outline-variant/15">
        <div className="pb-safe-area-bottom">
          <div className="flex justify-around items-center h-16 px-4">
            {mobileTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-90 ${
                    isActive ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {tab.icon}
                  </span>
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-wider mt-1 ${
                    isActive ? 'text-primary' : ''
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
