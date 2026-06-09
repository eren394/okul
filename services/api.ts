import { Criterion, Alternative, UserProfile } from '../types';

const createJsonRequest = async (path: string, body: object) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
};

export const postSensitivityAnalysis = async (criteria: Criterion[], alternatives: Alternative[]) =>
  createJsonRequest('/api/analysis/sensitivity', { criteria, alternatives });

export const postParetoAnalysis = async (criteria: Criterion[], alternatives: Alternative[], xCriterionId: string, yCriterionId: string) =>
  createJsonRequest('/api/analysis/pareto', { criteria, alternatives, xCriterionId, yCriterionId });

export const postTeamConsensus = async (criteria: Criterion[], alternatives: Alternative[], profiles: UserProfile[]) =>
  createJsonRequest('/api/analysis/team', { criteria, alternatives, profiles });

export const postExplanation = async (criteria: Criterion[], alternatives: Alternative[], results: any) =>
  createJsonRequest('/api/analysis/explain', { criteria, alternatives, results });
