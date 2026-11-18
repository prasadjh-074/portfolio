import { useEffect, useId, useRef, type MouseEvent } from 'react'
import { ArrowUpRight, Move, RotateCcw, Waypoints } from 'lucide-react'
import './CausalGraph.css'

const profiles = {
  github: 'https://github.com/prasadjh-074',
  linkedin: 'https://www.linkedin.com/in/prasad-hemadri-3a258b300',
}

type LayoutNode = {
  label: string
  offset: [number, number]
  kind: 'identity' | 'github' | 'linkedin' | 'stack' | 'academic'
  color: string
  href?: string
  accessibleLabel?: string
}

const layout: LayoutNode[] = [
  { label: 'Prasad JH', offset: [0, 0], kind: 'identity', color: '121, 225, 250' },
  { label: 'Go', offset: [-60, -137], kind: 'stack', color: '142, 180, 201' },
  { label: 'GitHub', offset: [123, -93], kind: 'github', color: '52, 211, 153', href: profiles.github, accessibleLabel: 'Open GitHub profile @prasadjh-074 in a new tab' },
  { label: 'LinkedIn', offset: [143, 59], kind: 'linkedin', color: '56, 189, 248', href: profiles.linkedin, accessibleLabel: 'Open Prasad Jagadish Hemadri on LinkedIn in a new tab' },
  { label: 'Dr. AIT', offset: [24, 141], kind: 'academic', color: '156, 172, 196' },
  { label: 'Python', offset: [-113, 86], kind: 'stack', color: '142, 180, 201' },
  { label: 'Redis', offset: [-153, -41], kind: 'stack', color: '142, 180, 201' },
]

const primaryEdges = layout.slice(1).map((_, index) => [0, index + 1] as const)
const secondaryEdges = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [5, 1], [6, 2]]
const springEdges = [...primaryEdges, ...secondaryEdges]
const tau = Math.PI * 2

type NodeState = {
  x: number
  y: number
  homeX: number
  homeY: number
  vx: number
  vy: number
}

type Drag = {
  index: number
  pointer: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  moved: boolean
}

function color(rgb: string, alpha: number) {
  return `rgba(${rgb}, ${alpha})`
}

function circle(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.beginPath()
  context.arc(x, y, radius, 0, tau)
}

function line(context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
  context.beginPath()
  context.moveTo(fromX, fromY)
  context.lineTo(toX, toY)
  context.stroke()
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number, radius: number) {
  const x = width / 2
  const y = height / 2
  const aqua = layout[0].color

  context.fillStyle = color(aqua, 0.11)
  for (let column = x % 17; column < width; column += 17) {
    for (let row = y % 17; row < height; row += 17) {
      context.fillRect(column, row, 1, 1)
    }
  }

  const spotlight = context.createRadialGradient(x, y, 8, x, y, radius * 1.36)
  spotlight.addColorStop(0, color('56, 189, 248', 0.12))
  spotlight.addColorStop(0.63, color('28, 86, 107', 0.068))
  spotlight.addColorStop(1, color('28, 86, 107', 0))
  context.fillStyle = spotlight
  context.fillRect(0, 0, width, height)

  context.lineWidth = 1
  context.strokeStyle = color(aqua, 0.12)
  context.setLineDash([3, 6])
  line(context, x - radius * 1.33, y, x + radius * 1.33, y)
  line(context, x, y - radius * 1.17, x, y + radius * 1.17)
  context.setLineDash([])
  context.strokeStyle = color(aqua, 0.052)
  line(context, x - radius * 0.83, y - radius * 0.83, x + radius * 0.83, y + radius * 0.83)
  line(context, x - radius * 0.83, y + radius * 0.83, x + radius * 0.83, y - radius * 0.83)

  for (const fraction of [0.21, 0.41, 0.63, 0.83, 1, 1.11]) {
    const outside = fraction > 1
    context.strokeStyle = color(aqua, outside ? 0.07 : 0.13)
    if (fraction === 0.83) context.setLineDash([1, 5])
    circle(context, x, y, radius * fraction)
    context.stroke()
    context.setLineDash([])
  }

  for (let index = 0; index < 96; index += 1) {
    const angle = (index / 96) * tau
    const major = index % 8 === 0
    const inside = radius + 5
    const outside = radius + (major ? 12 : 8)
    context.strokeStyle = color(aqua, major ? 0.26 : 0.115)
    line(
      context,
      x + Math.cos(angle) * inside,
      y + Math.sin(angle) * inside,
      x + Math.cos(angle) * outside,
      y + Math.sin(angle) * outside,
    )
  }

  for (const [start, end] of [[-1.12, -0.87], [-0.29, -0.02], [1.47, 1.75], [2.69, 2.95]]) {
    context.strokeStyle = color(aqua, 0.25)
    context.beginPath()
    context.arc(x, y, radius + 1, start, end)
    context.stroke()
  }

  context.font = '9px "JetBrains Mono Variable", "JetBrains Mono", monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = color(aqua, 0.46)
  if (radius * 1.15 < height / 2 - 9) {
    context.fillText('000', x, y - radius * 1.15)
    context.fillText('180', x, y + radius * 1.15)
  }
  if (radius * 1.18 < width / 2 - 15) {
    context.fillText('270', x - radius * 1.18, y)
    context.fillText('090', x + radius * 1.18, y)
  }
}

