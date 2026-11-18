export type NodeKind = 'actor' | 'flow' | 'stock' | 'feedback';
export type ScenarioId = 'upi' | 'fx' | 'sgd' | 'wiki';

export interface Scenario {
  id: ScenarioId;
  label: string;
  prompt: string;
  throughputUnit: string;
  throughputLabel: string;
  demand: number;
  capacity: number;
  baseLatency: number;
  queuePenalty: number;
  shockLoss: number;
  nodes: Array<{ label: string; kind: NodeKind }>;
  matches: RegExp;
}

export const scenarios: Scenario[] = [
  {
    id: 'upi',
    label: 'UPIShield',
    prompt: 'Simulate 5M+ UPI transactions through UPIShield to isolate mule account rings and export LightGBM features.',
    throughputUnit: 'tx/s',
    throughputLabel: 'Transaction rate',
    demand: 22_000,
    capacity: 29_000,
    baseLatency: 2.8,
    queuePenalty: 11,
    shockLoss: 0.47,
    nodes: [
      { label: 'UPI transfers', kind: 'actor' },
      { label: 'Go ingestion', kind: 'flow' },
      { label: 'Redis graph', kind: 'stock' },
      { label: 'LightGBM', kind: 'flow' },
      { label: 'Ring alerts', kind: 'feedback' },
    ],
    matches: /upishield|\bupi\b|lightgbm|\bmule\b|transaction/i,
  },
  {
    id: 'fx',
    label: 'fx_router',
    prompt: 'Simulate multi-path cross-border currency routing across live ECB & Coinbase Spot spreads using Bellman-Ford.',
    throughputUnit: 'routes/s',
    throughputLabel: 'Route evaluation rate',
    demand: 3_700,
    capacity: 5_100,
    baseLatency: 4.6,
    queuePenalty: 15,
    shockLoss: 0.6,
    nodes: [
      { label: 'Rate feeds', kind: 'actor' },
      { label: 'Normalize', kind: 'flow' },
      { label: 'Price graph', kind: 'stock' },
      { label: 'Bellman–Ford', kind: 'flow' },
      { label: 'Quote refresh', kind: 'feedback' },
    ],
    matches: /fx_router|\bfx\b|\becb\b|opener|frankfurter|coinbase|bellman[-– ]ford|arbitrage|currency/i,
  },
  {
    id: 'sgd',
    label: 'Online SGD',
    prompt: 'Simulate streaming Online Stochastic Gradient Descent adapting to adversarial user input in real time.',
    throughputUnit: 'updates/s',
    throughputLabel: 'Weight update rate',
    demand: 18_000,
    capacity: 24_000,
    baseLatency: 0.42,
    queuePenalty: 1.8,
    shockLoss: 0.26,
    nodes: [
      { label: 'User actions', kind: 'actor' },
      { label: 'Predict', kind: 'flow' },
      { label: 'Live weights', kind: 'stock' },
      { label: 'Online SGD', kind: 'flow' },
      { label: 'Prediction loss', kind: 'feedback' },
    ],
    matches: /\bsgd\b|gradient descent|logistic|mind[- ]reader|adversarial/i,
  },
  {
    id: 'wiki',
    label: 'WikiGuard',
    prompt: 'Simulate WikiGuard tracking high-frequency live Wikipedia edit streams with custom glassmorphic telemetry.',
    throughputUnit: 'edits/s',
    throughputLabel: 'Edit processing rate',
    demand: 800,
    capacity: 1_090,
    baseLatency: 7.2,
    queuePenalty: 25,
    shockLoss: 0.57,
    nodes: [
      { label: 'Wiki edits', kind: 'actor' },
      { label: 'Stream parse', kind: 'flow' },
      { label: 'Live counters', kind: 'stock' },
      { label: 'Telemetry', kind: 'flow' },
      { label: 'Rate monitor', kind: 'feedback' },
    ],
    matches: /wikiguard|wikipedia|\bedits?\b|wikimedia/i,
  },
];

export const sampleCount = 2_048;

const percentiles = [
  { label: 'P5', caption: 'Peak velocity', quantile: 0.05, color: '#38bdf8' },
  { label: 'P50', caption: 'Median load', quantile: 0.50, color: '#10b981' },
  { label: 'P95', caption: 'Tail shock resilience', quantile: 0.95, color: '#f43f5e' },
] as const;

function generator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return (state + 1) / 4_294_967_297;
  };
}

function quantile(sorted: number[], probability: number) {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower);
}

export function recognizeScenario(prompt: string) {
  const explicit = scenarios.find(({ label }) => prompt.toLowerCase().includes(label.toLowerCase()));
  return explicit ?? scenarios.find(({ matches }) => matches.test(prompt));
}

export function simulateScenario(scenario: Scenario, stress: number) {
  const normalizedStress = stress / 100;
  const next = generator(217_389 + scenarios.indexOf(scenario) * 871);
  const normal = () => Math.sqrt(-2 * Math.log(next())) * Math.cos(2 * Math.PI * next());
  const rates: number[] = [];
  const latencies: number[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const spike = next() < 0.035 + 0.21 * normalizedStress;
    const severity = next();
    const demand = scenario.demand * Math.max(0.25, 1 + 0.43 * normalizedStress + 0.17 * normal());
    const loss = spike ? scenario.shockLoss * (0.45 + severity * 0.55) : 0;
    const capacity = scenario.capacity * Math.max(0.17, 1 - loss + 0.055 * normal());
    const utilization = demand / capacity;
    const queue = Math.max(0, utilization - 0.64);
    const latency = scenario.baseLatency * Math.exp(0.2 * normal()) + scenario.queuePenalty * queue ** 1.6;
    rates.push(Math.min(demand, capacity));
    latencies.push(latency);
  }

  rates.sort((a, b) => a - b);
  latencies.sort((a, b) => a - b);

  return percentiles.map((percentile) => ({
    ...percentile,
    throughput: quantile(rates, 1 - percentile.quantile),
    latency: quantile(latencies, percentile.quantile),
  }));
}

export type SimulationResult = ReturnType<typeof simulateScenario>;
