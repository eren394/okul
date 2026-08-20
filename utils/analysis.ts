import { Alternative, Criterion, RankingResult, SensitivityResult, SensitivityImpact, ParetoPoint, UserProfile, TeamConsensus, ExplanationResult } from '../types';
import { calculateRankings } from './mcdm';

const getActiveCriteria = (criteria: Criterion[]) => criteria.filter((criterion) => criterion.active !== false);

const normalizeWeights = (criteria: Criterion[]): Criterion[] => {
  const total = criteria.reduce((sum, item) => sum + item.weight, 0) || 1;
  return criteria.map((item) => ({ ...item, weight: item.weight / total }));
};

const getUnitSensitivityFactor = (criterion: Criterion): number => {
  const unit = criterion.unit.toLowerCase();
  if (['$', 'usd', 'tl', 'eur', 'cost', 'gün', 'day', 'days', 'kwh', 'kw', 'w', 'mwh'].some((token) => unit.includes(token))) {
    return 1.4;
  }
  if (['esg', 'score', 'puan', '1-100', '1-10', '%', 'rating'].some((token) => unit.includes(token))) {
    return 1.15;
  }
  return 1.05;
};

const adjustWeights = (criteria: Criterion[], criterionId: string, targetWeight: number): Criterion[] => {
  const baseline = criteria.find((item) => item.id === criterionId);
  if (!baseline) return criteria;

  const remainingWeight = 1 - targetWeight;
  const otherSum = criteria.reduce((sum, item) => item.id === criterionId ? sum : sum + item.weight, 0) || 1;

  return criteria.map((item) => {
    if (item.id === criterionId) {
      return { ...item, weight: targetWeight };
    }
    return {
      ...item,
      weight: item.weight * (remainingWeight / otherSum),
    };
  });
};

const buildBaselineRankMap = (criteria: Criterion[], alternatives: Alternative[]) => {
  const activeCriteria = getActiveCriteria(criteria);
  const normalized = normalizeWeights(activeCriteria);
  const ranked = calculateRankings(normalized, alternatives);
  return new Map(ranked.map((result) => [result.alternativeId, result.rank]));
};

const computeImpactForCriterion = (
  criteria: Criterion[],
  alternatives: Alternative[],
  criterionId: string,
  baselineWinner: string,
  baselineRankMap: Map<string, number>
): SensitivityImpact => {
  const weightSteps = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 0.60];
  const baselineWeight = criteria.find((item) => item.id === criterionId)?.weight ?? 0;
  const variations = weightSteps.map((weight) => {
    const adjusted = adjustWeights(criteria, criterionId, weight);
    const results = calculateRankings(adjusted, alternatives);
    return {
      weight,
      winner: results[0]?.alternativeId ?? '',
      averageRankDelta: results.reduce((acc, result) => {
        const baseRank = baselineRankMap.get(result.alternativeId) ?? result.rank;
        return acc + Math.abs(result.rank - baseRank);
      }, 0) / results.length,
    };
  });

  const impactScore = Math.max(...variations.map((item) => item.averageRankDelta)) * 100;
  const thresholdChange = variations.find((variant) => variant.winner !== baselineWinner);
  const criterion = criteria.find((item) => item.id === criterionId);
  const unitFactor = criterion ? getUnitSensitivityFactor(criterion) : 1;

  return {
    criterionId,
    name: criterion?.name ?? criterionId,
    unit: criterion?.unit,
    currentWeight: baselineWeight,
    impactScore: parseFloat((impactScore * unitFactor).toFixed(1)),
    thresholdToChangeLeader: thresholdChange ? thresholdChange.weight : null,
    nextLeader: thresholdChange ? thresholdChange.winner : undefined,
    note: thresholdChange
      ? `${thresholdChange.weight * 100}% üstü değeriyle lider değişebilir. Birim etkisi (${criterion?.unit ?? '—'}) nedeniyle karar duyarlılığı arttı.`
      : `Mevcut aralıkta lider değişmiyor. Birim etkisi (${criterion?.unit ?? '—'}) kararın güvenini artırıyor.`,
  };
};

