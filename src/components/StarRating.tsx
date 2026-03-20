import { useState } from 'react';
import { Slider } from '@/components/ui/slider';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showValue = true 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [sliderStep, setSliderStep] = useState<number>(0.01);

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const displayRating = hoverRating ?? rating;

  const handleSliderChange = (value: number[]) => {
    const newRating = value[0];
    onRatingChange?.(newRating);
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <div className="flex items-center gap-1 flex-wrap justify-center sm:justify-start">
          {[...Array(10)].map((_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= displayRating;
            const isPartiallyFilled = starValue > displayRating && starValue - 1 < displayRating;
            
            return (
              <button
                key={index}
                type="button"
                disabled={readonly}
                onMouseEnter={() => !readonly && setHoverRating(starValue)}
                onMouseLeave={() => !readonly && setHoverRating(null)}
                onClick={() => !readonly && onRatingChange?.(starValue)}
                className={`transition-all duration-150 ${
                  readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                }`}
              >
                <div className="relative">
                  <MIcon
                    name="grade"
                    className={`${sizeClasses[size]} transition-colors duration-150 ${
                      isFilled
                        ? 'text-rating-filled'
                        : 'text-rating-empty hover:text-rating-hover'
                    }`}
                    filled={isFilled}
                  />
                  {isPartiallyFilled && (
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ width: `${((displayRating % 1) * 100)}%` }}
                    >
                      <MIcon
                        name="grade"
                        className={`${sizeClasses[size]} text-rating-filled`}
                        filled
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {showValue && (
          <span className={`font-medium text-foreground ${textSizeClasses[size]} text-center sm:text-left flex-shrink-0`}>
            {displayRating}/10
          </span>
        )}
      </div>

      {/* Slider for decimal precision - only show when not readonly */}
      {!readonly && onRatingChange && (
        <div className="space-y-2 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
            <span>Fine-tune rating</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span>Step:</span>
              <Select
                value={sliderStep.toString()}
                onValueChange={(value) => setSliderStep(parseFloat(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="0.1">0.1</SelectItem>
                  <SelectItem value="0.01">0.01</SelectItem>
                </SelectContent>
              </Select>
              <span className="whitespace-nowrap">{rating.toFixed(2)}/10</span>
            </div>
          </div>
          <Slider
            value={[rating]}
            onValueChange={handleSliderChange}
            max={10}
            min={0}
            step={sliderStep}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}