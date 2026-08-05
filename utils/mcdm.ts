
import { Criterion, Alternative, RankingResult } from '../types';

/**
 * Normalizes scores and calculates weighted sum
 */
export const buildSimplexObjective = (criteria: Criterion[]) => {
  const activeCriteria = criteria.filter((criterion) => criterion.active !== false);
  if (activeCriteria.length === 0) return 'Simplex amaç fonksiyonu: maximize 0';

  const totalWeight = activeCriteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  const normalizedCriteria = activeCriteria.map((criterion) => ({
    ...criterion,
    weight: criterion.weight / totalWeight,
  }));

  const terms = normalizedCriteria.map((criterion) => {
    const coefficient = Number((criterion.weight * 100).toFixed(1));
    return `${coefficient}%·${criterion.name}`;
  });

  return `Simplex amaç fonksiyonu: maximize ${terms.join(' + ')}`;
};

export const calculateRankings = (criteria: Criterion[], alternatives: Alternative[]): RankingResult[] => {
  if (alternatives.length === 0) return [];

  const activeCriteria = criteria.filter((criterion) => criterion.active !== false);
  if (activeCriteria.length === 0) {
    return alternatives.map((alt, index) => ({ alternativeId: alt.id, name: alt.name, totalScore: 0, rank: index + 1 }));
  }

  const totalWeight = activeCriteria.reduce((sum, criterion) => sum + criterion.weight, 0) || 1;
  const normalizedWeights = activeCriteria.map((criterion) => ({ ...criterion, weight: criterion.weight / totalWeight }));

  // Step 1: Find min/max for each criterion for normalization
  const bounds: Record<string, { min: number; max: number }> = {};
  normalizedWeights.forEach((c) => {
    const values = alternatives.map((a) => a.scores[c.id]);
    bounds[c.id] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });

  // Step 2: Calculate Weighted Score for each alternative
  const results: RankingResult[] = alternatives.map((alt) => {
    let totalScore = 0;

    normalizedWeights.forEach((c) => {
      const val = alt.scores[c.id] ?? 0;
      const { min, max } = bounds[c.id];
      
      let normalized = 0;
      if (max !== min) {
        if (c.isBenefit) {
          normalized = (val - min) / (max - min);
        } else {
          normalized = (max - val) / (max - min);
        }
      } else {
        normalized = 1;
      }
      
      totalScore += normalized * c.weight;
    });

    return {
      alternativeId: alt.id,
      name: alt.name,
      totalScore: Number(totalScore.toFixed(4)),
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
