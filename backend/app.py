from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Literal, Dict, Any
import random
import math

DistributionType = Literal['uniform', 'normal']

app = FastAPI(title='DecisionMatrix Pro Monte Carlo API', version='0.2.0')

class Criterion(BaseModel):
    id: str
    name: str
    weight: float
    isBenefit: bool

class Alternative(BaseModel):
    id: str
    name: str
    scores: Dict[str, float]

class SimulationRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    firstAlternativeId: str
    secondAlternativeId: str
    iterations: int = 1000
    distribution: DistributionType = 'uniform'

class AlternativeSummary(BaseModel):
    alternativeId: str
    name: str
    average: float
    stddev: float
    best: float
    worst: float
    winProbability: float

class SimulationResponse(BaseModel):
    summaries: List[AlternativeSummary]
    histogram: List[Dict[str, Any]]
    distribution: DistributionType
    iterations: int

class SensitivityRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]

class ParetoRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    xCriterionId: str
    yCriterionId: str

class UserProfile(BaseModel):
    id: str
    name: str
    role: str
    weights: Dict[str, float]

class TeamRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    profiles: List[UserProfile]

class ExplanationRequest(BaseModel):
    criteria: List[Criterion]
    alternatives: List[Alternative]
    results: List[Dict[str, Any]]


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def sample_normal(mean: float, sd: float) -> float:
    u1 = random.random()
    u2 = random.random()
    z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
    return mean + z0 * sd


def sample_value(distribution: DistributionType, reference: float, min_value: float, max_value: float) -> float:
    if distribution == 'uniform':
        return random.uniform(min_value, max_value)
    sd = max((max_value - min_value) / 6.0, 1.0)
    return clamp(sample_normal(reference, sd), min_value, max_value)


def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    total = sum(weights.values()) or 1.0
    return {key: value / total for key, value in weights.items()}


def calculate_rankings(criteria: List[Criterion], alternatives: List[Alternative]) -> List[Dict[str, Any]]:
    bounds = {
        criterion.id: {
            'min': min(alt.scores[criterion.id] for alt in alternatives),
            'max': max(alt.scores[criterion.id] for alt in alternatives),
        }
        for criterion in criteria
    }

    results = []
    for alt in alternatives:
        total_score = 0.0
        for criterion in criteria:
            min_value = bounds[criterion.id]['min']
            max_value = bounds[criterion.id]['max']
            raw = alt.scores[criterion.id]
            if max_value != min_value:
                normalized = (raw - min_value) / (max_value - min_value)
            else:
                normalized = 1.0
            if not criterion.isBenefit:
                normalized = 1.0 - normalized
            total_score += normalized * criterion.weight
        results.append({
            'alternativeId': alt.id,
            'name': alt.name,
            'totalScore': total_score,
        })

    sorted_results = sorted(results, key=lambda item: item['totalScore'], reverse=True)
    for index, item in enumerate(sorted_results, start=1):
        item['rank'] = index
    return sorted_results


def build_histogram(series: List[Dict[str, Any]], iterations: int) -> List[Dict[str, Any]]:
    if len(series) != 2:
        return []
    combined = [value for item in series for value in item['values']]
    min_score = min(combined)
    max_score = max(combined)
    bins = 12
    width = (max_score - min_score) / bins if max_score > min_score else 1.0
    histogram = [
        {
            'bucket': f'{(min_score + i * width):.2f} - {(min_score + (i + 1) * width):.2f}',
            series[0]['alternativeId']: 0,
            series[1]['alternativeId']: 0,
        }
        for i in range(bins)
    ]

    for item in series:
        for value in item['values']:
            index = min(bins - 1, int((value - min_score) / width))
            histogram[index][item['alternativeId']] += 1
    return histogram


