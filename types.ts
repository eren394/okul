
export interface Criterion {
  id: string;
  parentId?: string;
  name: string;
  weight: number; // 0 to 1
  isBenefit: boolean; // true for 'higher is better', false for 'lower is better'
  unit: string;
  description: string;
  active?: boolean;
}

export interface Alternative {
  id: string;
  name: string;
  scores: Record<string, number>; // criterionId -> numerical value
}

export interface RankingResult {
  alternativeId: string;
  name: string;
  totalScore: number;
  rank: number;
}

export type DistributionType = 'uniform' | 'normal';

export interface MonteCarloSeries {
  alternativeId: string;
  name: string;
  values: number[];
  average: number;
  stddev: number;
  best: number;
  worst: number;
}

export interface MonteCarloBin {
  bucket: string;
  counts: Record<string, number>;
}

export interface MonteCarloOutput {
  items: MonteCarloSeries[];
  histogram: MonteCarloBin[];
  winProbability: Record<string, number>;
}

export interface SensitivityImpact {
  criterionId: string;
  name: string;
  unit?: string;
  currentWeight: number;
  impactScore: number;
  thresholdToChangeLeader: number | null;
  nextLeader?: string;
  note: string;
}

export interface SensitivityResult {
  baselineWinner: string;
  currentWinner: string;
  impacts: SensitivityImpact[];
  warning?: string;
}

export interface ParetoPoint {
  alternativeId: string;
  name: string;
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  isParetoOptimal: boolean;
  details: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  weights: Record<string, number>;
}

export interface TeamConsensus {
  consensusWeights: Record<string, number>;
  consensusRanking: RankingResult[];
  agreementScore: number;
  conflictMatrix: Record<string, Record<string, number>>;
  consensusWinner: string;
}

export interface ExplanationCard {
  title: string;
  content: string;
  accent: 'positive' | 'neutral' | 'warning';
}

export interface ExplanationResult {
  summary: string;
  confidence: number;
  topCriteria: Array<{ name: string; contribution: number }>;
  negativeFactors: Array<{ name: string; effect: string }>;
  cards: ExplanationCard[];
}

export interface DecisionState {
  criteria: Criterion[];
  alternatives: Alternative[];
  results: RankingResult[];
}
