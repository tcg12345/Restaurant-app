import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
const MIcon = ({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) => (
  <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>
);
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useItineraries } from '@/hooks/useItineraries';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { ExpertBadge } from '@/components/ExpertBadge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ItineraryPrivacySettings } from '@/components/ItineraryPrivacySettings';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

interface ProfileStats {
  rated_count: number;
  wishlist_count: number;
  avg_rating: number;
  top_cuisine: string;
  following_count: number;
  followers_count: number;
}

interface RecentActivity {
  id: string;
  name: string;
  address: string;
  rating: number;
  date_visited: string;
  created_at: string;
  google_place_id: string;
  cuisine: string;
}

interface TasteProfileDimension {
  dimension: string;
  value: number;
  fullMark: number;
}

const defaultTasteProfile: TasteProfileDimension[] = [
  { dimension: 'Flavor', value: 72, fullMark: 100 },
  { dimension: 'Ambiance', value: 65, fullMark: 100 },
  { dimension: 'Value', value: 58, fullMark: 100 },
  { dimension: 'Service', value: 70, fullMark: 100 },
  { dimension: 'Presentation', value: 80, fullMark: 100 },
  { dimension: 'Authenticity', value: 85, fullMark: 100 },
];

export default function DesktopProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { isExpert } = useUserRole(user?.id);
  const { friends } = useFriends();
  const { itineraries } = useItineraries();

  const [stats, setStats] = useState<ProfileStats>({
    rated_count: 0,
    wishlist_count: 0,
    avg_rating: 0,
    top_cuisine: '',
    following_count: 0,
    followers_count: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [tasteProfile, setTasteProfile] = useState<TasteProfileDimension[]>(defaultTasteProfile);

  // Load taste profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('taste_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasteProfile(parsed.map((d: any) => ({
            dimension: d.dimension || d.label || '',
            value: d.value || 0,
            fullMark: d.fullMark || 100,
          })));
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  // Load user stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase.rpc('get_user_stats', {
          target_user_id: user.id,
        });
        if (error) throw error;
        setStats({
          rated_count: data[0]?.rated_count || 0,
          wishlist_count: data[0]?.wishlist_count || 0,
          avg_rating: data[0]?.avg_rating || 0,
          top_cuisine: data[0]?.top_cuisine || '',
          following_count: friends.length,
          followers_count: friends.length,
        });
      } catch {
        // RPC may not exist - compute stats from restaurants table directly
        try {
          const [ratedRes, wishlistRes] = await Promise.all([
            supabase.from('restaurants').select('rating, cuisine', { count: 'exact' }).eq('user_id', user.id).eq('is_wishlist', false).not('rating', 'is', null),
            supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_wishlist', true),
          ]);
          const ratings = (ratedRes.data || []).map((r: any) => r.rating).filter(Boolean);
          const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
          const cuisines = (ratedRes.data || []).map((r: any) => r.cuisine).filter(Boolean);
          const cuisineCount: Record<string, number> = {};
          cuisines.forEach((c: string) => { cuisineCount[c] = (cuisineCount[c] || 0) + 1; });
          const topCuisine = Object.entries(cuisineCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          setStats({
            rated_count: ratedRes.count || 0,
            wishlist_count: wishlistRes.count || 0,
            avg_rating: Math.round(avgRating * 10) / 10,
            top_cuisine: topCuisine,
            following_count: friends.length,
            followers_count: friends.length,
          });
        } catch {}
      }
    };
    loadStats();
  }, [user, friends]);

  // Load recent activity
  useEffect(() => {
    const loadRecentActivity = async () => {
      if (!user) return;
      setLoadingActivity(true);
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, address, rating, date_visited, created_at, google_place_id, cuisine')
          .eq('user_id', user.id)
          .eq('is_wishlist', false)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(25);
        if (error) throw error;
        setRecentActivity(data || []);
      } catch (e) {
        console.error('Error loading recent activity:', e);
      } finally {
        setLoadingActivity(false);
      }
    };
    loadRecentActivity();
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Derive taste tags from recent activity cuisines
  const cuisineCounts: Record<string, number> = {};
  recentActivity.forEach((a) => {
    if (a.cuisine) {
      cuisineCounts[a.cuisine] = (cuisineCounts[a.cuisine] || 0) + 1;
    }
  });
  const sortedCuisines = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]);
  const tasteTags = sortedCuisines.slice(0, 4).map(([cuisine, count]) => {
    if (count >= 5) return `${cuisine} Devotee`;
    if (count >= 3) return `${cuisine} Enthusiast`;
    return `${cuisine} Explorer`;
  });

  // Adventure score: ratio of unique cuisines to total ratings
  const uniqueCuisineCount = Object.keys(cuisineCounts).length;
  const adventureScore = stats.rated_count > 0
    ? Math.min(100, Math.round((uniqueCuisineCount / Math.max(stats.rated_count, 1)) * 100 * 2.5))
    : 0;

  // Sustainability index placeholder (based on diversity)
  const sustainabilityIndex = stats.rated_count > 0
    ? Math.min(100, Math.round(((stats.avg_rating / 5) * 60) + (uniqueCuisineCount * 4)))
    : 0;

  return (
    <div className="w-full max-w-[1100px] mx-auto py-10 px-8 space-y-10">

      {/* ===== Profile Header ===== */}
      <div className="flex items-start gap-8">
        {/* Avatar */}
        <Avatar className="w-28 h-28 border-4 border-secondary/20 flex-shrink-0">
          <AvatarImage src={profile.avatar_url || ''} alt={profile.name || profile.username || 'User'} />
          <AvatarFallback className="text-3xl font-headline font-bold bg-surface-container-low text-on-surface-variant">
            {profile.name?.charAt(0) || profile.username?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Name & Meta */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-headline font-bold text-primary">{profile.name || profile.username}</h1>
            {isExpert && <ExpertBadge size="md" />}
          </div>
          <p className="text-[10px] uppercase tracking-widest text-secondary font-body">
            Gourmet Explorer &bull; Level: Connoisseur
          </p>
          {profile.username && profile.name && (
            <p className="text-sm text-on-surface-variant font-body">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-on-surface-variant italic max-w-xl font-body leading-relaxed mt-1">
              {profile.bio}
            </p>
          )}
          {profile.home_city && (
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mt-1">
              <MIcon name="location_on" className="text-sm text-secondary" />
              <span className="font-body">{profile.home_city}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="rounded-full border border-primary text-primary px-5 h-9 text-sm font-body"
              onClick={() => navigate('/profile/edit')}
            >
              <MIcon name="edit" className="text-sm mr-2" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-primary text-primary px-5 h-9 text-sm font-body"
              onClick={() => navigate('/profile/edit-photo')}
            >
              <MIcon name="photo_camera" className="text-sm mr-2" />
              Update Photo
            </Button>
            <Button
              variant="outline"
              className="rounded-full border border-primary text-primary px-5 h-9 text-sm font-body"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `${profile.name}'s Gourmet Canvas`, url: window.location.href });
                }
              }}
            >
              <MIcon name="share" className="text-sm mr-2" />
              Share Canvas
            </Button>
          </div>
        </div>
      </div>

      <Separator className="bg-secondary/10" />

      {/* ===== Stats Grid ===== */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body mb-4">At a Glance</p>
        <div className="grid grid-cols-4 gap-5">
          {/* Average Rating */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2">
              <MIcon name="grade" className="text-lg text-secondary" filled />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Avg Rating</span>
            </div>
            <p className="text-3xl font-headline font-bold text-primary">{stats.avg_rating.toFixed(1)}</p>
            <p className="text-xs text-on-surface-variant font-body">across {stats.rated_count} rating{stats.rated_count !== 1 ? 's' : ''}</p>
          </div>
          {/* Following */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2">
              <MIcon name="group" className="text-lg text-secondary" />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Following</span>
            </div>
            <p className="text-3xl font-headline font-bold text-primary">{stats.following_count}</p>
            <p className="text-xs text-on-surface-variant font-body">fellow connoisseurs</p>
          </div>
          {/* Top Cuisine */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2">
              <MIcon name="restaurant_menu" className="text-lg text-secondary" />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Top Cuisine</span>
            </div>
            <p className="text-3xl font-headline font-bold text-primary">{stats.top_cuisine || '\u2014'}</p>
            <p className="text-xs text-on-surface-variant font-body">most visited genre</p>
          </div>
          {/* Wishlist */}
          <div className="bg-surface-container-low rounded-2xl p-5 space-y-1">
            <div className="flex items-center gap-2">
              <MIcon name="bookmark" className="text-lg text-secondary" filled />
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Wishlist</span>
            </div>
            <p className="text-3xl font-headline font-bold text-primary">{stats.wishlist_count}</p>
            <p className="text-xs text-on-surface-variant font-body">places to discover</p>
          </div>
        </div>
      </div>

      {/* ===== Two-column: Taste Profile + Indicators ===== */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left: Taste Profile Radar */}
        <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-headline font-bold text-xl text-primary">Taste Profile</h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">
              Based on {stats.rated_count} verified dining experience{stats.rated_count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Recharts Radar Chart */}
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={tasteProfile}>
                <PolarGrid stroke="#192830" strokeOpacity={0.15} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#192830', fontSize: 11, fontFamily: 'inherit' }}
                  className="font-body"
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Taste"
                  dataKey="value"
                  stroke="#9a442d"
                  fill="#9a442d"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Taste Tags */}
          {tasteTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tasteTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-surface-container-high rounded-full px-3 py-1 text-xs font-body text-primary"
                >
                  {tag}
                </span>
              ))}
              {stats.top_cuisine && !tasteTags.some(t => t.includes(stats.top_cuisine)) && (
                <span className="bg-surface-container-high rounded-full px-3 py-1 text-xs font-body text-secondary">
                  {stats.top_cuisine} Lover
                </span>
              )}
            </div>
          )}

          {/* Taste Quote */}
          <p className="italic text-sm text-on-surface-variant font-body text-center pt-2">
            &ldquo;A palate shaped by {uniqueCuisineCount} cuisine{uniqueCuisineCount !== 1 ? 's' : ''}, {stats.rated_count} experience{stats.rated_count !== 1 ? 's' : ''}, and an average rating of {stats.avg_rating.toFixed(1)}.&rdquo;
          </p>
        </div>

        {/* Right: Adventure Score + Sustainability Index + Quick Actions */}
        <div className="space-y-6">
          {/* Adventure Score */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-lg text-primary">Adventure Score</h3>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">Culinary curiosity index</p>
              </div>
              <span className="text-4xl font-headline font-bold text-secondary">{adventureScore}%</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${adventureScore}%`,
                  background: 'linear-gradient(90deg, #9a442d 0%, #c4693e 100%)',
                }}
              />
            </div>
            <p className="text-xs text-on-surface-variant font-body">
              {adventureScore >= 70
                ? 'You are a true culinary adventurer, always seeking new flavors.'
                : adventureScore >= 40
                ? 'A healthy mix of favorites and new discoveries.'
                : 'Try branching out to new cuisines to raise your score!'}
            </p>
          </div>

          {/* Sustainability Index */}
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-lg text-primary">Sustainability Index</h3>
                <p className="text-xs text-on-surface-variant font-body mt-0.5">Diversity &amp; quality balance</p>
              </div>
              <span className="text-4xl font-headline font-bold text-secondary">{sustainabilityIndex}%</span>
            </div>
            <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${sustainabilityIndex}%`,
                  background: 'linear-gradient(90deg, #9a442d88 0%, #9a442d 100%)',
                }}
              />
            </div>
            <p className="text-xs text-on-surface-variant font-body">
              Measures the harmony between cuisine diversity and quality of experiences.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/rated')}
              className="bg-surface-container-low rounded-2xl p-4 text-center hover:bg-surface-container-high transition-colors"
            >
              <MIcon name="grade" className="text-2xl text-secondary mx-auto" filled />
              <p className="text-lg font-headline font-bold text-primary mt-1">{stats.rated_count}</p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Rated</p>
            </button>
            <button
              onClick={() => navigate('/wishlist')}
              className="bg-surface-container-low rounded-2xl p-4 text-center hover:bg-surface-container-high transition-colors"
            >
              <MIcon name="bookmark" className="text-2xl text-secondary mx-auto" filled />
              <p className="text-lg font-headline font-bold text-primary mt-1">{stats.wishlist_count}</p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Wishlist</p>
            </button>
            <button
              onClick={() => navigate('/travel?view=saved')}
              className="bg-surface-container-low rounded-2xl p-4 text-center hover:bg-surface-container-high transition-colors"
            >
              <MIcon name="route" className="text-2xl text-secondary mx-auto" />
              <p className="text-lg font-headline font-bold text-primary mt-1">{itineraries.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-body">Itineraries</p>
            </button>
          </div>
        </div>
      </div>

      {/* ===== Itinerary Privacy Settings ===== */}
      <ItineraryPrivacySettings />

      {/* ===== Recent Activity ===== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline font-bold text-xl text-primary">Recent Activity</h2>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Your latest dining experiences</p>
          </div>
          {recentActivity.length > 0 && (
            <button
              onClick={() => navigate('/rated')}
              className="text-[10px] uppercase tracking-widest text-secondary font-body font-medium hover:underline"
            >
              View All
            </button>
          )}
        </div>

        {loadingActivity ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse bg-surface-container-low rounded-2xl p-4">
                <div className="w-12 h-12 bg-surface-container-high rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentActivity.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 bg-surface-container-low rounded-2xl p-4 cursor-pointer hover:bg-surface-container-high transition-colors group"
                onClick={() => navigate(`/restaurant/${activity.id}`)}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex-shrink-0 flex items-center justify-center">
                  <MIcon name="restaurant" className="text-xl text-secondary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm text-primary group-hover:text-secondary transition-colors truncate">
                    {activity.name}
                  </p>
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <MIcon
                        key={i}
                        name="star"
                        filled={i < Math.round(activity.rating)}
                        className={`text-sm ${i < Math.round(activity.rating) ? 'text-secondary' : 'text-on-surface-variant/20'}`}
                      />
                    ))}
                    <span className="text-xs text-on-surface-variant font-body ml-1.5">
                      {activity.rating?.toFixed(1)}
                    </span>
                  </div>
                  {activity.address && (
                    <p className="italic text-xs text-on-surface-variant truncate mt-0.5 font-body">
                      {activity.address}
                    </p>
                  )}
                </div>

                {/* Date & Cuisine badge */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-[10px] text-on-surface-variant/60 font-body">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                  {activity.cuisine && (
                    <span className="bg-secondary/10 rounded-full px-2.5 py-0.5 text-[10px] text-secondary font-body">
                      {activity.cuisine}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-surface-container-low rounded-2xl">
            <MIcon name="star_border" className="text-4xl text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-on-surface-variant text-sm font-body">
              No ratings yet. Start rating restaurants to build your Gourmet Canvas!
            </p>
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
