import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useRatingStats } from '@/hooks/useRatingStats';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface ExpertIndicatorProps {
  placeId?: string;
  restaurantName?: string;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export function ExpertIndicator({ 
  placeId, 
  restaurantName, 
  size = 'sm',
  showCount = false 
}: ExpertIndicatorProps) {
  const { expertStats } = useRatingStats(placeId, restaurantName);

  // Don't show indicator if no expert reviews
  if (!expertStats.count || expertStats.count === 0) {
    return null;
  }

  const iconSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <Badge 
      variant="secondary" 
      className={`${textSize} ${padding} bg-secondary/5 text-secondary border-secondary/20 dark:bg-secondary/20 dark:text-secondary dark:border-secondary/40 flex items-center gap-1`}
    >
      <MIcon name="verified" className={iconSize} filled />
      {showCount ? `${expertStats.count} Expert${expertStats.count !== 1 ? 's' : ''}` : 'Expert Reviewed'}
    </Badge>
  );
}