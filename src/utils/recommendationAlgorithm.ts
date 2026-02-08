/**
 * Recommendation Algorithm
 *
 * Scores restaurants based on:
 * 1. User taste profile (from palette test)
 * 2. Rated restaurant patterns (cuisines, price ranges, ratings)
 * 3. Friend/expert endorsements
 * 4. Location proximity
 *
 * Returns a confidence score 0-99 for each recommendation.
 */

export interface TasteProfile {
  diningVibe: string;       // casual, trendy, fine_dining, cozy, lively
  adventureLevel: string;   // comfort, sometimes, always
  spiceTolerance: string;   // mild, medium, spicy, extra_spicy
  pricePreference: number;  // 1-4
  favoriteCuisines: string[]; // top 3 cuisines
  priorities: string[];      // food_quality, atmosphere, service, value, location
  dietaryImportance: string; // very, somewhat, not_important
  diningOccasion: string;   // weekday_lunch, weeknight_dinner, weekend_brunch, special_occasions
}

export interface RatedRestaurant {
  name: string;
  cuisine?: string;
  rating?: number;
  priceRange?: number;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface RecommendationCandidate {
  name: string;
  cuisine?: string;
  priceRange?: number;
  rating?: number;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  photos?: string[];
  isOpen?: boolean;
  openingHours?: string;
  distance?: number;
  friendRatingCount?: number;
  friendAvgRating?: number;
  expertEndorsed?: boolean;
}

export interface ScoredRecommendation extends RecommendationCandidate {
  confidenceScore: number;
  matchFactors: string[];
}

const CUISINE_SIMILARITY: Record<string, string[]> = {
  'Italian': ['Mediterranean', 'French', 'Spanish', 'Greek'],
  'Japanese': ['Korean', 'Chinese', 'Vietnamese', 'Thai', 'Asian Fusion'],
  'French': ['Italian', 'Mediterranean', 'European', 'Belgian'],
  'Chinese': ['Japanese', 'Korean', 'Vietnamese', 'Thai', 'Asian Fusion'],
  'Mexican': ['Latin American', 'Spanish', 'Tex-Mex', 'South American'],
  'Indian': ['Pakistani', 'Nepalese', 'Sri Lankan', 'Bangladeshi'],
  'Thai': ['Vietnamese', 'Chinese', 'Japanese', 'Malaysian', 'Asian Fusion'],
  'Mediterranean': ['Italian', 'Greek', 'Turkish', 'Lebanese', 'Middle Eastern'],
  'American': ['BBQ', 'Southern', 'Burger', 'Steakhouse', 'Diner'],
  'Korean': ['Japanese', 'Chinese', 'Asian Fusion'],
  'Vietnamese': ['Thai', 'Chinese', 'Japanese', 'Asian Fusion'],
  'Spanish': ['Mexican', 'Latin American', 'Mediterranean', 'Portuguese'],
  'Greek': ['Mediterranean', 'Turkish', 'Middle Eastern', 'Lebanese'],
  'Middle Eastern': ['Mediterranean', 'Turkish', 'Lebanese', 'Greek', 'Persian'],
  'BBQ': ['American', 'Southern', 'Steakhouse'],
  'Seafood': ['Mediterranean', 'Japanese', 'Coastal'],
  'Steakhouse': ['American', 'BBQ', 'Argentinian'],
};

const VIBE_PRICE_MAP: Record<string, number[]> = {
  casual: [1, 2],
  trendy: [2, 3],
  fine_dining: [3, 4],
  cozy: [1, 2, 3],
  lively: [2, 3],
};

const ADVENTURE_CUISINE_WEIGHT: Record<string, number> = {
  comfort: 0.9,     // Strongly prefer known cuisines
  sometimes: 0.6,   // Mix of known and new
  always: 0.3,      // Open to anything
};

export function scoreRecommendations(
  candidates: RecommendationCandidate[],
  tasteProfile: TasteProfile | null,
  ratedRestaurants: RatedRestaurant[],
  userLocation?: { latitude: number; longitude: number } | null
): ScoredRecommendation[] {
  // Build preference model from rated restaurants
  const cuisineCounts: Record<string, number> = {};
  const cuisineRatings: Record<string, number[]> = {};
  const priceRanges: number[] = [];
  const ratedCities: Record<string, number> = {};

  ratedRestaurants.forEach(r => {
    if (r.cuisine) {
      cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
      if (r.rating) {
        if (!cuisineRatings[r.cuisine]) cuisineRatings[r.cuisine] = [];
        cuisineRatings[r.cuisine].push(r.rating);
      }
    }
    if (r.priceRange) priceRanges.push(r.priceRange);
    if (r.city) ratedCities[r.city] = (ratedCities[r.city] || 0) + 1;
  });

  const avgPrice = priceRanges.length > 0
    ? priceRanges.reduce((s, p) => s + p, 0) / priceRanges.length
    : 2;

  // Get top cuisines by count weighted by average rating
  const cuisineScores: Record<string, number> = {};
  Object.entries(cuisineCounts).forEach(([cuisine, count]) => {
    const avgRating = cuisineRatings[cuisine]
      ? cuisineRatings[cuisine].reduce((s, r) => s + r, 0) / cuisineRatings[cuisine].length
      : 5;
    cuisineScores[cuisine] = count * (avgRating / 10);
  });

  const scored = candidates.map(candidate => {
    let score = 50; // Base score
    const matchFactors: string[] = [];

    // 1. Cuisine match (0-25 points)
    if (candidate.cuisine) {
      const directMatch = cuisineScores[candidate.cuisine];
      if (directMatch) {
        score += Math.min(25, directMatch * 8);
        matchFactors.push(`Matches your love of ${candidate.cuisine}`);
      } else {
        // Check similar cuisines
        const similarCuisines = CUISINE_SIMILARITY[candidate.cuisine] || [];
        const similarMatch = similarCuisines.some(sc => cuisineScores[sc]);
        if (similarMatch) {
          const matchedCuisine = similarCuisines.find(sc => cuisineScores[sc]);
          score += Math.min(15, (cuisineScores[matchedCuisine!] || 0) * 5);
          matchFactors.push(`Similar to ${matchedCuisine} you enjoy`);
        }
      }

      // Taste profile cuisine match
      if (tasteProfile?.favoriteCuisines?.includes(candidate.cuisine)) {
        score += 10;
        matchFactors.push('Matches your cuisine preferences');
      }

      // Adventure factor
      if (tasteProfile && !directMatch && !cuisineScores[candidate.cuisine]) {
        const adventureWeight = ADVENTURE_CUISINE_WEIGHT[tasteProfile.adventureLevel] || 0.5;
        score += (1 - adventureWeight) * 8; // More adventurous = more points for unknown cuisines
        if (tasteProfile.adventureLevel === 'always') {
          matchFactors.push('New cuisine to explore');
        }
      }
    }

    // 2. Price range match (0-15 points)
    if (candidate.priceRange) {
      const targetPrice = tasteProfile?.pricePreference || avgPrice;
      const priceDiff = Math.abs(candidate.priceRange - targetPrice);
      if (priceDiff === 0) {
        score += 15;
        matchFactors.push('Perfect price range');
      } else if (priceDiff <= 1) {
        score += 8;
      } else {
        score -= 5;
      }

      // Vibe-price alignment
      if (tasteProfile?.diningVibe) {
        const vibeRanges = VIBE_PRICE_MAP[tasteProfile.diningVibe] || [1, 2, 3];
        if (vibeRanges.includes(candidate.priceRange)) {
          score += 5;
          matchFactors.push(`Fits your ${tasteProfile.diningVibe.replace('_', ' ')} style`);
        }
      }
    }

    // 3. Google rating quality (0-10 points)
    if (candidate.rating) {
      if (candidate.rating >= 4.5) {
        score += 10;
        matchFactors.push('Highly rated');
      } else if (candidate.rating >= 4.0) {
        score += 7;
      } else if (candidate.rating >= 3.5) {
        score += 3;
      } else {
        score -= 5;
      }
    }

    // 4. Friend endorsements (0-15 points)
    if (candidate.friendRatingCount && candidate.friendRatingCount > 0) {
      score += Math.min(15, candidate.friendRatingCount * 5);
      if (candidate.friendAvgRating && candidate.friendAvgRating >= 7) {
        matchFactors.push(`Loved by ${candidate.friendRatingCount} friend${candidate.friendRatingCount > 1 ? 's' : ''}`);
      }
    }

    // 5. Expert endorsed (0-10 points)
    if (candidate.expertEndorsed) {
      score += 10;
      matchFactors.push('Expert recommended');
    }

    // 6. Location familiarity (0-8 points)
    if (candidate.city && ratedCities[candidate.city]) {
      score += Math.min(8, ratedCities[candidate.city] * 2);
      matchFactors.push(`In ${candidate.city}, a city you know`);
    }

    // 7. Currently open bonus (0-3 points)
    if (candidate.isOpen) {
      score += 3;
      matchFactors.push('Open now');
    }

    // 8. Priority alignment from taste profile (0-7 points)
    if (tasteProfile?.priorities) {
      if (tasteProfile.priorities.includes('food_quality') && candidate.rating && candidate.rating >= 4.3) {
        score += 4;
      }
      if (tasteProfile.priorities.includes('value') && candidate.priceRange && candidate.priceRange <= 2) {
        score += 3;
      }
    }

    // Normalize to 0-99
    const normalizedScore = Math.max(1, Math.min(99, Math.round(score)));

    return {
      ...candidate,
      confidenceScore: normalizedScore,
      matchFactors: matchFactors.slice(0, 3), // Top 3 factors
    };
  });

  // Sort by confidence score descending
  return scored.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function getDefaultTasteProfile(): TasteProfile {
  return {
    diningVibe: 'casual',
    adventureLevel: 'sometimes',
    spiceTolerance: 'medium',
    pricePreference: 2,
    favoriteCuisines: [],
    priorities: ['food_quality'],
    dietaryImportance: 'somewhat',
    diningOccasion: 'weeknight_dinner',
  };
}
