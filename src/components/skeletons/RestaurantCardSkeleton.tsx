import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
      <Skeleton className="w-full h-48" />
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function RestaurantCarouselSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="px-4 py-6">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="min-w-[280px]">
            <RestaurantCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