def compute_alternative_series(criteria: List[Criterion], alternatives: List[Alternative], distribution: DistributionType, iterations: int) -> List[Dict[str, Any]]:
    bounds = {
        criterion.id: {
            'min': min(alt.scores[criterion.id] for alt in alternatives),
            'max': max(alt.scores[criterion.id] for alt in alternatives),
        }
        for criterion in criteria
    }

    series = []
    for alt in alternatives:
        values = []
        for _ in range(iterations):
            score = 0.0
            for criterion in criteria:
                min_value = bounds[criterion.id]['min']
                max_value = bounds[criterion.id]['max']
                sample = sample_value(distribution, alt.scores[criterion.id], min_value, max_value)
                normalized = (sample - min_value) / (max_value - min_value) if max_value != min_value else 1.0
                if not criterion.isBenefit:
                    normalized = 1.0 - normalized
                score += normalized * criterion.weight
            values.append(score)
        series.append({
            'alternativeId': alt.id,
            'name': alt.name,
            'values': values,
        })
    return series


def simulate(request: SimulationRequest) -> SimulationResponse:
    selected = [alt for alt in request.alternatives if alt.id in {request.firstAlternativeId, request.secondAlternativeId}]
    series = compute_alternative_series(request.criteria, selected, request.distribution, request.iterations)

    histogram = build_histogram(series, request.iterations)
    if len(series) == 2:
        wins = {'first': 0, 'second': 0}
        for a, b in zip(series[0]['values'], series[1]['values']):
            if a > b:
                wins['first'] += 1
            elif a < b:
                wins['second'] += 1
        summaries = []
        for index, item in enumerate(series):
            values = item['values']
            summaries.append(AlternativeSummary(
                alternativeId=item['alternativeId'],
                name=item['name'],
                average=sum(values) / len(values),
                stddev=math.sqrt(sum((v - (sum(values) / len(values))) ** 2 for v in values) / len(values)),
                best=max(values),
                worst=min(values),
                winProbability=(wins['first'] / request.iterations * 100) if index == 0 else (wins['second'] / request.iterations * 100),
            ))
    else:
        summaries = []
        for item in series:
            values = item['values']
            summaries.append(AlternativeSummary(
                alternativeId=item['alternativeId'],
                name=item['name'],
                average=sum(values) / len(values),
                stddev=math.sqrt(sum((v - (sum(values) / len(values))) ** 2 for v in values) / len(values)),
                best=max(values),
                worst=min(values),
                winProbability=0.0,
            ))

    return SimulationResponse(
        summaries=summaries,
        histogram=histogram,
        distribution=request.distribution,
        iterations=request.iterations,
    )


@app.get('/health')
def health() -> Dict[str, str]:
    return {'status': 'ok', 'service': 'decisionmatrix-pro Monte Carlo'}


@app.post('/simulate', response_model=SimulationResponse)
def simulate_endpoint(request: SimulationRequest):
    return simulate(request)


@app.post('/analysis/sensitivity')
def sensitivity_endpoint(request: SensitivityRequest) -> Dict[str, Any]:
    baseline = calculate_rankings(request.criteria, request.alternatives)
    baseline_winner = baseline[0]['name'] if baseline else ''
    threshold_results = []
    for criterion in request.criteria:
        for weight in [0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.60]:
            adjusted = [
                Criterion(
                    id=other.id,
                    name=other.name,
                    weight=weight if other.id == criterion.id else other.weight * ((1 - weight) / (1 - criterion.weight if criterion.weight < 1 else 1)),
                    isBenefit=other.isBenefit,
                )
                for other in request.criteria
            ]
            adjusted = [Criterion(**{**other.dict(), 'weight': other.weight}) for other in adjusted]
            ranking = calculate_rankings(adjusted, request.alternatives)
            if ranking and ranking[0]['name'] != baseline_winner:
                threshold_results.append({
                    'criterion': criterion.name,
                    'threshold': weight,
                    'newLeader': ranking[0]['name'],
                })
                break
    return {
        'baselineWinner': baseline_winner,
        'thresholds': threshold_results,
    }


