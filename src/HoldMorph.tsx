import { motion, useReducedMotion, type Transition } from "motion/react"
import {
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { MOTION } from "./design-system"
import { useSlowMotion } from "./slow-motion"

const HOVER_OUT = MOTION.hoverScale
const PRESS_IN = MOTION.pressScale

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

function HoldLabel() {
  return (
    <>
      <TrashIcon />
      Hold to Delete
    </>
  )
}

export function HoldMorph() {
  const { scale } = useSlowMotion()
  const reduceMotion = useReducedMotion()
  const [holding, setHolding] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const press: Transition = {
    type: "spring",
    duration: MOTION.pressDuration * scale,
    bounce: MOTION.chipBounce,
  }
  const feedback = pressed ? PRESS_IN : hovered ? HOVER_OUT : 1
  const layout = { scale: feedback }

  const bindPress = {
    onPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return
      setHovered(true)
    },
    onPointerLeave: () => setHovered(false),
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setPressed(true)
      setHolding(true)
    },
    onPointerUp: () => {
      setPressed(false)
      setHolding(false)
    },
    onPointerCancel: () => {
      setPressed(false)
      setHolding(false)
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.repeat) return
      if (event.key !== " " && event.key !== "Enter") return
      event.preventDefault()
      setPressed(true)
      setHolding(true)
    },
    onKeyUp: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== " " && event.key !== "Enter") return
      setPressed(false)
      setHolding(false)
    },
    onContextMenu: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
    },
  }

  return (
    <div
      className="cluster hold-scene"
      data-holding={holding || undefined}
      style={{
        ["--hold-duration" as string]: `${MOTION.holdDuration * scale}s`,
        ["--hold-release" as string]: `${
          (reduceMotion ? MOTION.reducedDuration : MOTION.holdRelease) * scale
        }s`,
      }}
    >
      <span className="hold-sizer" aria-hidden="true">
        <HoldLabel />
      </span>

      <svg className="goo-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="goo-hold"
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

      <div className={reduceMotion ? "gooey gooey-hold gooey-flat" : "gooey gooey-hold"}>
        <motion.div
          className="blob"
          initial={false}
          animate={layout}
          transition={press}
        >
          <span className="hold-fill" aria-hidden="true" />
        </motion.div>
      </div>

      <div className="hits">
        <motion.button
          type="button"
          className="hit hold-hit"
          aria-label="Hold to delete"
          aria-busy={holding}
          initial={false}
          animate={layout}
          transition={press}
          {...bindPress}
        >
          <span className="hold-layer" aria-hidden="true">
            <HoldLabel />
          </span>
          <span className="hold-layer hold-ink" aria-hidden="true">
            <HoldLabel />
          </span>
        </motion.button>
      </div>
    </div>
  )
}