export const analyzeSensitivity = (criteria: Criterion[], alternatives: Alternative[]): SensitivityResult => {
  const activeCriteria = getActiveCriteria(criteria);
  const normalizedCriteria = normalizeWeights(activeCriteria);
  const baselineRanking = calculateRankings(normalizedCriteria, alternatives);
  const baselineWinner = baselineRanking[0]?.alternativeId ?? '';
  const baselineRankMap = new Map(baselineRanking.map((result) => [result.alternativeId, result.rank]));

  const impacts = activeCriteria.map((criterion) =>
    computeImpactForCriterion(normalizedCriteria, alternatives, criterion.id, baselineWinner, baselineRankMap)
  );

  const currentWinner = baselineWinner;
  const warning = impacts
    .filter((impact) => impact.thresholdToChangeLeader !== null)
    .map((impact) => `${impact.name} %${impact.thresholdToChangeLeader! * 100} eşiğinde lider değişimi tetikleyebilir.`)
    .join(' ');

  return {
    baselineWinner,
    currentWinner,
    impacts,
    warning: warning || 'Kritik eşik analizi hazırlandı.',
  };
};

export const computeParetoFront = (
  criteria: Criterion[],
  alternatives: Alternative[],
  xCriterionId: string,
  yCriterionId: string
): ParetoPoint[] => {
  const activeCriteria = getActiveCriteria(criteria);
  const xCriterion = activeCriteria.find((c) => c.id === xCriterionId);
  const yCriterion = activeCriteria.find((c) => c.id === yCriterionId);
  if (!xCriterion || !yCriterion) return [];

  const normalizeValue = (value: number, criterion: Criterion): number =>
    criterion.isBenefit ? value : -value;

  const points = alternatives.map((alt) => ({
    alternativeId: alt.id,
    name: alt.name,
    x: alt.scores[xCriterionId],
    y: alt.scores[yCriterionId],
    xLabel: xCriterion.name,
    yLabel: yCriterion.name,
    normalizedX: normalizeValue(alt.scores[xCriterionId], xCriterion),
    normalizedY: normalizeValue(alt.scores[yCriterionId], yCriterion),
    isParetoOptimal: true,
    details: `${xCriterion.name}: ${alt.scores[xCriterionId]} · ${yCriterion.name}: ${alt.scores[yCriterionId]}`,
  })) as Array<ParetoPoint & { normalizedX: number; normalizedY: number }>;

  points.forEach((point) => {
    point.isParetoOptimal = !points.some((other) => {
      if (other.alternativeId === point.alternativeId) return false;
      const betterOrEqualX = other.normalizedX >= point.normalizedX;
      const betterOrEqualY = other.normalizedY >= point.normalizedY;
      const strictlyBetter = other.normalizedX > point.normalizedX || other.normalizedY > point.normalizedY;
      return betterOrEqualX && betterOrEqualY && strictlyBetter;
    });
  });

  return points.map(({ normalizedX, normalizedY, ...rest }) => rest);
};

const buildProfileCriteria = (criteria: Criterion[], weights: Record<string, number>): Criterion[] =>
  getActiveCriteria(criteria).map((criterion) => ({
    ...criterion,
    weight: weights[criterion.id] ?? 0,
  }));

const normalizeProfileWeights = (weights: Record<string, number>): Record<string, number> => {
  const sum = Object.values(weights).reduce((acc, value) => acc + value, 0) || 1;
  return Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, value / sum])
  );
};

