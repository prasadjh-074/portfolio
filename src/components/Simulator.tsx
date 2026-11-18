import { useId, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, ChevronRight, Play, Terminal } from 'lucide-react';
import {
  recognizeScenario,
  sampleCount,
  scenarios,
  simulateScenario,
  type NodeKind,
  type Scenario,
  type ScenarioId,
  type SimulationResult,
} from './simulationModel';
import './Simulator.css';

export type { ScenarioId } from './simulationModel';

interface SimulatorProps {
  requestedScenario?: { id: ScenarioId; request: number };
}

const githubUrl = 'https://github.com/prasadjh-074';
const startingStress = 15;

const nodeColors: Record<NodeKind, string> = {
  actor: '#94a3b8',
  flow: '#38bdf8',
  stock: '#10b981',
  feedback: '#f59e0b',
};

const nodePositions = [
  { x: 5, y: 52 },
  { x: 143, y: 52 },
  { x: 281, y: 52 },
  { x: 419, y: 52 },
  { x: 350, y: 154 },
];

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const latencyFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

function Topology({ scenario }: { scenario: Scenario }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const edgeMarker = id + '-arrow';
  const feedbackMarker = id + '-feedback';
  const grid = id + '-grid';
  const reduceMotion = useReducedMotion();

  return (
    <div className="sim-topology-body">
      <svg
        className="sim-topology"
        viewBox="0 0 544 235"
        role="img"
        aria-label={scenario.label + ' topology. ' + scenario.nodes.map(({ label, kind }) => label + ', ' + kind).join('. ')}
      >
        <defs>
          <pattern id={grid} width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".7" fill="#8c9cad" opacity=".24" />
          </pattern>
          <marker id={edgeMarker} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M1 1 5 3 1 5" fill="none" stroke={nodeColors.flow} strokeWidth=".9" />
          </marker>
          <marker id={feedbackMarker} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M1 1 5 3 1 5" fill="none" stroke={nodeColors.feedback} strokeWidth=".9" />
          </marker>
        </defs>
        <rect x="0" y="17" width="544" height="198" fill={'url(#' + grid + ')'} />
        <g fill="none" strokeWidth="1.25">
          {['M125 80 H140', 'M263 80 H278', 'M401 80 H416'].map((path, index) => (
            <motion.path
              key={path}
              d={path}
              className="sim-flow-path"
              stroke={nodeColors.flow}
              markerEnd={'url(#' + edgeMarker + ')'}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            />
          ))}
          <path className="sim-feedback-path" d="M479 108 C479 133 463 141 449 152" stroke={nodeColors.feedback} markerEnd={'url(#' + feedbackMarker + ')'} />
          <path className="sim-feedback-path" d="M349 181 H316 Q203 181 203 110" stroke={nodeColors.feedback} markerEnd={'url(#' + feedbackMarker + ')'} />
        </g>
        {scenario.nodes.map(({ label, kind }, index) => {
          const { x, y } = nodePositions[index];
          const color = nodeColors[kind];
          return (
            <g key={label} transform={'translate(' + x + ' ' + y + ')'}>
              <motion.g
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <rect width="120" height="56" rx="3" fill="#0b1015" stroke={color} strokeOpacity=".55" />
                <rect x="1" y="1" width="118" height="54" rx="3" fill={color} fillOpacity=".035" />
                <circle cx="12" cy="16" r="2.5" fill={color} />
                <text x="21" y="19.2" fill={color} className="sim-node-kind">{kind.toUpperCase()}</text>
                <text x="10" y="40" fill="#f3f4f6" className="sim-node-label">{label}</text>
              </motion.g>
            </g>
          );
        })}
      </svg>
      <ol className="sim-topology-mobile" aria-label={scenario.label + ' topology in data-flow order'}>
        {scenario.nodes.map(({ label, kind }) => (
          <li key={label} style={{ '--node-color': nodeColors[kind] } as CSSProperties}>
            <span>{kind === 'feedback' ? 'Feedback loop' : kind}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="sim-topology-legend" aria-hidden="true">
        {(Object.keys(nodeColors) as NodeKind[]).map((kind) => (
          <span key={kind}><i style={{ background: nodeColors[kind] }} />{kind}</span>
        ))}
      </div>
    </div>
  );
}

function Distribution({ scenario, values }: { scenario: Scenario; values: SimulationResult }) {
  const [selected, setSelected] = useState(1);
  const reduceMotion = useReducedMotion();
  const maximumThroughput = Math.max(...values.map(({ throughput }) => throughput));
  const maximumLatency = Math.max(...values.map(({ latency }) => latency));
  const current = values[selected];

  return (
    <div className="sim-distribution">
      <div className="sim-plot-legend">
        <span><i /> Throughput</span>
        <span><i /> Latency</span>
      </div>
      <div className="sim-percentiles" role="group" aria-label="Performance percentiles">
        {values.map(({ label, caption, color, throughput, latency }, index) => (
          <button
            key={label}
            type="button"
            className="sim-percentile"
            aria-pressed={selected === index}
            style={{ '--percentile-color': color } as CSSProperties}
            onClick={() => setSelected(index)}
            aria-label={label + ', ' + caption + '. ' + numberFormat.format(throughput) + ' ' + scenario.throughputUnit + ', ' + latencyFormat.format(latency) + ' milliseconds'}
          >
            <span className="sim-percentile-label">{label}</span>
            <span className="sim-percentile-bars" aria-hidden="true">
              <span className="sim-bar-track">
                <motion.span className="sim-bar sim-bar-rate" initial={false} animate={{ width: (throughput / maximumThroughput * 100) + '%' }} transition={{ duration: reduceMotion ? 0 : 0.55 }} />
              </span>
              <span className="sim-bar-track">
                <motion.span className="sim-bar sim-bar-latency" initial={false} animate={{ width: (latency / maximumLatency * 100) + '%' }} transition={{ duration: reduceMotion ? 0 : 0.55 }} />
              </span>
            </span>
            <span className="sim-percentile-values" aria-hidden="true">
              <span>{numberFormat.format(throughput)} <small>{scenario.throughputUnit}</small></span>
              <span>{latencyFormat.format(latency)} <small>ms</small></span>
            </span>
          </button>
        ))}
      </div>
      <div className="sim-percentile-caption" aria-live="polite">
        <span style={{ color: current.color }}>{current.label}</span>
        <strong>{current.caption}</strong>
        <small>{scenario.throughputLabel} and end-to-end latency</small>
      </div>
    </div>
  );
}

export default function Simulator({ requestedScenario }: SimulatorProps) {
  const [command, setCommand] = useState<{ prompt: string; request?: number }>({ prompt: scenarios[0].prompt });
  const [stress, setStress] = useState(startingStress);
  const [feedback, setFeedback] = useState<{ prompt: string; message: string }>();
  const [run, setRun] = useState(() => ({
    sequence: 0,
    scenario: scenarios[0],
    stress: startingStress,
    values: simulateScenario(scenarios[0], startingStress),
  }));
  const requestedPrompt = requestedScenario && command.request !== requestedScenario.request
    ? scenarios.find(({ id }) => id === requestedScenario.id)?.prompt
    : undefined;
  const prompt = requestedPrompt ?? command.prompt;
  const error = feedback?.prompt === prompt ? feedback.message : undefined;
  const detectedScenario = recognizeScenario(prompt);

  function updatePrompt(next: string) {
    setCommand({ prompt: next, request: requestedScenario?.request });
    setFeedback(undefined);
  }

  function execute() {
    if (!detectedScenario) {
      setFeedback({
        prompt,
        message: prompt.trim() ? 'Choose a preset or name UPIShield, fx_router, Online SGD, or WikiGuard.' : 'Enter a system to simulate or select a preset.',
      });
      return;
    }

    const values = simulateScenario(detectedScenario, stress);
    setFeedback(undefined);
    setRun((previous) => ({ sequence: previous.sequence + 1, scenario: detectedScenario, stress, values }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    execute();
  }

  function keyboardRun(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.repeat && !event.nativeEvent.isComposing) {
      event.preventDefault();
      execute();
    }
  }

  return (
    <section className="section-shell sim-section section-spacing" id="simulate" aria-labelledby="sim-heading" tabIndex={-1} onKeyDown={keyboardRun}>
      <div className="sim-intro">
        <div>
          <p className="eyebrow"><span>02</span><i aria-hidden="true" />Simulate</p>
          <h2 className="section-heading" id="sim-heading">Stress-test a system<span className="sim-heading-period">.</span></h2>
        </div>
        <p>Choose an architecture, set a stress level, and inspect how its throughput and latency respond across simulated workloads.</p>
      </div>

      <div className="sim-console">
        <form onSubmit={submit}>
          <div className="sim-terminal-title">
            <span><Terminal size={16} aria-hidden="true" /> prasad-engine simulate</span>
            <span className="sim-terminal-status"><i /> Browser runtime</span>
          </div>
          <div className="sim-terminal-body">
            <label htmlFor="scenario-prompt" className="sim-prompt-label">
              <ChevronRight size={17} aria-hidden="true" />
              What would you like to simulate?
            </label>
            <textarea
              id="scenario-prompt"
              value={prompt}
              rows={2}
              maxLength={600}
              spellCheck={false}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'sim-input-error' : undefined}
              onChange={(event) => updatePrompt(event.currentTarget.value)}
              placeholder="Choose a preset or type a system name."
            />
            {error && <p className="sim-error" id="sim-input-error" role="alert">{error}</p>}
            <div className="sim-presets" role="group" aria-label="Scenario presets">
              <span className="sim-control-label">Presets</span>
              {scenarios.map((scenario) => (
                <button
                  className="sim-preset"
                  key={scenario.id}
                  type="button"
                  aria-pressed={prompt === scenario.prompt}
                  aria-label={'Load ' + scenario.label + ' preset'}
                  title={scenario.prompt}
                  onClick={() => updatePrompt(scenario.prompt)}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
            <div className="sim-actions">
              <div className="sim-stress">
                <label htmlFor="simulation-stress" className="sim-control-label">Stress level</label>
                <input
                  id="simulation-stress"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={stress}
                  aria-valuetext={stress + ' percent'}
                  onChange={(event) => setStress(event.currentTarget.valueAsNumber)}
                />
                <output htmlFor="simulation-stress">{stress}%</output>
              </div>
              <div className="sim-run">
                <span className="sim-shortcut"><kbd>⌘</kbd> / <kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>
                <button type="submit" className="sim-run-button" aria-keyshortcuts="Meta+Enter Control+Enter">
                  <Play size={13} fill="currentColor" aria-hidden="true" /> Simulate
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="sim-output-info">
          <div role="status" aria-live="polite">
            <Activity size={15} aria-hidden="true" />
            <strong>{run.sequence ? 'Run ' + String(run.sequence).padStart(2, '0') + ' complete' : 'Baseline preview'}</strong>
            <span>{run.scenario.label} · {run.stress}% stress · {numberFormat.format(sampleCount)} synthetic samples</span>
          </div>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer">View GitHub <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>

        <div className="sim-results">
          <div className="sim-result-panel">
            <div className="sim-result-header">
              <h3>System topology</h3>
              <span>01 / FLOW</span>
            </div>
            <Topology key={run.scenario.id + '-' + run.sequence} scenario={run.scenario} />
          </div>
          <div className="sim-result-panel">
            <div className="sim-result-header">
              <h3>Monte Carlo distribution</h3>
              <span>02 / LOAD</span>
            </div>
            <Distribution scenario={run.scenario} values={run.values} />
          </div>
        </div>
        <p className="sim-output-note">Browser-local estimates from a synthetic workload. Rows follow latency percentiles with complementary throughput percentiles.</p>
      </div>
    </section>
  );
}