function drawEdges(context: CanvasRenderingContext2D, nodes: NodeState[], time: number, animated: boolean) {
  context.lineWidth = 1
  context.setLineDash([3, 7])
  context.strokeStyle = color(layout[0].color, 0.2)
  secondaryEdges.forEach(([from, to]) => {
    line(context, nodes[from].x, nodes[from].y, nodes[to].x, nodes[to].y)
  })
  context.setLineDash([])

  primaryEdges.forEach(([from, to], index) => {
    const origin = nodes[from]
    const destination = nodes[to]
    const rgb = layout[to].color
    const isProfile = Boolean(layout[to].href)
    const gradient = context.createLinearGradient(origin.x, origin.y, destination.x, destination.y)
    gradient.addColorStop(0, color(rgb, 0.17))
    gradient.addColorStop(0.67, color(rgb, isProfile ? 0.52 : 0.31))
    gradient.addColorStop(1, color(rgb, isProfile ? 0.72 : 0.46))
    context.strokeStyle = gradient
    line(context, origin.x, origin.y, destination.x, destination.y)

    const phase = animated ? (time / (2350 + index * 230) + index * 0.21) % 1 : 0.38 + index * 0.045
    const x = origin.x + (destination.x - origin.x) * phase
    const y = origin.y + (destination.y - origin.y) * phase
    context.fillStyle = color(rgb, isProfile ? 0.81 : 0.50)
    context.shadowColor = color(rgb, 0.75)
    context.shadowBlur = isProfile ? 9 : 3
    circle(context, x, y, isProfile ? 1.7 : 1.3)
    context.fill()
    context.shadowBlur = 0
  })
}

function drawNode(context: CanvasRenderingContext2D, node: NodeState, index: number, highlighted: boolean) {
  const { x, y } = node
  const { color: rgb, href } = layout[index]

  if (index === 0) {
    const halo = context.createRadialGradient(x, y, 4, x, y, 37)
    halo.addColorStop(0, color(rgb, 0.33))
    halo.addColorStop(0.6, color(rgb, 0.102))
    halo.addColorStop(1, color(rgb, 0))
    circle(context, x, y, 37)
    context.fillStyle = halo
    context.fill()

    context.strokeStyle = color(rgb, highlighted ? 0.78 : 0.39)
    context.lineWidth = 1
    context.setLineDash([3, 3])
    circle(context, x, y, 24)
    context.stroke()
    context.setLineDash([])

    circle(context, x, y, 16.5)
    context.fillStyle = '#0c2631'
    context.fill()
    context.strokeStyle = color(rgb, 0.95)
    context.stroke()
    context.strokeStyle = color(rgb, 0.8)
    context.lineWidth = 1.25
    line(context, x - 8, y, x + 8, y)
    line(context, x, y - 8, x, y + 8)
    context.fillStyle = color(rgb, 1)
    context.shadowColor = color(rgb, 0.9)
    context.shadowBlur = 11
    circle(context, x, y, 3.5)
    context.fill()
    context.shadowBlur = 0
    return
  }

  const radius = href ? 6.5 : 5
  context.lineWidth = 1
  context.strokeStyle = color(rgb, highlighted ? 0.82 : 0.29)
  circle(context, x, y, radius + (highlighted ? 9 : 6))
  context.stroke()
  circle(context, x, y, radius)
  context.fillStyle = '#0a1218'
  context.fill()
  context.strokeStyle = color(rgb, href || highlighted ? 0.94 : 0.64)
  context.stroke()
  context.shadowColor = color(rgb, 0.85)
  context.shadowBlur = href || highlighted ? 10 : 3
  circle(context, x, y, href ? 2.6 : 1.6)
  context.fillStyle = color(rgb, 0.94)
  context.fill()
  context.shadowBlur = 0
}

