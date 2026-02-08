import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { AIChatbot } from '@/components/AIChatbot';

type TabId = 'home' | 'places' | 'search' | 'settings' | 'profile' | 'travel' | 'friends' | 'experts';

interface LayoutProps {
  children: ReactNode;
  activeTab?: TabId;
  showNavbar?: boolean;
  showChatbot?: boolean;
}

export function Layout({
  children,
  activeTab = 'search',
  showNavbar = true,
  showChatbot = true
}: LayoutProps) {
  const navigate = useNavigate();

  const handleTabChange = (tab: TabId) => {
    switch (tab) {
      case 'home': navigate('/home'); break;
      case 'places': navigate('/places'); break;
      case 'search': navigate('/search/global'); break;
      case 'settings': navigate('/settings'); break;
      case 'profile': navigate('/profile'); break;
      case 'friends': navigate('/friends'); break;
      case 'experts': navigate('/experts'); break;
      case 'travel': navigate('/travel'); break;
      default: navigate('/home');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background mobile-viewport">
      {showNavbar && (
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      <main className="flex-1 pb-16 lg:pb-0 mobile-scroll w-full">
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>

      {showChatbot && (
        <div className="hidden lg:block">
          <AIChatbot />
        </div>
      )}
    </div>
  );
}
