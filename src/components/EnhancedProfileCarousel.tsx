import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExpertBadge } from '@/components/ExpertBadge';
import { ProfilePreview } from '@/types/feed';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedProfileCarouselProps {
  profiles: ProfilePreview[];
  title: string;
  subtitle?: string;
  onProfileClick?: (profileId: string) => void;
}

export function EnhancedProfileCarousel({ 
  profiles, 
  title, 
  subtitle,
  onProfileClick 
}: EnhancedProfileCarouselProps) {
  const navigate = useNavigate();
  const [hoveredProfile, setHoveredProfile] = useState<string | null>(null);

  if (profiles.length === 0) return null;

  const handleProfileClick = (profileId: string) => {
    if (onProfileClick) {
      onProfileClick(profileId);
    } else {
      navigate(`/friend-profile/${profileId}`);
    }
  };

  return (
    <div className="px-4 py-6 border-b border-border/50 bg-gradient-to-b from-muted/20 to-transparent">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/friends')}
          className="text-primary hover:text-primary/80 font-medium"
        >
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Profiles carousel */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin">
        <TooltipProvider>
          {profiles.map((profile) => {
            const isHovered = hoveredProfile === profile.id;
            const displayName = profile.name?.split(' ')[0] || profile.username;
            
            return (
              <Tooltip key={profile.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex-col h-auto p-3 min-w-0 flex-shrink-0 gap-2.5",
                      "rounded-2xl transition-all duration-300",
                      "hover:bg-muted/50 hover:scale-105",
                      isHovered && "ring-2 ring-primary/30"
                    )}
                    onMouseEnter={() => setHoveredProfile(profile.id)}
                    onMouseLeave={() => setHoveredProfile(null)}
                    onClick={() => handleProfileClick(profile.id)}
                  >
                    <div className="relative">
                      {/* Avatar with gradient ring */}
                      <div className={cn(
                        "rounded-full p-0.5 transition-all duration-300",
                        profile.recentActivityCount > 0
                          ? "bg-gradient-to-br from-primary via-primary/60 to-primary/30"
                          : "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10"
                      )}>
                        <Avatar className={cn(
                          "h-16 w-16 transition-all duration-300",
                          "ring-2 ring-background",
                          isHovered && "scale-105"
                        )}>
                          <AvatarImage src={profile.avatar_url || ''} alt={profile.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-xl">
                            {(profile.name || profile.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {/* Activity count badge */}
                      {profile.recentActivityCount > 0 && (
                        <div className={cn(
                          "absolute -top-1 -right-1 h-6 w-6",
                          "bg-gradient-to-br from-primary to-primary/80",
                          "text-primary-foreground rounded-full",
                          "flex items-center justify-center shadow-lg",
                          "ring-2 ring-background",
                          "transition-all duration-300",
                          isHovered && "scale-110"
                        )}>
                          <span className="text-xs font-bold">
                            {profile.recentActivityCount > 9 ? '9+' : profile.recentActivityCount}
                          </span>
                        </div>
                      )}

                      {/* Online status indicator */}
                      {profile.recentActivityCount > 0 && (
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    
                    {/* Name and expert badge */}
                    <div className="text-center max-w-[80px] space-y-1">
                      <p className={cn(
                        "text-sm font-semibold truncate transition-colors",
                        isHovered && "text-primary"
                      )}>
                        {displayName}
                      </p>
                      {profile.isExpert && (
                        <ExpertBadge size="sm" showText={false} />
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  className="bg-popover/95 backdrop-blur-sm border-border/50"
                >
                  <div className="text-center space-y-1">
                    <p className="font-semibold">{profile.name || profile.username}</p>
                    {profile.isExpert && (
                      <p className="text-xs text-primary font-medium">Restaurant Expert</p>
                    )}
                    {profile.recentActivityCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {profile.recentActivityCount} recent {profile.recentActivityCount === 1 ? 'activity' : 'activities'}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}

