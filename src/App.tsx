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
const GAP = 30
const CLUSTER_OPEN = PILL_W * 2 + GAP
const TARGET_X = PILL_W + GAP
const IDLE_X = (CLUSTER_OPEN - SIZE) / 2
const CANCEL_SCALE_FROM = 0.3

const springOpen: Transition = {
  type: "spring",
  duration: 1.5,
  bounce: 0.4,
}

const springClose: Transition = {
  type: "spring",
  duration: 1.25,
  bounce: 0.35,
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
    <svg
      className="trash-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 7h14" />
      <path d="M9.5 7V5.8c0-.4.3-.8.8-.8h3.4c.4 0 .8.4.8.8V7" />
      <path d="M7 7l.8 12.2c.1.9.8 1.6 1.7 1.6h5c.9 0 1.6-.7 1.7-1.6L17 7" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

function App() {
  const [open, setOpen] = useState(false)
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
  const blurPx = useTransform(
    cancelX,
    [IDLE_X, (IDLE_X + TARGET_X) / 2, TARGET_X],
    [0, reduceMotion ? 0 : 2, 0],
  )
  const contentFilter = useTransform(blurPx, (value) =>
    value < 0.12 ? "none" : `blur(${value}px)`,
  )
  const labelOpacity = useTransform(cancelX, [IDLE_X, fadeX, TARGET_X], [0, 1, 1])
  const deleteOpacity = useTransform(cancelX, [IDLE_X, fadeX], [1, 0])

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
          delay: open ? 0.04 : 0,
        },
        scale:
          pressed === "cancel"
            ? press
            : {
                ...transition,
                delay: open ? 0.04 : 0,
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
          >
            <motion.span
              className="hit-content"
              style={{ filter: contentFilter, opacity: deleteOpacity }}
            >
              <TrashIcon />
            </motion.span>
          </motion.button>

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
              className="hit-content"
              style={{ filter: contentFilter, opacity: labelOpacity }}
            >
              Confirm
            </motion.span>
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
            <motion.span
              className="hit-content"
              style={{ filter: contentFilter, opacity: labelOpacity }}
            >
              Cancel
            </motion.span>
          </motion.button>
        </div>
      </div>
    </main>
  )
}

export default App
