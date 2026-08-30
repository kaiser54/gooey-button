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

const SIZE = 56
const SEARCH_W = 252
const TABS_W = 264
const GAP = 16
const CLUSTER_OPEN = SEARCH_W + GAP + SIZE
const TARGET_X = SEARCH_W + GAP
const TABS_X = SIZE + GAP
const SCENE_W = Math.max(TABS_X + TABS_W, CLUSTER_OPEN)
const CLOSE_SCALE_FROM = 0.3
const CLOSE_DELAY = 0.04
const PRESS_IN = 0.97

const SPEED = {
  min: { open: 1.2, close: 1, bounceOpen: 0.35, bounceClose: 0.3 },
  max: { open: 5, close: 4.2, bounceOpen: 0.12, bounceClose: 0.1 },
} as const

function mix(from: number, to: number, t: number) {
  return from + (to - from) * t
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function blurFilter(px: number) {
  return px < 0.12 ? "none" : `blur(${px}px)`
}

const reduced: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
}

const press: Transition = {
  duration: 0.12,
  ease: [0.23, 1, 0.32, 1],
}

function SearchIcon() {
  return (
    <svg
      className="search-glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="6.25" />
      <path d="M16.15 16.15L20 20" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      className="search-glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg
      className="tab-glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3c1.2 3.2-.6 4.6-.6 7.2a3.6 3.6 0 1 0 6.6-2c.2 1 .4 1.8.4 2.8a7 7 0 1 1-14 0c0-2.2 1.2-4.4 2.4-6.2C8 6.4 10 8 10 10c0-2.8.8-4.8 2-7z" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg
      className="tab-glyph"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20s-7.2-4.5-7.2-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.2 2.4C19.2 15.5 12 20 12 20z" />
    </svg>
  )
}

type SearchInputMorphProps = {
  speedT: number
}

