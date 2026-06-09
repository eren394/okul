
import { Criterion, Alternative, RankingResult } from '../types';

/**
 * Normalizes scores and calculates weighted sum
 */
export const calculateRankings = (criteria: Criterion[], alternatives: Alternative[]): RankingResult[] => {
  if (alternatives.length === 0) return [];

  // Step 1: Find min/max for each criterion for normalization
  const bounds: Record<string, { min: number; max: number }> = {};
  criteria.forEach((c) => {
    const values = alternatives.map((a) => a.scores[c.id]);
    bounds[c.id] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Step 2: Calculate Weighted Score for each alternative
  const results: RankingResult[] = alternatives.map((alt) => {
    let totalScore = 0;

    criteria.forEach((c) => {
      const val = alt.scores[c.id];
      const { min, max } = bounds[c.id];
      
      let normalized = 0;
      if (max !== min) {
        if (c.isBenefit) {
          // Benefit criterion (higher is better): (x - min) / (max - min)
          normalized = (val - min) / (max - min);
        } else {
          // Cost criterion (lower is better): (max - x) / (max - min)
          normalized = (max - val) / (max - min);
        }
      } else {
        // If all alternatives have same score for this criterion
        normalized = 1;
      }
      
      totalScore += normalized * c.weight;
    });

    return {
      alternativeId: alt.id,
      name: alt.name,
      totalScore: totalScore,
      rank: 0,
    };
  });

  // Step 3: Sort by score and assign ranks
  const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((res, index) => ({
    ...res,
    rank: index + 1,
  }));
};
