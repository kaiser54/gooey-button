import {
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react"
import { useRef, type KeyboardEvent, type RefObject } from "react"
import "./App.css"

const dragTransition = { bounceStiffness: 180, bounceDamping: 18 }

function nudge(
  event: KeyboardEvent<HTMLButtonElement>,
  x: MotionValue<number>,
  y: MotionValue<number>,
  bounds: HTMLElement | null,
) {
  const step = event.shiftKey ? 24 : 10
  const delta: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }
  const next = delta[event.key]
  if (!next || !bounds) return

  event.preventDefault()

  const area = bounds.getBoundingClientRect()
  const blob = event.currentTarget.getBoundingClientRect()
  const dx = Math.min(Math.max(next[0], area.left - blob.left), area.right - blob.right)
  const dy = Math.min(Math.max(next[1], area.top - blob.top), area.bottom - blob.bottom)

  x.set(x.get() + dx)
  y.set(y.get() + dy)
}

function Drop({
  label,
  size,
  constraintsRef,
  reduceMotion,
}: {
  label: string
  size: "lg" | "sm"
  constraintsRef: RefObject<HTMLDivElement | null>
  reduceMotion: boolean | null
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  return (
    <motion.button
      type="button"
      className={`blob blob-${size}`}
      aria-label={label}
      style={{ x, y }}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.12}
      dragMomentum={!reduceMotion}
      dragTransition={dragTransition}
      whileTap={{ scale: 0.97 }}
      whileDrag={reduceMotion ? undefined : { scale: 1.05 }}
      onDragStart={() => {
        document.body.dataset.dragging = ""
      }}
      onDragEnd={() => {
        delete document.body.dataset.dragging
      }}
      onKeyDown={(event) => nudge(event, x, y, constraintsRef.current)}
    />
  )
}

function App() {
  const playRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  return (
    <main className="stage">
      <h1 className="hint">Pull the drops until they kiss</h1>

      <svg className="goo-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="goo"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="18"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      <div ref={playRef} className="play">
        <div className="gooey">
          <Drop
            label="Large drop"
            size="lg"
            constraintsRef={playRef}
            reduceMotion={reduceMotion}
          />
          <Drop
            label="Small drop"
            size="sm"
            constraintsRef={playRef}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </main>
  )
}

export default App
