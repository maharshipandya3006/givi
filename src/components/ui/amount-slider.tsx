"use client"

import * as SliderPrimitive from "@radix-ui/react-slider"
import * as React from "react"

import { cn } from "@/lib/utils"

// Square cell grid: CELL px per cell, GAP px between squares.
const CELL = 6
const GAP = 1
// Thumb width (matches `w-6` below). Radix keeps the thumb inside the track, so
// its center travels from THUMB/2 to (width - THUMB/2); ticks use the same inset
// so end points aren't jammed into the corners and the thumb lands on them.
const THUMB = 24

// Deterministic pseudo-random in [0,1) per cell.
function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Amount slider rendered as a live grid of shimmering squares in the theme's
 * accent color. A tail of busy squares trails the thumb and grows with the
 * value, while a faint drifting shimmer nudges rightward through the empty
 * track. Honors prefers-reduced-motion, and pauses offscreen or on a hidden tab.
 */
export function AmountSlider({
  className,
  min = 0,
  max = 100,
  step = 1,
  stops,
  ticks,
  snapOnDrag = false,
  onValueChange,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Optional milestone stops rendered as glowing tick indicators. */
  stops?: number[]
  /** Optional number of evenly spaced tick dots across the entire track. */
  ticks?: number
  /** Whether to snap exclusively to stops during dragging. Defaults to false for buttery-smooth continuous sliding. */
  snapOnDrag?: boolean
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const trackRef = React.useRef<HTMLSpanElement | null>(null)
  const drawRef = React.useRef<((now: number) => void) | null>(null)

  const value = Array.isArray(props.value)
    ? props.value
    : Array.isArray(props.defaultValue)
      ? props.defaultValue
      : [min]
  const current = value[value.length - 1] ?? min
  const fraction = Math.min(Math.max((current - min) / (max - min || 1), 0), 1)
  const fractionRef = React.useRef(fraction)
  fractionRef.current = fraction

  const sortedStops = React.useMemo(
    () => (stops && stops.length ? [...stops].sort((a, b) => a - b) : null),
    [stops],
  )

  // Compute evenly placed tick markers
  const tickFractions = React.useMemo(() => {
    if (typeof ticks === "number" && ticks > 1) {
      return Array.from({ length: ticks }, (_, i) => {
        const f = i / (ticks - 1)
        return {
          fraction: f,
          val: min + f * (max - min),
        }
      })
    }
    if (sortedStops && sortedStops.length > 0) {
      return sortedStops.map((s) => ({
        fraction: Math.min(1, Math.max(0, (s - min) / (max - min || 1))),
        val: s,
      }))
    }
    return null
  }, [ticks, sortedStops, min, max])

  const snap = (v: number) => {
    if (!sortedStops) return v
    let best = sortedStops[0]
    for (const s of sortedStops) {
      if (Math.abs(s - v) < Math.abs(best - v)) best = s
    }
    return best
  }

  // Pointer/drag: continuous smooth value updates by step (or snapped if explicitly requested).
  const handleValueChange = (vals: number[]) => {
    if (snapOnDrag && sortedStops) {
      onValueChange?.(vals.map(snap))
    } else {
      onValueChange?.(vals)
    }
  }

  // Keyboard: step one stop at a time instead of Radix's raw step.
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!sortedStops) return
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? -1
          : event.key === "Home"
            ? "home"
            : event.key === "End"
              ? "end"
              : null
    if (delta === null) return
    event.preventDefault()
    event.stopPropagation()
    const idx = sortedStops.indexOf(snap(current))
    const next =
      delta === "home"
        ? 0
        : delta === "end"
          ? sortedStops.length - 1
          : Math.min(sortedStops.length - 1, Math.max(0, idx + delta))
    onValueChange?.([sortedStops[next]])
  }

  // Smooth mouse wheel and trackpad scroll interaction
  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : -e.deltaY
      if (Math.abs(delta) < 1) return

      e.preventDefault()
      e.stopPropagation()

      const stepVal = typeof step === "number" && step > 0 ? step : 5
      const direction = delta > 0 ? 1 : -1
      const target = Math.min(max, Math.max(min, fractionRef.current * (max - min) + min + direction * stepVal))
      const rounded = Math.round(target / stepVal) * stepVal
      onValueChange?.([Math.min(max, Math.max(min, rounded))])
    }

    track.addEventListener("wheel", onWheel, { passive: false })
    return () => track.removeEventListener("wheel", onWheel)
  }, [min, max, step, onValueChange])

  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduce(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  React.useEffect(() => {
    const canvas = canvasRef.current
    const track = trackRef.current
    if (!canvas || !track) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let running = true
    let w = 0
    let h = 0

    // Resolve the accent as a computed CSS color. The track carries
    // `color: var(--color-primary)`, so any format the host theme uses (oklch,
    // hsl, hex) arrives here already parsed, and a theme switch just repaints.
    let accent = "rgb(22 101 52)"
    const readAccent = () => {
      const v = getComputedStyle(track).color.trim()
      if (v) accent = v
    }
    readAccent()

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = track.clientWidth
      h = track.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!running) drawRef.current?.(performance.now())
    }

    let last = performance.now()
    let phase = 0
    let hintPhase = 0
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const fill = fractionRef.current
      // Shimmer speeds up the further the thumb is dragged.
      phase += dt * (0.3 + fill * 3.2)
      // Gentle constant drift for the "nudge" shimmer in the empty track.
      hintPhase += dt
      ctx.clearRect(0, 0, w, h)
      const cols = Math.ceil(w / CELL)
      const rows = Math.ceil(h / CELL)
      const sq = CELL - GAP
      // Tail behind the thumb grows with the amount; a faint rightward "nudge"
      // shimmer fills the empty track ahead of it, strongest at small amounts
      // and fading away as the amount climbs. Positions are in px and aligned to
      // the thumb's real travel (inset by THUMB/2) so the tail ends at the thumb.
      const fillPx = THUMB / 2 + fill * (w - THUMB)
      const bandPx = fill * 0.6 * w
      const hintStrength = 0.15 * (1 - fill)
      for (let cx = 0; cx < cols; cx++) {
        const cellPx = cx * CELL + CELL / 2
        let colBase: number
        let isTail: boolean
        if (cellPx <= fillPx) {
          if (bandPx <= 0.5) continue
          const band = 1 - (fillPx - cellPx) / bandPx
          if (band <= 0) continue
          colBase = band * band
          isTail = true
        } else {
          if (hintStrength <= 0.002) continue
          const reach = w - fillPx
          const along = reach > 0 ? (cellPx - fillPx) / reach : 0
          // Fades in just ahead of the thumb, peaks mid-empty, fades at the end;
          // the crest drifts rightward to hint "drag this way for more".
          const envelope = Math.sin(along * Math.PI)
          const pulse = 0.5 + 0.5 * Math.sin((cellPx / w) * 5 - hintPhase * 4.5)
          colBase = hintStrength * envelope * pulse
          if (colBase <= 0.002) continue
          isTail = false
        }
        for (let cy = 0; cy < rows; cy++) {
          const ph = hash(cx, cy) * Math.PI * 2
          const stat = 0.6 + 0.4 * hash(cx + 7.3, cy - 3.1)
          const twinkle = 0.5 + 0.5 * Math.sin(phase * 1.7 + ph)
          let anim: number
          if (reduce) {
            anim = 1
          } else if (isTail) {
            // Busy flicker drifting left like a rocket nozzle's exhaust; the
            // random per-cell phase keeps it lively instead of smooth bands,
            // and it flows faster as the amount climbs.
            const flicker = Math.sin(phase * 2.4 + cx * 0.9 + cy * 0.4 + ph)
            anim = 0.35 + 0.325 * (1 + flicker)
          } else {
            anim = 0.6 + 0.4 * twinkle
          }
          let a = colBase * stat * anim
          a = a < 0 ? 0 : a > 1 ? 1 : a
          if (a < 0.015) continue
          ctx.globalAlpha = a
          ctx.fillStyle = accent
          ctx.fillRect(cx * CELL, cy * CELL, sq, sq)
          ctx.globalAlpha = 1
        }
      }
      if (running && !reduce) raf = requestAnimationFrame(draw)
    }
    drawRef.current = draw

    resize()
    if (reduce) draw(performance.now())
    else raf = requestAnimationFrame(draw)

    const ro = new ResizeObserver(resize)
    ro.observe(track)

    const themeObserver = new MutationObserver(() => {
      readAccent()
      if (!running) draw(performance.now())
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    // Pause the loop when the slider scrolls offscreen or the tab is hidden.
    const io = new IntersectionObserver((entries) => {
      const visible = entries[0]?.isIntersecting ?? true
      if (visible && !running && !reduce) {
        running = true
        raf = requestAnimationFrame(draw)
      } else if (!visible && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    })
    io.observe(track)

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduce && !running) {
        running = true
        raf = requestAnimationFrame(draw)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      themeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      drawRef.current = null
    }
  }, [reduce])

  // Under reduced motion the loop is static, so repaint when the value changes.
  React.useEffect(() => {
    if (reduce) drawRef.current?.(performance.now())
  }, [fraction, reduce])

  return (
    <SliderPrimitive.Root
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none items-center select-none overflow-visible py-2 data-[disabled]:opacity-50",
        className,
      )}
      onValueChange={handleValueChange}
      onKeyDownCapture={handleKeyDown}
      {...props}
    >
      <SliderPrimitive.Track
        ref={trackRef}
        className="relative h-9 w-full grow overflow-hidden rounded-xl bg-surface-elevated text-emerald-600 dark:text-emerald-400 border border-border"
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {tickFractions?.map(({ fraction: f, val }) => {
          const active = val <= current + 1e-6
          return (
            <span
              key={val}
              className={cn(
                "pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 z-10",
                active
                  ? "size-2.5 bg-emerald-500 border-2 border-white shadow-sm shadow-emerald-700/60"
                  : "size-2 bg-emerald-500/50 border border-emerald-600/60",
              )}
              style={{
                left: `calc(${f} * (100% - ${THUMB}px) + ${THUMB / 2}px)`,
              }}
            />
          )
        })}
      </SliderPrimitive.Track>
      {value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="relative flex items-center justify-center h-10 w-6 shrink-0 cursor-grab rounded-xl bg-ink text-white shadow-md ring-emerald-500/30 transition-shadow duration-150 ease-out outline-none hover:ring-2 focus-visible:ring-2 active:cursor-grabbing disabled:pointer-events-none border border-border"
        >
          <span className="w-0.5 h-3 rounded-full bg-white/40 pointer-events-none" />
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

/**
 * Clean tabular readout for the giving amount. Instant 0ms update latency
 * during continuous drag with zero layout shifts or font jumping.
 */
export function AmountReadout({
  value,
  prefix = "$",
  suffix,
  className,
}: {
  value: number
  prefix?: string
  suffix?: React.ReactNode
  className?: string
}) {
  const rounded = Math.max(0, Math.round(value))

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-black tabular-nums tracking-tight text-foreground select-none",
        className,
      )}
      role="status"
      aria-label={`${prefix}${rounded}`}
    >
      {prefix && <span aria-hidden="true">{prefix}</span>}
      <span className="tabular-nums tracking-tight">{rounded}</span>
      {suffix}
    </span>
  )
}

