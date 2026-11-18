import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import './SocialLinks.css'

export const PROFILE_LINKS = {
  github: 'https://github.com/prasadjh-074',
  linkedin: 'https://www.linkedin.com/in/prasad-hemadri-3a258b300',
} as const

const githubLabels = [
  '@prasadjh-074',
  'FETCHING REPOS: UPIShield · fx_router · wikiguard',
  'OPEN GITHUB ↗',
]

const linkedinLabels = [
  'PRASAD JAGADISH HEMADRI · DR. AIT',
  'CONNECT ON LINKEDIN ↗',
  'SYSTEMS & ALGORITHMS ENGINEER',
]

const profileNames = { github: 'GitHub', linkedin: 'LinkedIn' }
const springSettings = { stiffness: 180, damping: 15 }

type Profile = keyof typeof PROFILE_LINKS

function ProfileIcon({ profile, size = 16 }: { profile: Profile; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {profile === 'github' ? (
        <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54l-.02-2.09c-3.12.68-3.77-1.32-3.77-1.32-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.4-1.23.72-1.51-2.49-.28-5.1-1.24-5.1-5.54 0-1.22.44-2.22 1.15-3-.11-.29-.5-1.42.11-2.95 0 0 .94-.3 3.08 1.14a10.7 10.7 0 0 1 5.6 0c2.14-1.44 3.07-1.14 3.07-1.14.61 1.53.23 2.66.12 2.94.71.79 1.14 1.79 1.14 3.01 0 4.31-2.62 5.25-5.11 5.53.4.35.76 1.03.76 2.08l-.01 3.08c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
      ) : (
        <path d="M20.6 2H3.39A1.39 1.39 0 0 0 2 3.39v17.22c0 .77.62 1.39 1.39 1.39h17.22A1.39 1.39 0 0 0 22 20.61V3.39C22 2.62 21.38 2 20.6 2ZM7.94 19.04H4.97V9.5h2.97v9.54ZM6.45 8.2a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12.59 10.84h-2.97v-4.64c0-1.11-.02-2.54-1.55-2.54-1.55 0-1.79 1.21-1.79 2.46v4.72H9.76V9.5h2.85v1.3h.04a3.12 3.12 0 0 1 2.81-1.54c3.01 0 3.58 1.99 3.58 4.57v5.2Z" />
      )}
    </svg>
  )
}

function usePointerMotion() {
  const reducedMotion = useReducedMotion()
  const [pointing, setPointing] = useState(false)
  const [focused, setFocused] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const smoothX = useSpring(x, springSettings)
  const smoothY = useSpring(y, springSettings)

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set(Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5)))
    y.set(Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5)))
  }

  return {
    active: pointing || focused,
    reducedMotion,
    smoothX,
    smoothY,
    focus: {
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
    pointer: {
      onPointerEnter: (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== 'touch') setPointing(true)
      },
      onPointerMove: trackPointer,
      onPointerLeave: () => {
        setPointing(false)
        x.set(0)
        y.set(0)
      },
    },
  }
}

function useScramble(target: string, reducedMotion: boolean | null) {
  const [text, setText] = useState(target)
  const lastTarget = useRef(target)
  useEffect(() => {
    const targetChanged = lastTarget.current !== target
    lastTarget.current = target
    if (reducedMotion) {
      setText(target)
      return
    }
    if (!targetChanged) return

    const glyphs = '0123456789░▒/+-<>'
    let frame = 0
    const ticker = window.setInterval(() => {
      frame += 1
      const progress = Math.ceil((frame / 8) * target.length)
      setText(Array.from(target, (letter, index) => {
        if (index < progress || !/[\p{L}\p{N}]/u.test(letter)) return letter
        return glyphs[(index * 7 + frame * 11) % glyphs.length]
      }).join(''))
      if (frame >= 8) window.clearInterval(ticker)
    }, 25)
    return () => window.clearInterval(ticker)
  }, [target, reducedMotion])
  return text
}

