import { useState } from 'react';
import { Calendar, Settings, MessageCircle, Bell, Menu, X, ChevronRight, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  onNavigate?: (path: string) => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useUnreadMessageCount();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const menuSections = [
    {
      title: 'Social',
      items: [
        {
          path: '/messages',
          icon: MessageCircle,
          label: 'Messages',
          description: 'Chat with friends',
          badge: unreadCount > 0 ? unreadCount : undefined,
          badgeColor: 'bg-blue-500'
        },
        {
          path: '/travel',
          icon: Calendar,
          label: 'Trip Planner',
          description: 'Plan your food adventures',
          badge: undefined
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          path: '/settings',
          icon: Settings,
          label: 'Settings',
          description: 'Manage your preferences',
          badge: undefined
        }
      ]
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 rounded-xl transition-all duration-300",
            "hover:bg-primary/10 hover:scale-105 active:scale-95"
          )}
          title="Menu"
        >
          <Menu className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-[340px] p-0 bg-gradient-to-br from-background via-background to-muted/20"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Menu
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Welcome back, foodie!
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Menu Sections */}
          {menuSections.map((section, sectionIndex) => (
            <div key={section.title}>
              {sectionIndex > 0 && <Separator className="my-6" />}
              
              <div className="mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3">
                  {section.title}
                </h3>
              </div>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isHovered = hoveredItem === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-0 text-left group relative",
                        "transition-all duration-200"
                      )}
                      onClick={() => handleNavigation(item.path)}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className={cn(
                        "flex items-center space-x-4 w-full px-4 py-3.5 rounded-xl",
                        "transition-all duration-300",
                        isHovered 
                          ? "bg-gradient-to-r from-primary/10 to-primary/5 translate-x-1 shadow-sm" 
                          : "hover:bg-muted/50"
                      )}>
                        {/* Icon */}
                        <div className={cn(
                          "flex items-center justify-center h-11 w-11 rounded-xl",
                          "transition-all duration-300",
                          isHovered 
                            ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                            : "bg-muted/50 text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold text-sm transition-colors",
                              isHovered && "text-primary"
                            )}>
                              {item.label}
                            </span>
                            {item.badge !== undefined && (
                              <Badge 
                                className={cn(
                                  "h-5 min-w-[20px] px-1.5 text-[10px] font-bold",
                                  item.badgeColor || "bg-primary",
                                  "text-white shadow-sm"
                                )}
                              >
                                {item.badge > 9 ? '9+' : item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        </div>
                        
                        {/* Arrow indicator */}
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-all duration-300",
                          isHovered && "text-primary translate-x-1"
                        )} />
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notifications Section */}
          <Separator className="my-6" />
          
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 flex items-center gap-2">
              <Bell className="h-3 w-3" />
              Notifications
            </h3>
          </div>
          
          <div className="px-2">
            <div className="rounded-xl bg-muted/30 p-3">
              <NotificationsPanel />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-muted/30 to-transparent px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>RestoRadar v1.0</span>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>Premium</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
