import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Binary, Box,
  Command, Crosshair, GraduationCap, MapPin, Menu, Terminal, X,
} from 'lucide-react';
import { AnimatePresence, MotionConfig, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import CausalGraph from './components/CausalGraph';
import Simulator from './components/Simulator';
import type { ScenarioId } from './components/Simulator';
import { SocialCards, SocialQuickLinks } from './components/SocialLinks';
import { briefs, metrics, sections, stages } from './content';
import BriefDiagram from './components/BriefDiagram';

type SectionId = (typeof sections)[number]['id'];
type Brief = (typeof briefs)[number];
type RequestedScenario = { id: ScenarioId; request: number };
const transition = { type: 'spring', stiffness: 260, damping: 22 } as const;

function SectionIndex({ index, children }: { index: string; children: string }) {
  return <p className="eyebrow"><span>{index}</span><i />{children}</p>;
}

function Status({ footer = false }: { footer?: boolean }) {
  return (
    <div className={footer ? 'status-line status-line--footer' : 'status-line'}>
      <span className="status-live"><i /> <span>DR. AIT BENGALURU</span></span>
      <span className="status-divider" aria-hidden="true">·</span>
      <span>NODE ONLINE</span>
      <span className="status-divider" aria-hidden="true">·</span>
      <span title="Illustrative telemetry">LATENCY <span className="status-value">4ms</span></span>
    </div>
  );
}

function Navigation() {
  const [active, setActive] = useState<SectionId>('hero');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const edge = window.innerHeight * 0.32;
      let next: SectionId = 'hero';
      for (const { id } of sections) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= edge) next = id;
      }
      const remaining = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
      if (remaining < 3 && window.scrollY > 0) next = 'credentials';
      setActive(next);
    };
    const queue = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
    };
  }, []);

  const visit = (id: SectionId) => {
    setActive(id);
    setOpen(false);
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header" onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          setOpen(false);
          document.getElementById('navigation-toggle')?.focus();
        }
      }}>
        <div className="header-inner section-shell">
          <a className="brand" href="#hero" aria-label="Prasad J. Hemadri, home" onClick={() => visit('hero')}>
            <div className="brand-mark"><Crosshair size={19} strokeWidth={1.35} aria-hidden="true" /></div>
            <span><strong>PRASAD.JH <b>// SYSTEMS</b></strong><small>PRASAD J. HEMADRI // DR. AIT</small></span>
          </a>
          <nav className={open ? 'main-nav is-open' : 'main-nav'} id="site-navigation" aria-label="Main navigation">
            {sections.map(({ id, label }) => (
              <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => visit(id)}>{label}</a>
            ))}
          </nav>
          <div className="header-actions"><SocialQuickLinks context="nav" /></div>
          <button className="menu-toggle" id="navigation-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      <nav className="section-rail" aria-label="Section wayfinder">
        {sections.map(({ id, label }, index) => (
          <a key={id} href={`#${id}`} aria-label={label} aria-current={active === id ? 'location' : undefined} onClick={() => visit(id)}>
            <span>{String(index).padStart(2, '0')}</span><i />
          </a>
        ))}
      </nav>
    </>
  );
}

function Hero() {
  return (
    <section id="hero" className="section-shell hero-section" aria-labelledby="hero-heading" tabIndex={-1}>
      <div className="hero-status">
        <Status />
        <span className="hero-coordinates"><MapPin size={12} /> BENGALURU, IN <b>12.97° N / 77.59° E</b></span>
      </div>
      <div className="hero-frame">
        <div className="hero-copy">
          <div className="hero-identity">
            <i /> <div><strong>PRASAD JAGADISH HEMADRI</strong><span>DR. AMBEDKAR INSTITUTE OF TECHNOLOGY, BENGALURU</span></div>
          </div>
          <h1 id="hero-heading">What if you could <br className="hero-line" /><em>stress-test every</em> <br className="hero-line" />backend architecture <br className="hero-line" />before deploying it?</h1>
          <p className="hero-summary">I’m Prasad Jagadish Hemadri—an engineering student at Dr. AIT building high-throughput Go &amp; Redis graph engines, multi-hop algorithmic routers, and real-time machine learning systems.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#simulate"><Terminal size={17} /> Run a simulation <ArrowRight size={16} /></a>
            <a className="button button-outline" href="#research">Explore projects <ArrowDown size={15} /></a>
          </div>
          <SocialCards className="hero-socials" />
        </div>
        <div className="hero-graph"><CausalGraph /></div>
        <span className="frame-corner frame-corner--tl" aria-hidden="true">+</span>
        <span className="frame-corner frame-corner--tr" aria-hidden="true">+</span>
        <span className="frame-corner frame-corner--bl" aria-hidden="true">+</span>
        <span className="frame-corner frame-corner--br" aria-hidden="true">+</span>
      </div>
    </section>
  );
}