export const buildTeamConsensus = (
  criteria: Criterion[],
  alternatives: Alternative[],
  profiles: UserProfile[]
): TeamConsensus => {
  const activeCriteria = getActiveCriteria(criteria);
  const profileRankings = profiles.map((profile) => {
    const profileCriteria = normalizeWeights(buildProfileCriteria(activeCriteria, normalizeProfileWeights(profile.weights)));
    return {
      profile,
      ranking: calculateRankings(profileCriteria, alternatives),
    };
  });

  const consensusWeights = normalizeProfileWeights(
    activeCriteria.reduce((acc, criterion) => {
      const average = profiles.reduce((sum, profile) => sum + (profile.weights[criterion.id] ?? 0), 0) / profiles.length;
      acc[criterion.id] = average;
      return acc;
    }, {} as Record<string, number>)
  );

  const consensusCriteria = normalizeWeights(buildProfileCriteria(activeCriteria, consensusWeights));
  const consensusRanking = calculateRankings(consensusCriteria, alternatives);
  const consensusWinner = consensusRanking[0]?.name ?? '';

  const conflictMatrix: Record<string, Record<string, number>> = {};
  profiles.forEach((left) => {
    conflictMatrix[left.id] = {};
    profiles.forEach((right) => {
      if (left.id === right.id) {
        conflictMatrix[left.id][right.id] = 100;
        return;
      }
      const leftRanking = profileRankings.find((item) => item.profile.id === left.id)?.ranking ?? [];
      const rightRanking = profileRankings.find((item) => item.profile.id === right.id)?.ranking ?? [];
      const avgDiff = alternatives.reduce((acc, alt) => {
        const leftRank = leftRanking.find((item) => item.alternativeId === alt.id)?.rank ?? 0;
        const rightRank = rightRanking.find((item) => item.alternativeId === alt.id)?.rank ?? 0;
        return acc + Math.abs(leftRank - rightRank);
      }, 0) / alternatives.length;
      conflictMatrix[left.id][right.id] = Math.max(0, 100 - avgDiff * 20);
    });
  });

  const averageConflict = profiles.reduce((acc, left) => {
    profiles.forEach((right) => {
      if (left.id !== right.id) acc += 100 - conflictMatrix[left.id][right.id];
    });
    return acc;
  }, 0) / Math.max(profiles.length * (profiles.length - 1), 1);

  return {
    consensusWeights,
    consensusRanking,
    agreementScore: Math.max(0, Math.min(100, 100 - averageConflict / Math.max(profiles.length - 1, 1))),
    conflictMatrix,
    consensusWinner,
  };
};

export const buildExplanation = (
  criteria: Criterion[],
  alternatives: Alternative[],
  results: RankingResult[]
): ExplanationResult => {
  const activeCriteria = getActiveCriteria(criteria);
  const winner = results[0];
  const runnerUp = results[1];
  const totalScoreGap = results.length > 1 ? Math.abs(winner.totalScore - runnerUp.totalScore) : winner.totalScore;
  const confidence = Math.min(98, Math.max(55, totalScoreGap * 100));

  const contributions = activeCriteria.map((criterion) => {
    const raw = alternatives.find((alt) => alt.id === winner.alternativeId)?.scores[criterion.id] ?? 0;
    const unitFactor = getUnitSensitivityFactor(criterion);
    const normalized = criterion.isBenefit ? raw : (1 / (raw + 1));
    return {
      name: criterion.name,
      unit: criterion.unit,
      contribution: normalized * criterion.weight * unitFactor,
    };
  });

  const topCriteria = contributions
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((item) => ({ name: item.name, contribution: parseFloat(item.contribution.toFixed(3)) }));

  const negativeFactors = activeCriteria
    .filter((criterion) => !criterion.isBenefit)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((criterion) => ({
      name: criterion.name,
      effect: `Ağırlığı ${Math.round(criterion.weight * 100)}% olduğu için maliyet/süre etkisi artıyor.`,
    }));

  const summary = `Alternatif ${winner.name} öne çıktı çünkü ${topCriteria
    .map((item) => `${item.name} (${item.unit ?? 'birim'} ile ölçülen etki)`)
    .join(', ')} gibi kriterlerde güçlü performans sergiledi. ${runnerUp ? `Alternatif ${runnerUp.name} ise ${runnerUp.totalScore < winner.totalScore ? 'daha düşük' : 'benzer'} toplam puan alarak ikinci sırada yer aldı.` : ''}`;

  return {
    summary,
    confidence: Math.round(confidence),
    topCriteria,
    negativeFactors,
    cards: [
      {
        title: 'En etkili kriterler',
        content: `${topCriteria.map((item) => `${item.name} (${item.contribution.toFixed(3)})`).join(', ')}`,
        accent: 'positive',
      },
      {
        title: 'Riskli faktörler',
        content: negativeFactors.map((item) => item.effect).join(' '),
        accent: 'warning',
      },
      {
        title: 'Karar güveni',
        content: `${Math.round(confidence)}%`,
        accent: 'neutral',
      },
    ],
  };
};
