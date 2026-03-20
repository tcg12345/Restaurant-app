import { Map, Star, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trip } from '@/hooks/useTrips';
import { usePlaceRatings } from '@/hooks/usePlaceRatings';
interface TripStatsProps {
  trips: Trip[];
}
export function TripStats({
  trips
}: TripStatsProps) {
  // Calculate stats across all trips
  const totalTrips = trips.length;
  const upcomingTrips = trips.filter(trip => {
    if (!trip.start_date) return false;
    return new Date(trip.start_date) > new Date();
  }).length;
  const completedTrips = trips.filter(trip => {
    if (!trip.end_date) return false;
    return new Date(trip.end_date) < new Date();
  }).length;
  const publicTrips = trips.filter(trip => trip.is_public).length;

  // Get total places across all trips (this is simplified - in practice you'd aggregate from all trips)
  const totalPlacesVisited = trips.reduce((acc, trip) => {
    // This would need to be enhanced to actually count places per trip
    return acc + 0; // Placeholder
  }, 0);
  const stats = [{
    label: 'Total Trips',
    value: totalTrips,
    icon: Map,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    trend: totalTrips > 0 ? `${totalTrips} created` : 'Start exploring'
  }, {
    label: 'Upcoming',
    value: upcomingTrips,
    icon: Calendar,
    color: 'text-secondary',
    bgColor: 'bg-secondary/5',
    trend: upcomingTrips > 0 ? 'Adventures ahead' : 'Plan your next trip'
  }, {
    label: 'Completed',
    value: completedTrips,
    icon: Star,
    color: 'text-tertiary',
    bgColor: 'bg-tertiary/5',
    trend: completedTrips > 0 ? 'Memories made' : 'Create memories'
  }, {
    label: 'Public Trips',
    value: publicTrips,
    icon: TrendingUp,
    color: 'text-secondary',
    bgColor: 'bg-secondary/5',
    trend: publicTrips > 0 ? 'Shared with friends' : 'Share your adventures'
  }];
  return <Card className="border-0 shadow-md">
      
    </Card>;
}