@app.post('/analysis/pareto')
def pareto_endpoint(request: ParetoRequest) -> Dict[str, Any]:
    x_criterion = next((c for c in request.criteria if c.id == request.xCriterionId), None)
    y_criterion = next((c for c in request.criteria if c.id == request.yCriterionId), None)
    if x_criterion is None or y_criterion is None:
        return {'points': []}

    def normalized(value: float, criterion: Criterion) -> float:
        return value if criterion.isBenefit else -value

    points = [
        {
            'alternativeId': alt.id,
            'name': alt.name,
            'x': alt.scores[x_criterion.id],
            'y': alt.scores[y_criterion.id],
            'details': f"{x_criterion.name}: {alt.scores[x_criterion.id]}, {y_criterion.name}: {alt.scores[y_criterion.id]}",
        }
        for alt in request.alternatives
    ]

    for point in points:
        point['isParetoOptimal'] = not any(
            other['alternativeId'] != point['alternativeId'] and
            normalized(other['x'], x_criterion) >= normalized(point['x'], x_criterion) and
            normalized(other['y'], y_criterion) >= normalized(point['y'], y_criterion) and
            (normalized(other['x'], x_criterion) > normalized(point['x'], x_criterion) or normalized(other['y'], y_criterion) > normalized(point['y'], y_criterion))
            for other in points
        )

    return {'points': points}


@app.post('/analysis/team')
def team_endpoint(request: TeamRequest) -> Dict[str, Any]:
    def profile_ranking(profile: UserProfile) -> List[Dict[str, Any]]:
        normalized_weights = normalize_weights(profile.weights)
        adjusted_criteria = [Criterion(id=c.id, name=c.name, weight=normalized_weights.get(c.id, 0.0), isBenefit=c.isBenefit) for c in request.criteria]
        return calculate_rankings(adjusted_criteria, request.alternatives)

    profiles = [
        {
            'profile': profile.name,
            'role': profile.role,
            'ranking': profile_ranking(profile),
        }
        for profile in request.profiles
    ]

    consensus_weights = normalize_weights({
        c.id: sum(profile.weights.get(c.id, 0) for profile in request.profiles) / max(len(request.profiles), 1)
        for c in request.criteria
    })

    consensus_criteria = [Criterion(id=c.id, name=c.name, weight=consensus_weights[c.id], isBenefit=c.isBenefit) for c in request.criteria]
    consensus_ranking = calculate_rankings(consensus_criteria, request.alternatives)

    matrix = {}
    for left in request.profiles:
        matrix[left.id] = {}
        left_ranking = profile_ranking(left)
        for right in request.profiles:
            if left.id == right.id:
                matrix[left.id][right.id] = 100
            else:
                right_ranking = profile_ranking(right)
                avg_diff = sum(
                    abs(
                        next(item['rank'] for item in left_ranking if item['alternativeId'] == alt.id) -
                        next(item['rank'] for item in right_ranking if item['alternativeId'] == alt.id)
                    )
                    for alt in request.alternatives
                ) / len(request.alternatives)
                matrix[left.id][right.id] = max(0, 100 - avg_diff * 20)

    return {
        'profiles': profiles,
        'consensus': {
            'weights': consensus_weights,
            'ranking': consensus_ranking,
            'agreementScore': max(0, min(100, 100 - sum((100 - matrix[a.id][b.id]) for a in request.profiles for b in request.profiles if a.id != b.id) / max(len(request.profiles) * (len(request.profiles) - 1), 1))),
        },
        'ConflictMatrix': matrix,
    }


@app.post('/analysis/explain')
def explain_endpoint(request: ExplanationRequest) -> Dict[str, Any]:
    winner = next((item for item in request.results if item.get('rank') == 1), None)
    runner = next((item for item in request.results if item.get('rank') == 2), None)
    if winner is None:
        return {'summary': 'Verilen sonuçlarla açıklama üretilemedi.', 'confidence': 45}

    contributions = sorted(
        [
            {
                'name': criterion.name,
                'impact': criterion.weight,
            }
            for criterion in request.criteria
        ],
        key=lambda item: item['impact'],
        reverse=True,
    )[:3]

    summary = f"Alternatif {winner.get('name')} lider oldu çünkü {', '.join(item['name'] for item in contributions[:2])} gibi en etkili kriterlerde güçlü kaldı."
    if runner:
        summary += f" Alternatif {runner.get('name')} ise ikinci sırada yer aldı." 

    confidence = min(95, max(50, int((float(winner.get('totalScore', 0)) - float(runner.get('totalScore', 0) if runner else 0)) * 100)))
    return {
        'summary': summary,
        'confidence': confidence,
        'topCriteria': contributions,
    }
