import { Slider } from "@base-ui/react/slider"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "motion/react"
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import "./App.css"

const SIZE = 56
const PILL_W = 156
const GAP = 16
const CLUSTER_OPEN = PILL_W * 2 + GAP
const TARGET_X = PILL_W + GAP
const IDLE_X = (CLUSTER_OPEN - SIZE) / 2
const CANCEL_SCALE_FROM = 0.3

const SPEED = {
  min: { open: 1.2, close: 1, delay: 0.04 },
  max: { open: 3.5, close: 2.9, delay: 0.12 },
} as const

function mix(from: number, to: number, t: number) {
  return from + (to - from) * t
}

const reduced: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
}

const press: Transition = {
  duration: 0.12,
  ease: [0.23, 1, 0.32, 1],
}

const PRESS_IN = 0.97

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
  )
}

function App() {
  const [open, setOpen] = useState(false)
  const [speedT, setSpeedT] = useState(0)
  const [pressed, setPressed] = useState<"delete" | "confirm" | "cancel" | null>(
    null,
  )
  const reduceMotion = useReducedMotion()
  const deleteRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const openedByPointer = useRef(false)
  const cancelX = useMotionValue(IDLE_X)
  const fadeX = IDLE_X + (TARGET_X - IDLE_X) * 0.4
  const blurAmount = reduceMotion ? 0 : 10
  const blurPx = useTransform(
    cancelX,
    [
      IDLE_X,
      IDLE_X + (TARGET_X - IDLE_X) * 0.18,
      (IDLE_X + TARGET_X) / 2,
      IDLE_X + (TARGET_X - IDLE_X) * 0.82,
      TARGET_X,
    ],
    [0, blurAmount * 0.55, blurAmount, blurAmount * 0.55, 0],
  )
  const contentFilter = useTransform(blurPx, (value) =>
    value < 0.12 ? "none" : `blur(${value}px)`,
  )
  const labelOpacity = useTransform(cancelX, [IDLE_X, fadeX, TARGET_X], [0, 1, 1])
  const deleteOpacity = useTransform(
    cancelX,
    [IDLE_X, IDLE_X + (TARGET_X - IDLE_X) * 0.72, TARGET_X],
    [1, 1, 0],
  )
  const fadeBlurPx = useTransform(deleteOpacity, [1, 0], [0, blurAmount])
  const iconBlurPx = useTransform([blurPx, fadeBlurPx], (latest) => {
    const morph = Number(latest[0])
    const fade = Number(latest[1])
    return Math.max(morph, fade)
  })
  const iconFilter = useTransform(iconBlurPx, (value) =>
    value < 0.12 ? "none" : `blur(${value}px)`,
  )

  const openDuration = mix(SPEED.min.open, SPEED.max.open, speedT)
  const closeDuration = mix(SPEED.min.close, SPEED.max.close, speedT)
  const cancelDelay = mix(SPEED.min.delay, SPEED.max.delay, speedT)
  const springOpen: Transition = {
    type: "spring",
    duration: openDuration,
    bounce: 0.35,
  }
  const springClose: Transition = {
    type: "spring",
    duration: closeDuration,
    bounce: 0.3,
  }
  const transition = reduceMotion ? reduced : open ? springOpen : springClose
  const layoutTransition: Transition = reduceMotion
    ? reduced
    : {
        width: transition,
        x: transition,
        scale: press,
      }
  const cancelTransition: Transition = reduceMotion
    ? reduced
    : {
        width: transition,
        x: {
          ...transition,
          delay: open ? cancelDelay : 0,
        },
        scale:
          pressed === "cancel"
            ? press
            : {
                ...transition,
                delay: open ? cancelDelay : 0,
              },
      }

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      if (!openedByPointer.current) confirmRef.current?.focus()
    } else if (wasOpen.current) {
      deleteRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const close = () => {
    setPressed(null)
    setOpen(false)
  }
  const pressScale = (key: "delete" | "confirm" | "cancel") =>
    pressed === key ? PRESS_IN : 1
  const cancelScale = (open ? 1 : CANCEL_SCALE_FROM) * pressScale("cancel")

  const bindPress = (key: "delete" | "confirm" | "cancel") => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setPressed(key)
    },
    onPointerUp: () => setPressed(null),
    onPointerCancel: () => setPressed(null),
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.repeat) return
      if (event.key === " " || event.key === "Enter") setPressed(key)
    },
    onKeyUp: () => setPressed(null),
  })

  return (
    <main className="stage">
      <h1 className="sr-only">Delete</h1>

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
              stdDeviation="8"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -12"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      <div className="cluster" style={{ width: CLUSTER_OPEN }}>
        <div className={reduceMotion ? "gooey gooey-flat" : "gooey"}>
          <motion.div
            className="blob"
            initial={false}
            animate={{
              width: open ? PILL_W : SIZE,
              x: open ? 0 : IDLE_X,
              scale: pressScale(open ? "confirm" : "delete"),
            }}
            transition={layoutTransition}
          />
          <motion.div
            className="blob blob-cancel"
            initial={false}
            animate={{
              width: open ? PILL_W : SIZE,
              x: open ? TARGET_X : IDLE_X,
              scale: cancelScale,
            }}
            transition={cancelTransition}
            onUpdate={(latest) => {
              if (typeof latest.x === "number") cancelX.set(latest.x)
            }}
          />
        </div>

        <div className="hits">
          <motion.button
            ref={deleteRef}
            type="button"
            className="hit hit-delete"
            aria-label="Delete"
            aria-expanded={open}
            tabIndex={open ? -1 : 0}
            aria-hidden={open}
            initial={false}
            animate={{
              width: open ? PILL_W : SIZE,
              x: open ? 0 : IDLE_X,
              scale: pressScale("delete"),
            }}
            transition={layoutTransition}
            style={{ pointerEvents: open ? "none" : "auto" }}
            {...bindPress("delete")}
            onClick={(event) => {
              openedByPointer.current = event.detail > 0
              setPressed(null)
              setOpen(true)
            }}
          />

          <motion.button
            ref={confirmRef}
            type="button"
            className="hit hit-confirm"
            tabIndex={open ? 0 : -1}
            aria-hidden={!open}
            initial={false}
            animate={{
              width: open ? PILL_W : SIZE,
              x: open ? 0 : IDLE_X,
              scale: pressScale("confirm"),
            }}
            transition={layoutTransition}
            style={{ pointerEvents: open ? "auto" : "none" }}
            {...bindPress("confirm")}
            onClick={close}
          >
            <motion.span
              className="flow-icon"
              aria-hidden="true"
              style={{ filter: iconFilter, opacity: deleteOpacity }}
            >
              <TrashIcon />
            </motion.span>
            <motion.div className="hit-blur" style={{ filter: contentFilter }}>
              <div className="hit-clip">
                <motion.span
                  className="hit-content"
                  initial={false}
                  animate={{ x: open ? 0 : 22 }}
                  transition={layoutTransition}
                  style={{ opacity: labelOpacity }}
                >
                  Confirm
                </motion.span>
              </div>
            </motion.div>
          </motion.button>

          <motion.button
            type="button"
            className="hit hit-cancel"
            tabIndex={open ? 0 : -1}
            aria-hidden={!open}
            initial={false}
            animate={{
              width: open ? PILL_W : SIZE,
              x: open ? TARGET_X : IDLE_X,
              scale: cancelScale,
            }}
            transition={cancelTransition}
            style={{ pointerEvents: open ? "auto" : "none" }}
            {...bindPress("cancel")}
            onClick={close}
          >
            <motion.div className="hit-blur" style={{ filter: contentFilter }}>
              <div className="hit-clip">
                <motion.span
                  className="hit-content"
                  style={{ opacity: labelOpacity }}
                >
                  Cancel
                </motion.span>
              </div>
            </motion.div>
          </motion.button>
        </div>
      </div>

      <Slider.Root
        className="speed"
        value={speedT}
        min={0}
        max={1}
        step={0.01}
        onValueChange={setSpeedT}
      >
        <div className="speed-meta">
          <span>Normal</span>
          <Slider.Label className="sr-only">Animation speed</Slider.Label>
          <Slider.Value className="speed-value">
            {(_formatted, values) =>
              `${mix(SPEED.min.open, SPEED.max.open, values[0]).toFixed(1)}s`
            }
          </Slider.Value>
          <span>Slow</span>
        </div>
        <Slider.Control className="speed-control">
          <Slider.Track className="speed-track">
            <Slider.Indicator className="speed-indicator" />
            <Slider.Thumb
              className="speed-thumb"
              getAriaValueText={(_formatted, value) =>
                `${mix(SPEED.min.open, SPEED.max.open, value).toFixed(1)} seconds`
              }
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </main>
  )
}

export default App
