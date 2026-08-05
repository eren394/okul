import { Alternative, Criterion, DistributionType, MonteCarloBin, MonteCarloOutput } from '../types';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const sampleUniform = (min: number, max: number): number => min + Math.random() * (max - min);

const sampleNormal = (mean: number, sd: number): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * sd;
};

const sampleValue = (distribution: DistributionType, baseValue: number, min: number, max: number): number => {
  if (distribution === 'uniform') {
    return sampleUniform(min, max);
  }
  const sd = Math.max((max - min) / 6, 1);
  return clamp(sampleNormal(baseValue, sd), min, max);
};

const calculateMean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const calculateStdDev = (values: number[], mean: number): number => {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const createBins = (min: number, max: number, count: number): MonteCarloBin[] => {
  const width = (max - min) / count;
  return Array.from({ length: count }, (_, index) => {
    const from = min + index * width;
    const to = from + width;
    return {
      bucket: `${from.toFixed(2)} - ${to.toFixed(2)}`,
      counts: {},
    };
  });
};

export const simulateMonteCarlo = (
  criteria: Criterion[],
  alternatives: Alternative[],
  selectedAlternativeIds: [string, string],
  iterations: number,
  distribution: DistributionType,
  histogramBins = 12
): MonteCarloOutput => {
  const selected = selectedAlternativeIds
    .map((id) => alternatives.find((alt) => alt.id === id))
    .filter((alt): alt is Alternative => typeof alt !== 'undefined');

  if (selected.length < 2 || iterations <= 0 || histogramBins <= 0) {
    return {
      items: [],
      histogram: [],
      winProbability: {},
    };
  }

  const bounds = criteria.reduce<Record<string, { min: number; max: number }>>((acc, criterion) => {
    const values = alternatives.map((alt) => alt.scores[criterion.id] ?? 0);
    acc[criterion.id] = {
      min: Math.min(...values),
      max: Math.max(...values),
    };
    return acc;
  }, {});

  const series = selected.map((alternative) => {
    const values: number[] = [];
    for (let i = 0; i < iterations; i += 1) {
      const score = criteria.reduce((sum, criterion) => {
        const { min, max } = bounds[criterion.id];
        const sample = sampleValue(distribution, alternative.scores[criterion.id], min, max);
        const normalized = max !== min
          ? criterion.isBenefit
            ? (sample - min) / (max - min)
            : (max - sample) / (max - min)
          : 1;
        return sum + normalized * criterion.weight;
      }, 0);
      values.push(score);
    }

    const average = calculateMean(values);
    const stddev = calculateStdDev(values, average);
    return {
      alternativeId: alternative.id,
      name: alternative.name,
      values,
      average,
      stddev,
      best: Math.max(...values),
      worst: Math.min(...values),
    };
  });

  const allValues = series.flatMap((item) => item.values);
  if (allValues.length === 0) {
    return {
      items: series,
      histogram: [],
      winProbability: {},
    };
  }

  const globalMin = Math.min(...allValues);
  const globalMax = Math.max(...allValues);
  const bins = createBins(globalMin, globalMax, histogramBins);

  bins.forEach((bin) => {
    bin.counts = bin.counts ?? {};
    series.forEach((item) => {
      bin.counts[item.alternativeId] = 0;
    });
  });

  series.forEach((item) => {
    item.values.forEach((value) => {
      const rawIndex = Math.floor(((value - globalMin) / (globalMax - globalMin || 1)) * histogramBins);
      const binIndex = Math.max(0, Math.min(histogramBins - 1, rawIndex));
      const bin = bins[binIndex];
      if (!bin) return;
      bin.counts = bin.counts ?? {};
      bin.counts[item.alternativeId] = (bin.counts[item.alternativeId] ?? 0) + 1;
    });
  });

  const winProbability: Record<string, number> = {};
  if (series.length === 2) {
    const [first, second] = series;
    const wins = first.values.reduce((acc, value, index) => {
      const other = second.values[index];
      if (value > other) return { first: acc.first + 1, second: acc.second };
      if (value < other) return { first: acc.first, second: acc.second + 1 };
      return acc;
    }, { first: 0, second: 0 });

    winProbability[first.alternativeId] = (wins.first / iterations) * 100;
    winProbability[second.alternativeId] = (wins.second / iterations) * 100;
  }

  return {
    items: series,
    histogram: bins.map((bin) => ({ bucket: bin.bucket, counts: bin.counts })),
    winProbability,
  };
};

export const buildMonteCarloInsight = (
  first: { alternativeId: string; name: string; average: number; stddev: number },
  second: { alternativeId: string; name: string; average: number; stddev: number },
  winProbability: Record<string, number>
): string => {
  const higherMean = first.average >= second.average ? first : second;
  const moreStable = first.stddev <= second.stddev ? first : second;
  const volatilityRemark = higherMean.alternativeId === moreStable.alternativeId
    ? 'Bu alternatif aynı zamanda daha dengeli sonuçlar üretiyor.'
    : `Alternatif ${higherMean.name} daha yüksek ortalama skor sunuyor ancak ${moreStable.name} daha stabil bir dağılım sağlıyor.`;
  const firstWin = winProbability[first.alternativeId] ?? 0;
  const secondWin = winProbability[second.alternativeId] ?? 0;
  const leading = firstWin > secondWin ? first.name : second.name;
  const leadingProb = Math.max(firstWin, secondWin).toFixed(0);

  return `Alternatif ${higherMean.name} ortalama itibarıyla önde. ${volatilityRemark} ${leading} için kazanma olasılığı yaklaşık ${leadingProb}% civarında.`;
};
