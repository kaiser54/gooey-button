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
  import qrCodeUrl from "../qr-code.svg?url"
  
  const SIZE = CONTROL.size
  const CARD_W = 280
  const CARD_H = 116
  const QR = 88
  const PAD = 14
  const ICON = 28
  const OPEN_RADIUS = 32
  const QR_RADIUS = 20
  const IDLE_X = (CARD_W - SIZE) / 2
  const IDLE_Y = (CARD_H - SIZE) / 2
  const HOVER_OUT = MOTION.hoverScale
  const PRESS_IN = MOTION.pressScale
  
  const SCAN_SPEED = {
    min: { open: 0.95, close: 0.75, bounceOpen: 0.32, bounceClose: 0.28 },
    max: {
      open: 0.95 * SLOW_SCALE,
      close: 0.75 * SLOW_SCALE,
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
  
  function QrGlyph() {
    return (
      <svg
        className="scan-glyph"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="3" width="7.25" height="7.25" rx="1.7" />
        <rect className="scan-glyph-mod" x="5.15" y="5.15" width="3" height="3" rx="0.65" />
        <rect x="13.75" y="3" width="7.25" height="7.25" rx="1.7" />
        <rect className="scan-glyph-mod" x="15.9" y="5.15" width="3" height="3" rx="0.65" />
        <rect x="3" y="13.75" width="7.25" height="7.25" rx="1.7" />
        <rect className="scan-glyph-mod" x="5.15" y="15.9" width="3" height="3" rx="0.65" />
        <circle className="scan-glyph-mod" cx="14.85" cy="14.85" r="1.05" />
        <circle className="scan-glyph-mod" cx="18.05" cy="14.85" r="1.05" />
        <circle className="scan-glyph-mod" cx="21.15" cy="14.85" r="1.05" />
        <circle className="scan-glyph-mod" cx="14.85" cy="18.05" r="1.05" />
        <circle className="scan-glyph-mod" cx="21.15" cy="18.05" r="1.05" />
        <circle className="scan-glyph-mod" cx="14.85" cy="21.15" r="1.05" />
        <circle className="scan-glyph-mod" cx="18.05" cy="21.15" r="1.05" />
      </svg>
    )
  }
  
  export function ScanQrCodeMorph() {
    const { speedT, scale } = useSlowMotion()
    const [open, setOpen] = useState(false)
    const [pressed, setPressed] = useState(false)
    const [hovered, setHovered] = useState(false)
    const reduceMotion = useReducedMotion()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const wasOpen = useRef(false)
    const cardW = useMotionValue(SIZE)
    const morph = useTransform(cardW, (w) =>
      clamp01((w - SIZE) / (CARD_W - SIZE)),
    )
    const blurAmount = reduceMotion ? 0 : MOTION.blur
    const blurPx = useTransform(
      morph,
      [0, 0.22, 0.5, 0.78, 1],
      [0, blurAmount * 0.5, blurAmount, blurAmount * 0.5, 0],
    )
    const contentFilter = useTransform(blurPx, blurFilter)
    const copyOpacity = useTransform(morph, [0, 0.28, 0.62, 1], [0, 0, 1, 1])
    const iconOpacity = useTransform(morph, [0, 0.18, 0.48, 1], [1, 1, 0, 0])
    const qrOpacity = useTransform(morph, [0, 0.28, 0.62, 1], [0, 0, 1, 1])
  
    const springOpen: Transition = {
      type: "spring",
      duration: mix(SCAN_SPEED.min.open, SCAN_SPEED.max.open, speedT),
      bounce: mix(SCAN_SPEED.min.bounceOpen, SCAN_SPEED.max.bounceOpen, speedT),
    }
    const springClose: Transition = {
      type: "spring",
      duration: mix(SCAN_SPEED.min.close, SCAN_SPEED.max.close, speedT),
      bounce: mix(
        SCAN_SPEED.min.bounceClose,
        SCAN_SPEED.max.bounceClose,
        speedT,
      ),
    }
    const transition = reduceMotion ? reduced : open ? springOpen : springClose
    const press: Transition = {
      type: "spring",
      duration: MOTION.pressDuration * scale,
      bounce: MOTION.chipBounce,
    }
    const layoutTransition: Transition = reduceMotion
      ? reduced
      : {
          width: transition,
          height: transition,
          x: transition,
          y: transition,
          borderRadius: transition,
          scale: press,
        }
  
    useEffect(() => {
      if (open) wasOpen.current = true
      else if (wasOpen.current) buttonRef.current?.focus()
    }, [open])
  
    useEffect(() => {
      if (!open) return
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setHovered(false)
          setPressed(false)
          setOpen(false)
        }
      }
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [open])
  
    const feedback = pressed ? PRESS_IN : hovered ? HOVER_OUT : 1
    const layout = {
      width: open ? CARD_W : SIZE,
      height: open ? CARD_H : SIZE,
      x: open ? 0 : IDLE_X,
      y: open ? 0 : IDLE_Y,
      borderRadius: open ? OPEN_RADIUS : SIZE / 2,
      scale: feedback,
    }
    const qrLayout = {
      width: open ? QR : ICON,
      height: open ? QR : ICON,
      x: open ? CARD_W - PAD - QR : (SIZE - ICON) / 2,
      y: open ? PAD : (SIZE - ICON) / 2,
      borderRadius: open ? QR_RADIUS : 8,
    }
  
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
      <div
        className="cluster scan-scene"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <svg className="goo-defs" aria-hidden="true" focusable="false">
          <defs>
            <filter
              id="goo-scan"
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
  
        <div className={reduceMotion ? "gooey gooey-scan gooey-flat" : "gooey gooey-scan"}>
          <motion.div
            className="blob"
            initial={false}
            animate={layout}
            transition={layoutTransition}
            onUpdate={(latest) => {
              if (typeof latest.width === "number") cardW.set(latest.width)
            }}
          />
        </div>
  
        <div className="hits">
          <motion.button
            ref={buttonRef}
            type="button"
            className="hit scan-hit"
            aria-label="Scan to download"
            aria-expanded={open}
            initial={false}
            animate={layout}
            transition={layoutTransition}
            {...bindPress}
            onClick={() => {
              setPressed(false)
              setHovered(false)
              setOpen((value) => !value)
            }}
          >
            <motion.div className="hit-blur" style={{ filter: contentFilter }}>
              <div className="scan-face">
                <motion.span className="scan-copy" style={{ opacity: copyOpacity }}>
                  Scan to
                  <br />
                  download
                </motion.span>
                <motion.div
                  className="scan-qr"
                  initial={false}
                  animate={qrLayout}
                  transition={layoutTransition}
                >
                  <motion.span
                    className="scan-qr-icon"
                    style={{ opacity: iconOpacity }}
                  >
                    <QrGlyph />
                  </motion.span>
                  <motion.img
                    className="scan-qr-img"
                    src={qrCodeUrl}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{ opacity: qrOpacity }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.button>
        </div>
      </div>
    )
  }
  