import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RestaurantList } from '@/hooks/useRestaurantLists';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface RestaurantListCardProps {
  list: RestaurantList;
  onSelect: (list: RestaurantList) => void;
  onEdit?: (list: RestaurantList) => void;
  onDelete?: (listId: string) => void;
  isDeleteMode?: boolean;
}

export function RestaurantListCard({ 
  list, 
  onSelect, 
  onEdit, 
  onDelete,
  isDeleteMode = false
}: RestaurantListCardProps) {
  const handleCardClick = () => {
    if (!isDeleteMode) {
      onSelect(list);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(list.id);
    }
  };

  return (
    <Card 
      className={`transition-shadow group relative ${
        isDeleteMode ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
      }`}
      onClick={handleCardClick}
      data-testid={`list-card-${list.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Delete X button */}
          {isDeleteMode && !list.is_default && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive/50 hover:bg-destructive text-white z-10"
              onClick={handleDeleteClick}
              data-testid={`delete-button-${list.id}`}
            >
              <MIcon name="close" className="text-sm" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">
                {list.name}
              </CardTitle>
              {list.is_default && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <MIcon name="grade" className="text-xs" />
                  Default
                </Badge>
              )}
              {isDeleteMode && !list.is_default && (
                <Badge variant="destructive" className="text-xs">
                  Click X to delete
                </Badge>
              )}
            </div>
            {list.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {list.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {list.restaurant_count || 0} restaurant{(list.restaurant_count || 0) !== 1 ? 's' : ''}
          </span>
          <span>
            {new Date(list.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}