function Metric({ metric }: { metric: (typeof metrics)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const Icon = metric.icon;

  useEffect(() => {
    if (!visible || reduced || metric.value === 1) return;
    const playback = animate(0, metric.value, { duration: 0.8, ease: 'easeOut', onUpdate: (number) => setValue(Math.round(number)) });
    return () => playback.stop();
  }, [visible, reduced, metric.value]);

  const prefix = 'prefix' in metric ? metric.prefix : '';
  const displayValue = reduced || metric.value === 1 ? metric.value : value;
  return (
    <div ref={ref} className={`metric metric--${metric.color}`}>
      <div className="metric-top">
        <strong className="metric-value">
          <span className="sr-only">{prefix}{metric.value}{metric.suffix}</span>
          <span aria-hidden="true">{prefix}{displayValue}<em>{metric.suffix}</em></span>
        </strong>
        <span className="metric-icon"><Icon size={19} strokeWidth={1.65} aria-hidden="true" /></span>
      </div>
      <h3>{metric.label}</h3>
      <p>{metric.detail}</p>
    </div>
  );
}

function Problem() {
  return (
    <section id="problem" className="section-shell impact-section" aria-labelledby="impact-heading" tabIndex={-1}>
      <div className="impact-header">
        <SectionIndex index="01">Engineering impact</SectionIndex>
        <span className="impact-register"><i /><i /><i /><i /><i /></span>
      </div>
      <h2 className="sr-only" id="impact-heading">Engineering impact</h2>
      <div className="metrics-grid">
        {metrics.map((metric) => <Metric key={metric.label} metric={metric} />)}
      </div>
      <div className="problem-brief">
        <div className="problem-mark"><Binary size={26} strokeWidth={1.3} /></div>
        <div>
          <h3>What breaks first under load?</h3>
          <p>A transaction burst can build a queue before median latency moves. A stale quote can invalidate a route one hop at a time. Model these failure modes early, while the architecture is still easy to change.</p>
        </div>
        <a className="text-link" href="#simulate">Test a scenario <ArrowDown size={15} /></a>
      </div>
    </section>
  );
}

function Pipeline() {
  const [index, setIndex] = useState(0);
  const stage = stages[index];
  const StageIcon = stage.icon;
  const reduced = useReducedMotion();
  const focusTab = (next: number) => {
    const position = (next + stages.length) % stages.length;
    setIndex(position);
    document.getElementById(`stage-${stages[position].id}`)?.focus();
  };
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>, current: number) => {
    const target = { ArrowRight: current + 1, ArrowDown: current + 1, ArrowLeft: current - 1, ArrowUp: current - 1, Home: 0, End: stages.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(target);
  };
  return (
    <section id="pipeline" className="section-shell pipeline-section section-spacing" aria-labelledby="pipeline-heading" tabIndex={-1}>
      <SectionIndex index="03">How I build</SectionIndex>
      <div className="section-intro">
        <h2 className="section-heading" id="pipeline-heading">From model to <em>interface.</em></h2>
        <p>Four stages link the algorithm to the system people use.</p>
      </div>
      <div className="pipeline-layout">
        <div className="pipeline-tabs" role="tablist" aria-label="Engineering stages" aria-orientation="vertical">
          {stages.map((item, position) => (
            <button type="button" id={`stage-${item.id}`} key={item.id} role="tab" aria-selected={position === index} aria-controls="stage-panel" tabIndex={position === index ? 0 : -1} onClick={() => setIndex(position)} onKeyDown={(event) => handleKey(event, position)}>
              <span className="pipeline-index">0{position + 1}</span><span>{item.title}</span><ArrowRight size={16} />
            </button>
          ))}
        </div>
        <div className="pipeline-panel" id="stage-panel" role="tabpanel" aria-labelledby={`stage-${stage.id}`} tabIndex={0} style={{ '--stage-color': stage.color } as CSSProperties}>
          <AnimatePresence initial={false} mode="wait">
            <motion.div className="pipeline-panel-content" key={stage.id} initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -5 }} transition={transition}>
              <StageIcon size={24} strokeWidth={1.5} className="pipeline-panel-icon" aria-hidden="true" />
              <h3>{stage.label}</h3>
              <p>{stage.summary}</p>
              <ol className="pipeline-flow" aria-label="Stage flow">
                {stage.flow.map((step, position) => (
                  <li key={step}>
                    {position > 0 && <span className="flow-connection" aria-hidden="true" />}
                    <span className="flow-node"><Box size={14} /> {step}</span>
                  </li>
                ))}
              </ol>
              <ul className="tag-row" aria-label="Techniques">
                {stage.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function Research({ onSimulate }: { onSimulate: (id: Brief['id']) => void }) {
  const [selected, setSelected] = useState<Brief | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const nextSimulation = useRef<Brief['id'] | null>(null);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  const close = () => dialog.current?.close();

  return (
    <section id="research" className="section-shell research-section section-spacing" aria-labelledby="research-heading" tabIndex={-1}>
      <SectionIndex index="04">Research</SectionIndex>
      <div className="section-intro">
        <h2 className="section-heading" id="research-heading">Architecture <em>briefs.</em></h2>
        <p>Design notes from four systems spanning graph ingestion, routing, online learning, and live event streams.</p>
      </div>
      <div className="research-grid">
        {briefs.map((brief) => (
          <article className="brief-card" key={brief.id} style={{ '--brief-color': brief.color } as CSSProperties}>
            <div className="brief-visual"><BriefDiagram kind={brief.id} /></div>
            <div className="brief-content">
              <div className="brief-field"><brief.icon size={15} strokeWidth={1.6} aria-hidden="true" /> {brief.field}</div>
              <h3>{brief.name}</h3>
              <p>{brief.summary}</p>
              <ul className="tag-row" aria-label="Project stack">{brief.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              <button type="button" className="text-link brief-link" aria-label={`Read ${brief.name} architecture brief`} onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelected(brief);
              }}>
                Read architecture brief <ArrowUpRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      <dialog ref={dialog} className="brief-dialog" aria-labelledby="brief-dialog-title" onClose={() => {
        setSelected(null);
        if (nextSimulation.current) {
          onSimulate(nextSimulation.current);
          nextSimulation.current = null;
        } else {
          trigger.current?.focus();
        }
      }} onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}>
        {selected && (
          <div className="brief-dialog-body">
            <div className="brief-dialog-top">
              <p className="eyebrow">{selected.field}</p>
              <button type="button" className="icon-button" aria-label="Close architecture brief" onClick={close}><X size={21} /></button>
            </div>
            <h3 id="brief-dialog-title">{selected.name}</h3>
            <p>{selected.summary}</p>
            <dl>
              <dt>Working hypothesis</dt><dd>{selected.hypothesis}</dd>
              <dt>Architecture</dt><dd>{selected.design}</dd>
              <dt>Stress test</dt><dd>{selected.stress}</dd>
            </dl>
            <button type="button" className="button button-primary" onClick={() => {
              nextSimulation.current = selected.id;
              close();
            }}><Terminal size={17} /> Simulate this system <ArrowRight size={16} /></button>
          </div>
        )}
      </dialog>
    </section>
  );
}

function Credentials() {
  return (
    <section id="credentials" className="section-shell credentials-section section-spacing" aria-labelledby="credentials-heading" tabIndex={-1}>
      <SectionIndex index="05">Credentials</SectionIndex>
      <div className="credential-frame">
        <div className="credential-main">
          <p className="credential-kicker"><GraduationCap size={18} /> B.E. IN ENGINEERING</p>
          <h2 className="section-heading" id="credentials-heading">Prasad Jagadish<br /> <em>Hemadri.</em></h2>
          <p className="credential-school">Dr. Ambedkar Institute of Technology (VTU), Bengaluru</p>
          <ul className="tag-row" aria-label="Core stack">
            {['Go (Golang)', 'Python', 'Redis', 'C/C++', 'LightGBM', 'Glassmorphic interfaces'].map((name) => <li key={name}>{name}</li>)}
          </ul>
        </div>
        <div className="credential-links">
          <div className="credential-link-heading"><Command size={17} /> <span>Profile links</span></div>
          <SocialCards />
        </div>
        <span className="frame-corner frame-corner--tl" aria-hidden="true">+</span>
        <span className="frame-corner frame-corner--br" aria-hidden="true">+</span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-shell">
        <div className="footer-command">
          <a className="footer-brand" href="#hero"><Terminal size={18} /> PRASAD.JH <span>// SYSTEMS</span></a>
          <SocialQuickLinks context="footer" />
          <a className="footer-back" href="#hero">Back to top <ArrowUp size={15} /></a>
        </div>
        <div className="footer-meta">
          <Status footer />
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [requestedScenario, setRequestedScenario] = useState<RequestedScenario>();
  const loadScenario = (id: Brief['id']) => {
    setRequestedScenario((previous) => ({ id, request: (previous?.request ?? 0) + 1 }));
    window.setTimeout(() => {
      const simulation = document.getElementById('simulate');
      simulation?.scrollIntoView({ block: 'start' });
      simulation?.focus({ preventScroll: true });
      if (window.location.hash !== '#simulate') window.history.pushState(null, '', '#simulate');
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <Problem />
        <Simulator requestedScenario={requestedScenario} />
        <Pipeline />
        <Research onSimulate={loadScenario} />
        <Credentials />
      </main>
      <Footer />
    </MotionConfig>
  );
}
