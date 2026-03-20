import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);

interface FriendStatsProps {
  totalFriends: number;
  pendingRequests: number;
  sentRequests: number;
  recentActivity: number;
  className?: string;
}

export function FriendStats({
  totalFriends,
  pendingRequests,
  sentRequests,
  recentActivity,
  className
}: FriendStatsProps) {
  const stats = [
    {
      title: 'Friends',
      value: totalFriends,
      iconName: 'group',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      description: 'Total connections'
    },
    {
      title: 'Pending',
      value: pendingRequests,
      iconName: 'schedule',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      description: 'Awaiting response'
    },
    {
      title: 'Sent',
      value: sentRequests,
      iconName: 'person_add',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      description: 'Requests sent'
    },
    {
      title: 'Active',
      value: recentActivity,
      iconName: 'trending_up',
      color: 'text-tertiary',
      bgColor: 'bg-tertiary/10',
      description: 'Recent activity'
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-background to-muted/30"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <MIcon name={stat.iconName} className={cn("text-base", stat.color)} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground">{stat.title}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