function useProfileLabel(profile: Profile, active: boolean, reducedMotion: boolean | null) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    if (reducedMotion) return
    if (profile === 'github') {
      if (!active) return
      const next = window.setTimeout(() => setStep(1), 1200)
      return () => window.clearTimeout(next)
    }

    const ticker = window.setInterval(() => setStep((current) => (current + 1) % 3), active ? 2150 : 4700)
    return () => window.clearInterval(ticker)
  }, [profile, active, reducedMotion])

  const githubIndex = reducedMotion && active ? 2 : active ? step + 1 : 0
  const linkedinIndex = (step + (active ? 1 : 0)) % 3
  return useScramble(
    profile === 'github' ? githubLabels[githubIndex] : linkedinLabels[linkedinIndex],
    reducedMotion,
  )
}

const contributionCells = Array.from({ length: 84 }, (_, index) => {
  const column = index % 12
  const row = Math.floor(index / 12)
  return {
    strength: (index * index + column * 17 + row * 7) % 19,
    wave: column * 45 + Math.abs(row - 3) * 35,
    idle: (column * 137 + row * 832) % 4000,
  }
})

function GitHubGraphic({ active }: { active: boolean }) {
  return (
    <div className="social-card__art social-card__art--github" aria-hidden="true">
      <svg className="social-branch" viewBox="0 0 53 44" fill="none">
        <path d="M5 33H49" className="social-branch__main" />
        <path d="M9 33C18 33 17 11 29 11h5c10 0 11 22 15 22" className="social-branch__fork" />
        <circle cx="5" cy="33" r="2.5" />
        <circle cx="49" cy="33" r="2.5" />
        <circle cx="30" cy="11" r="2.5" />
        {active && (
          <>
            <circle r="3" className="social-branch__signal">
              <animateMotion path="M9 33C18 33 17 11 29 11h5c10 0 11 22 15 22" dur="0.88s" fill="freeze" />
            </circle>
            <circle cx="49" cy="33" r="3" className="social-branch__merge" />
          </>
        )}
      </svg>
      <div className="social-heatmap">
        {contributionCells.map(({ strength, wave, idle }, index) => (
          <span
            key={index}
            data-strength={strength > 14 ? 3 : strength > 7 ? 2 : strength > 3 ? 1 : 0}
            style={{ '--cell-wave': `${wave}ms`, '--cell-idle': `-${idle}ms` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}

const connections = [
  { label: 'Dr. AIT Bengaluru', y: 9, x: 42, bend: 28 },
  { label: 'Systems Engineering', y: 25, x: 50, bend: 36 },
  { label: 'Backend & ML', y: 42, x: 53, bend: 43 },
  { label: 'Open to Opportunities', y: 57, x: 42, bend: 55 },
]

function LinkedInGraphic({ active }: { active: boolean }) {
  const gradientId = useId()

  return (
    <svg className="social-card__art social-card__art--linkedin" viewBox="0 0 150 66" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="10" y1="32" x2="65" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#7DD3FC" />
        </linearGradient>
      </defs>
      <circle cx="13" cy="33" r="12" className="social-network__orbit" />
      {connections.map(({ label, x, y, bend }, index) => {
        const curve = `M 13 33 C ${bend} 33, ${x - 9} ${y}, ${x} ${y}`
        return (
          <g key={label} style={{ '--network-delay': `${index * 80}ms` } as CSSProperties}>
            <path d={curve} className="social-network__edge" />
            <path
              d={curve}
              stroke={`url(#${gradientId})`}
              pathLength="1"
              className="social-network__signal"
            />
            {active && (
              <circle r="1.6" className="social-network__packet">
                <animateMotion path={curve} begin={`${index * 0.08}s`} dur="0.6s" fill="freeze" />
              </circle>
            )}
            <circle cx={x} cy={y} r="2.1" className="social-network__node" />
            <text x={x + 6} y={y + 2.7} className="social-network__label">{label}</text>
          </g>
        )
      })}
      <motion.circle
        cx="13"
        cy="33"
        r="5"
        className="social-network__radar-ring"
        animate={active ? { scale: [1, 2.8], opacity: [0.8, 0] } : { scale: 1, opacity: 0 }}
        transition={active ? { duration: 1.6, repeat: Infinity, ease: 'easeOut' } : { duration: 0 }}
        style={{ transformOrigin: '13px 33px' }}
      />
      <circle cx="13" cy="33" r="7.2" className="social-network__radar" />
      <circle cx="13" cy="33" r="3.3" className="social-network__hub" />
    </svg>
  )
}

function ProfileCard({ profile }: { profile: Profile }) {
  const { active, reducedMotion, smoothX, smoothY, focus, pointer } = usePointerMotion()
  const label = useProfileLabel(profile, active, reducedMotion)
  const isGithub = profile === 'github'
  const x = useTransform(smoothX, [-0.5, 0.5], [-4, 4])
  const y = useTransform(smoothY, [-0.5, 0.5], [-3, 3])
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [9, -9])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-12, 12])
  const gleamX = useTransform(smoothX, [-0.5, 0.5], [0, 100])
  const gleamY = useTransform(smoothY, [-0.5, 0.5], [0, 100])
  const reflection = useMotionTemplate`radial-gradient(ellipse at ${gleamX}% ${gleamY}%, rgba(125, 211, 252, .17), transparent 65%)`
  const motionStyle = isGithub ? { x, y } : { rotateX, rotateY, transformPerspective: 600 }

  return (
    <div className="social-card-slot" {...pointer}>
      <motion.a
        className={`social-card social-card--${profile}`}
        data-engaged={active}
        href={PROFILE_LINKS[profile]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open Prasad's ${profileNames[profile]} profile in a new tab`}
        style={reducedMotion ? undefined : motionStyle}
        {...focus}
      >
        {!isGithub && <motion.span className="social-card__reflection" style={{ background: reflection }} aria-hidden="true" />}
        <span className="social-card__header" aria-hidden="true">
          <span className="social-card__mark"><ProfileIcon profile={profile} /></span>
          <span className="social-card__name">{profileNames[profile]}</span>
          <ArrowUpRight size={15} className="social-card__arrow" />
        </span>
        <span className="social-card__status" aria-hidden="true">{label}</span>
        {isGithub ? <GitHubGraphic active={active && !reducedMotion} /> : <LinkedInGraphic active={active && !reducedMotion} />}
      </motion.a>
    </div>
  )
}

export function SocialCards({ className }: { className?: string }) {
  return (
    <div className={`social-dock${className ? ` ${className}` : ''}`}>
      <ProfileCard profile="github" />
      <ProfileCard profile="linkedin" />
    </div>
  )
}

function QuickProfileLink({ profile, context }: { profile: Profile; context: 'nav' | 'footer' }) {
  const { active, reducedMotion, smoothX, smoothY, focus, pointer } = usePointerMotion()
  const x = useTransform(smoothX, [-0.5, 0.5], [-4, 4])
  const y = useTransform(smoothY, [-0.5, 0.5], [-3, 3])
  const label = profile === 'github' ? '@prasadjh-074' : 'LinkedIn'

  return (
    <div className="social-quick__slot" {...pointer}>
      <motion.a
        href={PROFILE_LINKS[profile]}
        target="_blank"
        rel="noopener noreferrer"
        className={`social-quick__link social-quick__link--${profile}`}
        data-engaged={active}
        aria-label={`Open Prasad's ${profileNames[profile]} profile in a new tab`}
        style={reducedMotion ? undefined : { x, y }}
        {...focus}
      >
        <span className="social-quick__icon"><ProfileIcon profile={profile} size={14} /></span>
        <span className="social-quick__label">{label}</span>
        {context === 'footer' && <ArrowUpRight size={13} className="social-quick__arrow" aria-hidden="true" />}
      </motion.a>
    </div>
  )
}

export function SocialQuickLinks({ context = 'nav' }: { context?: 'nav' | 'footer' }) {
  return (
    <div className={`social-quick social-quick--${context}`}>
      <QuickProfileLink profile="github" context={context} />
      <QuickProfileLink profile="linkedin" context={context} />
    </div>
  )
}
