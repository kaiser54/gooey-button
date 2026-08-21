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
import { CONTROL, MOTION } from "./design-system"
import { mix, SPEED, SLOW_SCALE, useSlowMotion } from "./slow-motion"

const SIZE = CONTROL.size
const PILL_W = 156
const GAP = CONTROL.gap
const CLUSTER_OPEN = PILL_W * 2 + GAP
const TARGET_X = PILL_W + GAP
const IDLE_X = (CLUSTER_OPEN - SIZE) / 2
const CANCEL_SCALE_FROM = 0.3
const TRAVEL = TARGET_X - IDLE_X
const CANCEL_DELAY = MOTION.cancelDelay
const HOVER_OUT = MOTION.hoverScale
const PRESS_IN = MOTION.pressScale

const DELETE_SPEED = {
  min: { open: 1.1, close: 0.8, bounceOpen: 0.35, bounceClose: 0.3 },
  max: {
    open: 1.1 * SLOW_SCALE,
    close: 0.8 * SLOW_SCALE,
    bounceOpen: SPEED.max.bounceOpen,
    bounceClose: SPEED.max.bounceClose,
  },
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function blurFilter(px: number) {
  return px < 0.12 ? "none" : `blur(${px}px)`
}

const reduced: Transition = {
  duration: MOTION.reducedDuration,
  ease: MOTION.ease,
}

function TrashIcon() {
  return (
    <svg
      className="trash-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
        d="M4 7h16m-10 4v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
      />
    </svg>
  )
}

export function DeleteMorph() {
  const { speedT, scale } = useSlowMotion()
  const [open, setOpen] = useState(false)
  const [pressed, setPressed] = useState<"delete" | "confirm" | "cancel" | null>(
    null,
  )
  const [hovered, setHovered] = useState<"delete" | "confirm" | "cancel" | null>(
    null,
  )
  const reduceMotion = useReducedMotion()
  const deleteRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const openedByPointer = useRef(false)
  const cancelX = useMotionValue(IDLE_X)
  const morph = useTransform(cancelX, (x) => clamp01((x - IDLE_X) / TRAVEL))
  const blurAmount = reduceMotion ? 0 : MOTION.blur
  const blurPx = useTransform(
    morph,
    [0, 0.22, 0.5, 0.78, 1],
    [0, blurAmount * 0.5, blurAmount, blurAmount * 0.5, 0],
  )
  const contentFilter = useTransform(blurPx, blurFilter)
  const labelOpacity = useTransform(morph, [0, 0.32, 1], [0, 1, 1])
  const cancelOpacity = useTransform(morph, [0, 0.1, 0.28, 1], [0, 0, 1, 1])
  const deleteOpacity = useTransform(morph, [0, 0.62, 0.88, 1], [1, 1, 0.12, 0])
  const fadeBlurPx = useTransform(deleteOpacity, [1, 0], [0, blurAmount])
  const iconBlurPx = useTransform([blurPx, fadeBlurPx], (latest) =>
    Math.max(Number(latest[0]), Number(latest[1])),
  )
  const iconFilter = useTransform(iconBlurPx, blurFilter)

  const springOpen: Transition = {
    type: "spring",
    duration: mix(DELETE_SPEED.min.open, DELETE_SPEED.max.open, speedT),
    bounce: mix(DELETE_SPEED.min.bounceOpen, DELETE_SPEED.max.bounceOpen, speedT),
  }
  const springClose: Transition = {
    type: "spring",
    duration: mix(DELETE_SPEED.min.close, DELETE_SPEED.max.close, speedT),
    bounce: mix(DELETE_SPEED.min.bounceClose, DELETE_SPEED.max.bounceClose, speedT),
  }
  const transition = reduceMotion ? reduced : open ? springOpen : springClose
  const press: Transition = {
    type: "spring",
    duration: MOTION.pressDuration * scale,
    bounce: MOTION.chipBounce,
  }
  const cancelDelay = open ? CANCEL_DELAY * scale : 0
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
          delay: cancelDelay,
        },
        scale:
          pressed === "cancel"
            ? press
            : {
                ...transition,
                delay: cancelDelay,
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
      if (event.key === "Escape") {
        setHovered(null)
        setPressed(null)
        setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const close = () => {
    setPressed(null)
    setHovered(null)
    setOpen(false)
  }
  const feedbackScale = (key: "delete" | "confirm" | "cancel") => {
    if (pressed === key) return PRESS_IN
    if (key !== "cancel" && hovered === key) return HOVER_OUT
    return 1
  }
  const cancelScale =
    (open ? 1 : CANCEL_SCALE_FROM) * (pressed === "cancel" ? PRESS_IN : 1)

  const bindPress = (key: "delete" | "confirm" | "cancel") => ({
    onPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return
      setHovered(key)
    },
    onPointerLeave: () => setHovered(null),
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
    <div className="cluster" style={{ width: CLUSTER_OPEN }}>
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
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -12"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      <div className={reduceMotion ? "gooey gooey-flat" : "gooey"}>
        <motion.div
          className="blob"
          initial={false}
          animate={{
            width: open ? PILL_W : SIZE,
            x: open ? 0 : IDLE_X,
            scale: feedbackScale(open ? "confirm" : "delete"),
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
          className="hit hit-delete text-danger"
          aria-label="Delete"
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          aria-hidden={open}
          initial={false}
          animate={{
            width: open ? PILL_W : SIZE,
            x: open ? 0 : IDLE_X,
            scale: feedbackScale("delete"),
          }}
          transition={layoutTransition}
          style={{ pointerEvents: open ? "none" : "auto" }}
          {...bindPress("delete")}
          onClick={(event) => {
            openedByPointer.current = event.detail > 0
            setPressed(null)
            setHovered(null)
            setOpen(true)
          }}
        />

        <motion.button
          ref={confirmRef}
          type="button"
          className="hit hit-confirm text-danger"
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          initial={false}
          animate={{
            width: open ? PILL_W : SIZE,
            x: open ? 0 : IDLE_X,
            scale: feedbackScale("confirm"),
          }}
          transition={layoutTransition}
          style={{ pointerEvents: open ? "auto" : "none" }}
          {...bindPress("confirm")}
          onClick={close}
        >
          <motion.span
            className="flow-icon"
            aria-hidden="true"
            initial={false}
            animate={{
              scale: open ? 1 : pressed === "delete" ? PRESS_IN : 1,
            }}
            transition={press}
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
                style={{ opacity: cancelOpacity }}
              >
                Cancel
              </motion.span>
            </div>
          </motion.div>
        </motion.button>
      </div>
    </div>
  )
}