export function SearchInputMorph({ speedT }: SearchInputMorphProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"popular" | "favorites">("popular")
  const [pressed, setPressed] = useState<"search" | "close" | null>(null)
  const reduceMotion = useReducedMotion()
  const searchRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wasOpen = useRef(false)
  const closeX = useMotionValue(0)
  const morph = useTransform(closeX, (x) => clamp01(x / TARGET_X))
  const blurAmount = reduceMotion ? 0 : 10
  const blurPx = useTransform(
    morph,
    [0, 0.22, 0.5, 0.78, 1],
    [0, blurAmount * 0.5, blurAmount, blurAmount * 0.5, 0],
  )
  const contentFilter = useTransform(blurPx, blurFilter)
  const fieldOpacity = useTransform(morph, [0, 0.32, 1], [0, 1, 1])
  const closeOpacity = useTransform(morph, [0, 0.1, 0.28, 1], [0, 0, 1, 1])
  const tabsOpacity = useTransform(morph, [0, 0.12, 0.42], [1, 0.7, 0])
  const tabsBlurPx = useTransform(
    morph,
    [0, 0.18, 0.42],
    [0, blurAmount * 0.7, blurAmount],
  )
  const tabsFilter = useTransform(tabsBlurPx, blurFilter)

  const springOpen: Transition = {
    type: "spring",
    duration: mix(SPEED.min.open, SPEED.max.open, speedT),
    bounce: mix(SPEED.min.bounceOpen, SPEED.max.bounceOpen, speedT),
  }
  const springClose: Transition = {
    type: "spring",
    duration: mix(SPEED.min.close, SPEED.max.close, speedT),
    bounce: mix(SPEED.min.bounceClose, SPEED.max.bounceClose, speedT),
  }
  const transition = reduceMotion ? reduced : open ? springOpen : springClose
  const layoutTransition: Transition = reduceMotion
    ? reduced
    : {
        width: transition,
        x: transition,
        scale: press,
      }
  const closeTransition: Transition = reduceMotion
    ? reduced
    : {
        width: transition,
        x: {
          ...transition,
          delay: open ? CLOSE_DELAY : 0,
        },
        scale:
          pressed === "close"
            ? press
            : {
                ...transition,
                delay: open ? CLOSE_DELAY : 0,
              },
      }

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      inputRef.current?.focus()
    } else if (wasOpen.current) {
      searchRef.current?.focus()
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
  const pressScale = (key: "search" | "close") =>
    pressed === key ? PRESS_IN : 1
  const closeScale = (open ? 1 : CLOSE_SCALE_FROM) * pressScale("close")

  const bindPress = (key: "search" | "close") => ({
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
    <div className="cluster search-scene" style={{ width: SCENE_W }}>
      <svg className="goo-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter
            id="goo-search"
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

      <motion.div
        className="tabs"
        style={{
          left: TABS_X,
          width: TABS_W,
          opacity: tabsOpacity,
          filter: tabsFilter,
          pointerEvents: open ? "none" : "auto",
        }}
        aria-hidden={open}
      >
        <div className="tabs-track">
          <motion.span
            className="tab-chip"
            initial={false}
            animate={{ x: tab === "popular" ? "0%" : "100%" }}
            transition={
              reduceMotion
                ? reduced
                : { type: "spring", duration: 0.48, bounce: 0.18 }
            }
          />
          <button
            type="button"
            className={tab === "popular" ? "tab tab-on" : "tab"}
            tabIndex={open ? -1 : 0}
            onClick={() => setTab("popular")}
          >
            <FlameIcon />
            Popular
          </button>
          <button
            type="button"
            className={tab === "favorites" ? "tab tab-on" : "tab"}
            tabIndex={open ? -1 : 0}
            onClick={() => setTab("favorites")}
          >
            <HeartIcon />
            Favorites
          </button>
        </div>
      </motion.div>

      <div className={reduceMotion ? "gooey gooey-search gooey-flat" : "gooey gooey-search"}>
        <motion.div
          className="blob"
          initial={false}
          animate={{
            width: open ? SEARCH_W : SIZE,
            x: 0,
            scale: open ? 1 : pressScale("search"),
          }}
          transition={layoutTransition}
        />
        <motion.div
          className="blob blob-close"
          initial={false}
          animate={{
            width: SIZE,
            x: open ? TARGET_X : 0,
            scale: closeScale,
          }}
          transition={closeTransition}
          onUpdate={(latest) => {
            if (typeof latest.x === "number") closeX.set(latest.x)
          }}
        />
      </div>

      <div className="hits">
        <motion.button
          ref={searchRef}
          type="button"
          className="hit hit-search"
          aria-label="Search"
          aria-expanded={open}
          tabIndex={open ? -1 : 0}
          aria-hidden={open}
          initial={false}
          animate={{
            width: SIZE,
            x: 0,
            scale: open ? 1 : pressScale("search"),
          }}
          transition={layoutTransition}
          style={{ pointerEvents: open ? "none" : "auto" }}
          {...bindPress("search")}
          onClick={() => {
            setPressed(null)
            setOpen(true)
          }}
        />

        <motion.div
          className="hit hit-field"
          initial={false}
          animate={{
            width: open ? SEARCH_W : SIZE,
            x: 0,
          }}
          transition={layoutTransition}
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <span className="search-icon-slot">
            <SearchIcon />
          </span>
          <motion.div className="hit-blur" style={{ filter: contentFilter }}>
            <div className="hit-clip search-field-clip">
              <motion.label
                className="search-field"
                style={{ opacity: fieldOpacity }}
              >
                <span className="sr-only">Search</span>
                <input
                  ref={inputRef}
                  className="search-input"
                  type="search"
                  name="q"
                  placeholder="Search"
                  autoComplete="off"
                  tabIndex={open ? 0 : -1}
                  aria-hidden={!open}
                />
              </motion.label>
            </div>
          </motion.div>
        </motion.div>

        <motion.button
          type="button"
          className="hit hit-close"
          aria-label="Close search"
          tabIndex={open ? 0 : -1}
          aria-hidden={!open}
          initial={false}
          animate={{
            width: SIZE,
            x: open ? TARGET_X : 0,
            scale: closeScale,
          }}
          transition={closeTransition}
          style={{ pointerEvents: open ? "auto" : "none" }}
          {...bindPress("close")}
          onClick={close}
        >
          <motion.div className="hit-blur" style={{ filter: contentFilter }}>
            <div className="hit-clip">
              <motion.span
                className="hit-content"
                style={{ opacity: closeOpacity }}
              >
                <CloseIcon />
              </motion.span>
            </div>
          </motion.div>
        </motion.button>
      </div>
    </div>
  )
}
