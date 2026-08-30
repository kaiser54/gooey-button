import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type Transition,
} from "motion/react"
import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { MOTION } from "./design-system"
import { mix, SPEED, SLOW_SCALE, useSlowMotion } from "./slow-motion"
import qrCodeUrl from "../qr-code.svg?url"

const CARD_W = 280
const CARD_H = 116
const QR = 88
const PAD = 14
const IDLE_Y = (CARD_W - CARD_H) / 2
const HOVER_OUT = MOTION.hoverScale
const PRESS_IN = MOTION.pressScale

const SCAN_SPEED = {
  min: { open: 0.55, close: 0.45, bounceOpen: 0.3, bounceClose: 0.26 },
  max: {
    open: 0.7 * SLOW_SCALE,
    close: 0.55 * SLOW_SCALE,
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

export function ScanQrCodeMorph() {
  const { speedT, scale } = useSlowMotion()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const blobH = useMotionValue(CARD_H)
  const morph = useTransform(blobH, (h) =>
    clamp01((h - CARD_H) / (CARD_W - CARD_H)),
  )
  const blurAmount = reduceMotion ? 0 : MOTION.blur
  const blurPx = useTransform(
    morph,
    [0, 0.22, 0.5, 0.78, 1],
    [0, blurAmount * 0.5, blurAmount, blurAmount * 0.5, 0],
  )
  const contentFilter = useTransform(blurPx, blurFilter)

  const spring: Transition = reduceMotion
    ? reduced
    : {
        type: "spring",
        duration: mix(
          open ? SCAN_SPEED.min.open : SCAN_SPEED.min.close,
          open ? SCAN_SPEED.max.open : SCAN_SPEED.max.close,
          speedT,
        ),
        bounce: mix(
          open ? SCAN_SPEED.min.bounceOpen : SCAN_SPEED.min.bounceClose,
          open ? SCAN_SPEED.max.bounceOpen : SCAN_SPEED.max.bounceClose,
          speedT,
        ),
      }
  const press: Transition = {
    type: "spring",
    duration: MOTION.pressDuration * scale,
    bounce: MOTION.chipBounce,
  }
  const layoutTransition: Transition = reduceMotion
    ? reduced
    : {
        width: spring,
        height: spring,
        top: spring,
        right: spring,
        y: spring,
        scale: press,
      }
  const feedback = pressed ? PRESS_IN : hovered ? HOVER_OUT : 1
  const boxLayout = {
    width: CARD_W,
    height: open ? CARD_W : CARD_H,
    y: open ? 0 : IDLE_Y,
    scale: feedback,
  }

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setHovered(false)
      setPressed(false)
      setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const bindPress = {
    onPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return
      setHovered(true)
    },
    onPointerLeave: () => setHovered(false),
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setPressed(true)
    },
    onPointerUp: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.repeat) return
      if (event.key === " " || event.key === "Enter") setPressed(true)
    },
    onKeyUp: () => setPressed(false),
  }

  return (
    <div className="cluster size-70">
      <div className="gooey filter-(--filter-lift)">
        <motion.div
          className="blob w-full rounded-4xl"
          initial={false}
          animate={boxLayout}
          transition={layoutTransition}
          onUpdate={(latest) => {
            if (typeof latest.height === "number") blobH.set(latest.height)
          }}
        />
      </div>

      <motion.button
        type="button"
        className="absolute top-0 left-0 w-full cursor-pointer overflow-hidden rounded-4xl border-0 bg-transparent p-0 [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-control"
        aria-label={open ? "Hide QR code" : "Scan to download"}
        aria-expanded={open}
        initial={false}
        animate={boxLayout}
        transition={layoutTransition}
        {...bindPress}
        onClick={() => {
          setPressed(false)
          setHovered(false)
          setOpen((value) => !value)
        }}
      >
        <motion.p
          className="pointer-events-none absolute top-1/2 left-5 m-0 origin-right font-sans text-base leading-[1.12] font-semibold text-left max-w-25 text-control"
          initial={false}
          animate={{
            y: "-50%",
            scale: open ? 0.82 : 1,
            opacity: open ? 0 : 1,
          }}
          transition={reduceMotion ? reduced : spring}
          style={{ filter: contentFilter }}
          aria-hidden={open}
        >
          Scan to
          download
        </motion.p>
        <motion.img
          className="pointer-events-none absolute object-contain"
          src={qrCodeUrl}
          alt=""
          width={88}
          height={88}
          draggable={false}
          initial={false}
          animate={{
            top: open ? 0 : PAD,
            right: open ? 0 : PAD,
            width: open ? CARD_W : QR,
            height: open ? CARD_W : QR,
            borderRadius: open ? 32 : 20,
          }}
          transition={layoutTransition}
        />
      </motion.button>
    </div>
  )
}
