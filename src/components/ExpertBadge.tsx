import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ExpertBadgeProps {
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline';
  className?: string;
}

export function ExpertBadge({
  showIcon = true,
  showText = true,
  size = 'md',
  variant = 'default',
  className = ''
}: ExpertBadgeProps) {
  const iconSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  const textSizes = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  };

  const paddings = {
    sm: 'px-1.5 py-0.5',
    md: 'px-2 py-0.5',
    lg: 'px-2.5 py-1'
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {showIcon && (
          <span className={`material-symbols-outlined ${iconSizes[size]} text-secondary`} style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
        )}
        {showText && (
          <Badge
            variant="secondary"
            className={`${textSizes[size]} ${paddings[size]} bg-secondary/10 text-secondary border-0`}
          >
            Expert
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`${textSizes[size]} ${paddings[size]} bg-secondary/10 text-secondary border-0 flex items-center gap-1 ${className}`}
    >
      {showIcon && (
        <span className={`material-symbols-outlined ${iconSizes[size]}`} style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
      )}
      {showText && 'Expert'}
    </Badge>
  );
}