export default function CausalGraph() {
  const headingId = useId()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const nodeElements = useRef<(HTMLElement | null)[]>([])
  const controlsRef = useRef<{ reset: () => void; pulse: (index: number) => void } | null>(null)
  const suppressClickUntil = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const stage = stageRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !stage || !context) return

    const grid = document.createElement('canvas')
    const gridContext = grid.getContext('2d')
    const nodes: NodeState[] = layout.map(() => ({ x: 0, y: 0, homeX: 0, homeY: 0, vx: 0, vy: 0 }))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const shockwaves: { index: number; startedAt: number }[] = []
    let width = 0
    let height = 0
    let gridRadius = 0
    let frame: number | null = null
    let lastTime = 0
    let visible = true
    let drag: Drag | null = null
    let hoveredNode = -1
    let focusedNode = -1

    function schedule() {
      if (visible && frame === null) frame = requestAnimationFrame(draw)
    }

    function placeNodeLabels() {
      nodes.forEach((node, index) => {
        const element = nodeElements.current[index]
        if (element) element.style.translate = `${node.x.toFixed(2)}px ${node.y.toFixed(2)}px`
      })
    }

    function reset() {
      for (const node of nodes) {
        node.x = node.homeX
        node.y = node.homeY
        node.vx = 0
        node.vy = 0
      }
      placeNodeLabels()
      schedule()
    }

    function resize() {
      if (!canvas || !stage || !context) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = stage.clientWidth
      height = stage.clientHeight
      if (!width || !height) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
      gridRadius = Math.min(width * 0.38, height * 0.412, 193)

      if (gridContext) {
        grid.width = canvas.width
        grid.height = canvas.height
        gridContext.setTransform(grid.width / width, 0, 0, grid.height / height, 0, 0)
        drawGrid(gridContext, width, height, gridRadius)
      }

      for (const [index, node] of nodes.entries()) {
        const [dx, dy] = layout[index].offset
        const scale = gridRadius / 161
        node.homeX = width / 2 + dx * scale
        node.homeY = height / 2 + dy * scale
      }
      reset()
      stage.dataset.ready = 'true'
    }

    function update(time: number, delta: number) {
      for (const [index, node] of nodes.entries()) {
        if (drag?.index === index && drag.moved) continue
        const driftX = index ? Math.sin(time * 0.00086 + index) * 2.5 : 0
        const driftY = index ? Math.cos(time * 0.00097 + index) * 2.5 : 0
        const tether = index ? 0.017 : 0.033
        node.vx += (node.homeX + driftX - node.x) * tether * delta
        node.vy += (node.homeY + driftY - node.y) * tether * delta
      }

      for (const [a, b] of springEdges) {
        const from = nodes[a]
        const to = nodes[b]
        const dx = to.x - from.x
        const dy = to.y - from.y
        const distance = Math.hypot(dx, dy) || 1
        const rest = Math.hypot(to.homeX - from.homeX, to.homeY - from.homeY)
        const force = (distance - rest) * (a === 0 ? 0.009 : 0.0035) * delta
        const fx = force * dx / distance
        const fy = force * dy / distance
        from.vx += fx
        from.vy += fy
        to.vx -= fx
        to.vy -= fy
      }

      const separation = gridRadius * 0.36
      for (let first = 0; first < nodes.length - 1; first += 1) {
        for (let second = first + 1; second < nodes.length; second += 1) {
          const from = nodes[first]
          const to = nodes[second]
          const dx = to.x - from.x
          const dy = to.y - from.y
          const distance = Math.hypot(dx, dy)
          if (distance >= separation) continue
          const force = (separation - distance) * 0.028 * delta
          const fx = distance ? force * dx / distance : force
          const fy = distance ? force * dy / distance : 0
          from.vx -= fx
          from.vy -= fy
          to.vx += fx
          to.vy += fy
        }
      }

      for (const [index, node] of nodes.entries()) {
        if (drag?.index === index && drag.moved) continue
        const damping = Math.pow(0.86, delta)
        node.vx *= damping
        node.vy *= damping
        node.x = Math.min(width - 49, Math.max(49, node.x + node.vx * delta))
        node.y = Math.min(height - 45, Math.max(24, node.y + node.vy * delta))
      }
    }

    function draw(now: number) {
      frame = null
      if (!context || !width || !height || !visible) return
      const animated = !reducedMotion.matches
      const delta = Math.min(2, (now - lastTime) / 16.67)
      lastTime = now
      if (animated) update(now, delta)

      context.clearRect(0, 0, width, height)
      if (gridContext) context.drawImage(grid, 0, 0, width, height)
      else drawGrid(context, width, height, gridRadius)
      drawEdges(context, nodes, now, animated)
      nodes.forEach((node, index) => {
        drawNode(context, node, index, index === hoveredNode || index === focusedNode || drag?.index === index)
      })
      placeNodeLabels()

      for (let index = shockwaves.length - 1; index >= 0; index -= 1) {
        const wave = shockwaves[index]
        const progress = (now - wave.startedAt) / 760
        if (progress >= 1 || !animated) {
          shockwaves.splice(index, 1)
          continue
        }

        const node = nodes[wave.index]
        context.strokeStyle = color(layout[wave.index].color, (1 - progress) * 0.83)
        context.lineWidth = 1.35
        circle(context, node.x, node.y, 9 + (1 - Math.pow(1 - progress, 2)) * 105)
        context.stroke()
      }

      if (animated || drag) schedule()
    }

    function pointerLocation(event: PointerEvent) {
      const bounds = stage!.getBoundingClientRect()
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    function findNode(target: EventTarget | null, x: number, y: number) {
      const handle = target instanceof Element ? target.closest<HTMLElement>('[data-graph-node]') : null
      if (handle) return Number(handle.dataset.graphNode)
      return nodes.findIndex((node, index) => Math.hypot(x - node.x, y - node.y) < (index === 0 ? 23 : 17))
    }

    function pointerDown(event: PointerEvent) {
      if (drag || event.button !== 0 || !event.isPrimary) return
      const { x, y } = pointerLocation(event)
      const index = findNode(event.target, x, y)
      if (index === -1) return
      drag = { index, pointer: event.pointerId, startX: x, startY: y, offsetX: x - nodes[index].x, offsetY: y - nodes[index].y, moved: false }
      schedule()
    }

    function pointerMove(event: PointerEvent) {
      if (!stage) return
      const { x, y } = pointerLocation(event)
      hoveredNode = findNode(event.target, x, y)
      if (drag && drag.pointer === event.pointerId) {
        if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) >= 5) {
          drag.moved = true
          stage.setPointerCapture(event.pointerId)
          stage.dataset.dragging = 'true'
        }

        if (drag.moved) {
          const node = nodes[drag.index]
          node.x = Math.min(width - 49, Math.max(49, x - drag.offsetX))
          node.y = Math.min(height - 45, Math.max(24, y - drag.offsetY))
          node.vx = 0
          node.vy = 0
        }
      }
      schedule()
    }

    function pointerEnd(event: PointerEvent) {
      if (!stage || !drag || drag.pointer !== event.pointerId) return
      if (event.type === 'lostpointercapture' && event.target !== stage) return
      const { index, moved } = drag
      drag = null
      if (moved) suppressClickUntil.current = performance.now() + 350
      delete stage.dataset.dragging
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId)

      const nativeLink = event.target instanceof Element && event.target.closest('a[data-graph-node]')
      if (event.type === 'pointerup' && !moved && layout[index].href && !nativeLink) {
        const { x, y } = pointerLocation(event)
        if (findNode(event.target, x, y) === index) nodeElements.current[index]?.click()
      }
      schedule()
    }

    function pointerLeave() {
      hoveredNode = -1
      if (!drag?.moved) drag = null
      schedule()
    }

    function focusIn(event: FocusEvent) {
      focusedNode = event.target instanceof HTMLElement ? Number(event.target.dataset.graphNode ?? -1) : -1
      schedule()
    }

    function focusOut() {
      focusedNode = -1
      schedule()
    }

    controlsRef.current = {
      reset,
      pulse: (index) => {
        if (!reducedMotion.matches) shockwaves.push({ index, startedAt: performance.now() })
        schedule()
      },
    }

    const sizeObserver = new ResizeObserver(resize)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
    })
    sizeObserver.observe(stage)
    visibilityObserver.observe(stage)
    stage.addEventListener('pointerdown', pointerDown)
    stage.addEventListener('pointermove', pointerMove)
    stage.addEventListener('pointerup', pointerEnd)
    stage.addEventListener('pointercancel', pointerEnd)
    stage.addEventListener('lostpointercapture', pointerEnd)
    stage.addEventListener('pointerleave', pointerLeave)
    stage.addEventListener('focusin', focusIn)
    stage.addEventListener('focusout', focusOut)
    reducedMotion.addEventListener('change', schedule)
    resize()

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)
      sizeObserver.disconnect()
      visibilityObserver.disconnect()
      stage.removeEventListener('pointerdown', pointerDown)
      stage.removeEventListener('pointermove', pointerMove)
      stage.removeEventListener('pointerup', pointerEnd)
      stage.removeEventListener('pointercancel', pointerEnd)
      stage.removeEventListener('lostpointercapture', pointerEnd)
      stage.removeEventListener('pointerleave', pointerLeave)
      stage.removeEventListener('focusin', focusIn)
      stage.removeEventListener('focusout', focusOut)
      reducedMotion.removeEventListener('change', schedule)
      delete stage.dataset.ready
      controlsRef.current = null
    }
  }, [])

  function activateProfile(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.detail > 0 && performance.now() < suppressClickUntil.current) {
      event.preventDefault()
      return
    }
    controlsRef.current?.pulse(index)
  }

  return (
    <section className="causal-graph" aria-labelledby={headingId}>
      <div className="causal-graph__header">
        <h2 id={headingId} className="causal-graph__heading">
          <Waypoints size={15} aria-hidden="true" />
          System topology
        </h2>
        <span className="causal-graph__status"><span aria-hidden="true" /> Online</span>
      </div>

      <div className="causal-graph__stage" ref={stageRef}>
        <canvas ref={canvasRef} aria-hidden="true" />
        {layout.map((node, index) => {
          const className = `graph-node graph-node--${node.kind}`
          const register = (element: HTMLElement | null) => { nodeElements.current[index] = element }
          const caption = (
            <span className="graph-node__caption">
              {node.label}
              {node.href && <ArrowUpRight strokeWidth={1.8} size={12} aria-hidden="true" />}
            </span>
          )

          return node.href ? (
            <a
              className={className}
              key={node.label}
              ref={register}
              data-graph-node={index}
              href={node.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={node.accessibleLabel}
              draggable={false}
              onClick={(event) => activateProfile(event, index)}
            >
              {caption}
            </a>
          ) : (
            <span className={className} key={node.label} ref={register} data-graph-node={index}>{caption}</span>
          )
        })}
      </div>

      <div className="causal-graph__footer">
        <span><Move size={13} aria-hidden="true" /> Drag nodes to explore</span>
        <button type="button" onClick={() => controlsRef.current?.reset()} aria-label="Reset the graph layout">
          <RotateCcw size={13} aria-hidden="true" /> Reset
        </button>
      </div>
    </section>
  )
}
