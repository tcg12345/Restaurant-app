import React from 'react';
import { Badge } from '@/components/ui/badge';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface ExpertStatusIndicatorProps {
  isExpert: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ExpertStatusIndicator({ 
  isExpert, 
  showText = false, 
  size = 'md',
  className = '' 
}: ExpertStatusIndicatorProps) {
  if (!isExpert) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Award className={`${sizeClasses[size]} text-secondary`} />
      {showText && (
        <span className={`${textSizeClasses[size]} font-medium text-secondary dark:text-secondary/70`}>
          Expert
        </span>
      )}
    </div>
  );
}

export function ExpertBadge({ isExpert, className = '' }: { isExpert: boolean; className?: string }) {
  if (!isExpert) return null;

  return (
    <Badge 
      variant="secondary" 
      className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ${className}`}
    >
      <Award className="h-3 w-3 mr-1" />
      Expert
    </Badge>
  );
}
