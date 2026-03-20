import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface ReviewSummaryData {
  summary: string;
  highlights: string[];
  concerns: string[];
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  foodQuality?: string;
  serviceQuality?: string;
  atmosphere?: string;
  valueForMoney?: string;
  recommendedDishes?: string[];
  bestFor?: string[];
}

interface AIReviewSummaryProps {
  restaurantName: string;
  placeId?: string;
  className?: string;
}

export function AIReviewSummary({ restaurantName, placeId, className }: AIReviewSummaryProps) {
  const [reviewData, setReviewData] = useState<ReviewSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (placeId) {
      fetchReviewSummary();
    }
  }, [placeId, restaurantName]);

  const fetchReviewSummary = async () => {
    if (!placeId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-review-summarizer', {
        body: {
          placeId,
          restaurantName
        }
      });

      if (error) throw error;

      setReviewData(data);
    } catch (err) {
      console.error('Error fetching AI review summary:', err);
      setError('Unable to load review summary');
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-secondary bg-secondary/5';
      case 'negative': return 'text-destructive bg-destructive/5';
      case 'mixed': return 'text-secondary bg-secondary/5';
      default: return 'text-muted-foreground bg-muted/50';
    }
  };

  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'excellent': return '🌟';
      case 'good': return '👍';
      case 'average': return '👌';
      case 'poor': return '👎';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MIcon name="auto_awesome" className="text-base text-primary" />
            <CardTitle className="text-lg">AI Review Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reviewData) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <p className="text-sm text-muted-foreground text-center">
            {error || 'No review summary available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MIcon name="auto_awesome" className="text-base text-primary" />
            <CardTitle className="text-lg">AI Review Insights</CardTitle>
          </div>
          <Badge className={getSentimentColor(reviewData.sentiment)}>
            {reviewData.sentiment}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary */}
        <div>
          <p className="text-sm leading-relaxed">{reviewData.summary}</p>
        </div>

        {/* Quality Ratings */}
        {(reviewData.foodQuality || reviewData.serviceQuality || reviewData.atmosphere || reviewData.valueForMoney) && (
          <div className="grid grid-cols-2 gap-3">
            {reviewData.foodQuality && (
              <div className="flex items-center gap-2 text-sm">
                <MIcon name="restaurant" className="text-sm text-secondary" />
                <span>Food:</span>
                <span>{getQualityIcon(reviewData.foodQuality)} {reviewData.foodQuality}</span>
              </div>
            )}
            {reviewData.serviceQuality && (
              <div className="flex items-center gap-2 text-sm">
                <MIcon name="group" className="text-sm text-primary" />
                <span>Service:</span>
                <span>{getQualityIcon(reviewData.serviceQuality)} {reviewData.serviceQuality}</span>
              </div>
            )}
            {reviewData.atmosphere && (
              <div className="flex items-center gap-2 text-sm">
                <MIcon name="favorite" className="text-sm text-secondary" />
                <span>Atmosphere:</span>
                <span>{getQualityIcon(reviewData.atmosphere)} {reviewData.atmosphere}</span>
              </div>
            )}
            {reviewData.valueForMoney && (
              <div className="flex items-center gap-2 text-sm">
                <MIcon name="attach_money" className="text-sm text-secondary" />
                <span>Value:</span>
                <span>{getQualityIcon(reviewData.valueForMoney)} {reviewData.valueForMoney}</span>
              </div>
            )}
          </div>
        )}

        {/* Highlights */}
        {reviewData.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <MIcon name="trending_up" className="text-sm text-secondary" />
              What people love:
            </h4>
            <div className="flex flex-wrap gap-1">
              {reviewData.highlights.map((highlight, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-secondary/5 text-secondary border-secondary/20">
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {reviewData.concerns.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <MIcon name="warning" className="text-sm text-secondary" />
              Things to note:
            </h4>
            <div className="flex flex-wrap gap-1">
              {reviewData.concerns.map((concern, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-secondary/5 text-secondary border-secondary/20">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Dishes */}
        {reviewData.recommendedDishes && reviewData.recommendedDishes.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Must-try dishes:</h4>
            <div className="flex flex-wrap gap-1">
              {reviewData.recommendedDishes.map((dish, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  🍽️ {dish}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Best For */}
        {reviewData.bestFor && reviewData.bestFor.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Perfect for:</h4>
            <div className="flex flex-wrap gap-1">
              {reviewData.bestFor.map((occasion, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {occasion}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}