import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function RecommendationCardSkeleton() {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-4">
        {/* Header with name and heart */}
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-6 w-3/4 bg-muted" />
          <Skeleton className="h-8 w-8 rounded-lg bg-muted flex-shrink-0" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 bg-muted" />
          <Skeleton className="h-5 w-8 bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>

        {/* Cuisine and price */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-20 bg-muted" />
          <Skeleton className="h-2 w-1 rounded-full bg-muted" />
          <Skeleton className="h-4 w-8 bg-muted" />
        </div>

        {/* Address */}
        <div className="flex items-center gap-1 mb-3">
          <Skeleton className="h-3 w-3 bg-muted" />
          <Skeleton className="h-3 w-24 bg-muted" />
        </div>

        {/* Hours */}
        <div className="flex items-center gap-1 mb-4">
          <Skeleton className="h-3 w-3 bg-muted" />
          <Skeleton className="h-3 w-20 bg-muted" />
        </div>

        {/* AI reasoning */}
        <div className="mb-4">
          <Skeleton className="h-3 w-full bg-muted mb-1" />
          <Skeleton className="h-3 w-4/5 bg-muted mb-1" />
          <Skeleton className="h-3 w-3/5 bg-muted" />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 bg-muted" />
          <Skeleton className="h-8 w-20 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}