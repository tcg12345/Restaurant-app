import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMapboxToken } from '@/hooks/useMapboxToken';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface Restaurant {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount?: number;
  priceRange: number;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  location: {
    lat: number;
    lng: number;
  };
  cuisine?: string;
  googleMapsUrl?: string;
}

interface RestaurantMapViewProps {
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelect?: (restaurant: Restaurant) => void;
}

export function RestaurantMapView({ restaurants, selectedRestaurant, onRestaurantSelect }: RestaurantMapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { token, isLoading: tokenLoading } = useMapboxToken();

  const getPriceDisplay = (range: number) => '$'.repeat(Math.min(range, 4));

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || tokenLoading) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [token, tokenLoading]);

  // Add restaurant markers
  useEffect(() => {
    if (!map.current || !restaurants.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const validRestaurants = restaurants.filter(
      restaurant => restaurant.location?.lat && restaurant.location?.lng
    );

    if (validRestaurants.length === 0) return;

    // Add markers for each restaurant
    validRestaurants.forEach((restaurant) => {
      const marker = new mapboxgl.Marker({
        color: selectedRestaurant?.id === restaurant.id ? '#ff6b6b' : '#4285f4',
      })
        .setLngLat([restaurant.location.lng, restaurant.location.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <h3 class="font-semibold">${restaurant.name}</h3>
              <p class="text-sm text-on-surface-variant">${restaurant.cuisine}</p>
              <div class="flex items-center gap-1 mt-1">
                <span class="text-secondary">⭐</span>
                <span class="text-sm">${restaurant.rating}</span>
                <span class="text-sm text-secondary ml-2">${getPriceDisplay(restaurant.priceRange)}</span>
              </div>
            </div>`
          )
        )
        .addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        onRestaurantSelect?.(restaurant);
      });

      markers.current.push(marker);
    });

    // Fit map to show all restaurants
    if (validRestaurants.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validRestaurants.forEach(restaurant => {
        bounds.extend([restaurant.location.lng, restaurant.location.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [restaurants, selectedRestaurant, onRestaurantSelect]);

  // Update marker colors when selection changes
  useEffect(() => {
    markers.current.forEach((marker, index) => {
      const restaurant = restaurants.filter(r => r.location?.lat && r.location?.lng)[index];
      if (restaurant) {
        const color = selectedRestaurant?.id === restaurant.id ? '#ff6b6b' : '#4285f4';
        marker.getElement().style.filter = `hue-rotate(${color === '#ff6b6b' ? '0deg' : '200deg'})`;
      }
    });
  }, [selectedRestaurant, restaurants]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
      {/* Map Container */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardContent className="h-full p-0">
            {tokenLoading ? (
              <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MIcon name="location_on" className="text-5xl mx-auto text-muted-foreground animate-pulse" />
                  <div>
                    <h3 className="text-lg font-semibold">Loading Map...</h3>
                    <p className="text-muted-foreground">Setting up Mapbox integration</p>
                  </div>
                </div>
              </div>
            ) : !token ? (
              <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center">
                <div className="text-center space-y-4">
                  <MIcon name="location_on" className="text-5xl mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold">Map Unavailable</h3>
                    <p className="text-muted-foreground">Mapbox token not configured</p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                ref={mapContainer} 
                className="h-full w-full rounded-lg"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Details Sidebar */}
      <div className="space-y-4">
        {selectedRestaurant ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">
                {selectedRestaurant.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MIcon name="location_on" className="text-xs" />
                {selectedRestaurant.address}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <MIcon name="grade" className="text-sm text-secondary" filled />
                  <span className="font-semibold">{selectedRestaurant.rating}</span>
                  {selectedRestaurant.reviewCount && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedRestaurant.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={selectedRestaurant.isOpen ? "default" : "secondary"}>
                    {selectedRestaurant.isOpen ? "Open" : "Closed"}
                  </Badge>
                  <span className="text-lg font-bold text-secondary">
                    {getPriceDisplay(selectedRestaurant.priceRange)}
                  </span>
                </div>
              </div>

              {/* Cuisine */}
              {selectedRestaurant.cuisine && (
                <Badge variant="outline" className="text-xs">
                  {selectedRestaurant.cuisine}
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {selectedRestaurant.phoneNumber && (
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MIcon name="phone" className="text-xs mr-2" />
                    {selectedRestaurant.phoneNumber}
                  </Button>
                )}
                
                {selectedRestaurant.website && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => window.open(selectedRestaurant.website, '_blank')}
                  >
                    <MIcon name="language" className="text-xs mr-2" />
                    Visit Website
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.open(selectedRestaurant.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(selectedRestaurant.name + ' ' + selectedRestaurant.address)}`, '_blank')}
                >
                  <MIcon name="open_in_new" className="text-xs mr-2" />
                  View in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="space-y-4">
                <MIcon name="location_on" className="text-4xl mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Select a Restaurant</h3>
                  <p className="text-muted-foreground">
                    Click on a marker on the map to view restaurant details
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restaurant List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Restaurants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {restaurants.map((restaurant) => (
              <Button
                key={restaurant.id}
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-left h-auto p-2 ${
                  selectedRestaurant?.id === restaurant.id ? 'bg-muted' : ''
                }`}
                onClick={() => onRestaurantSelect?.(restaurant)}
              >
                <div className="space-y-1">
                  <div className="font-medium line-clamp-1">{restaurant.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MIcon name="grade" className="text-xs text-secondary" filled />
                    {restaurant.rating}
                    <span className="ml-1">{getPriceDisplay(restaurant.priceRange)}</span>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}