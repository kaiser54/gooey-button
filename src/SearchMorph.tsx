import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  useVelocity,
  type Transition,
} from "motion/react"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { CONTROL, MOTION } from "./design-system"
import { mix, SPEED, SLOW_SCALE, useSlowMotion } from "./slow-motion"

const SIZE = CONTROL.size
const GAP = CONTROL.gap
const TABS_X = SIZE + GAP
const PRESS_IN = MOTION.pressScale

const SEARCH_SPEED = {
  min: { open: 0.7, close: 0.58, bounceOpen: 0.35, bounceClose: 0.3 },
  max: {
    open: 0.7 * SLOW_SCALE,
    close: 0.58 * SLOW_SCALE,
    bounceOpen: SPEED.max.bounceOpen,
    bounceClose: SPEED.max.bounceClose,
  },
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function blurFilter(px: number) {
  return px < 0.04 ? "none" : `blur(${px}px)`
}

function smoothstep(t: number) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

const reduced: Transition = {
  duration: MOTION.reducedDuration,
  ease: MOTION.ease,
}

const instant: Transition = { duration: 0 }

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
    <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="currentColor"><path d="M19.757 16.03a1 1 0 0 1 .597 1.905l-.111.035l-16 4a1 1 0 0 1-.597-1.905l.111-.035z" /><path d="M3.03 16.757a1 1 0 0 1 1.098-.749l.115.022l16 4a1 1 0 0 1-.37 1.962l-.116-.022l-16-4a1 1 0 0 1-.727-1.213M13.553 2.106C9.379 4.192 7 7.464 7 11a5 5 0 0 0 10 0c0-1.047-.188-1.808-.606-2.705l-.169-.345l-.33-.647C15.274 6.063 15 4.965 15 3a1 1 0 0 0-1.447-.894" /></g></svg>
  )
}

function HeartIcon() {
  return (
    <svg className="size-5" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037.033l.034-.03a6 6 0 0 1 4.733-1.44l.246.036a6 6 0 0 1 3.364 10.008l-.18.185l-.048.041l-7.45 7.379a1 1 0 0 1-1.313.082l-.094-.082l-7.493-7.422A6 6 0 0 1 6.979 3.074" /></svg>
  )
}

export function SearchMorph() {
  const { speedT, scale } = useSlowMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<"popular" | "favorites">("popular")
  const [pressed, setPressed] = useState<"search" | "close" | null>(null)
  const reduceMotion = useReducedMotion()
  const searchRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabsInnerRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const [pillW, setPillW] = useState<number>(SIZE)
  const [ready, setReady] = useState(false)
  const openRef = useRef(false)
  const pillWMv = useMotionValue<number>(SIZE)
  const tabsWidth = useMotionValue<number>(SIZE)
  const tabsVelocity = useVelocity(tabsWidth)
  const morph = useTransform([tabsWidth, pillWMv], (latest) => {
    const width = Number(latest[0])
    const rest = Number(latest[1])
    const travel = rest - SIZE
    if (travel <= 0) return 0
    return clamp01((rest - width) / travel)
  })
  const blurAmount = reduceMotion ? 0 : MOTION.blur
  const springDuration = mix(
    open ? SEARCH_SPEED.min.open : SEARCH_SPEED.min.close,
    open ? SEARCH_SPEED.max.open : SEARCH_SPEED.max.close,
    speedT,
  )
  const blurPx = useTransform(
    [tabsWidth, pillWMv, tabsVelocity],
    (latest) => {
      if (blurAmount <= 0) return 0
      const width = Number(latest[0])
      const rest = Number(latest[1])
      const speed = Math.abs(Number(latest[2]))
      const travel = rest - SIZE
      if (travel <= 1) return 0

      const progress = (rest - width) / travel
      const distFromRest = Math.min(Math.abs(progress), Math.abs(progress - 1))
      const spatial = smoothstep(distFromRest / 0.45)
      const kinetic = smoothstep(speed / ((travel / springDuration) * 2.2))

      return blurAmount * Math.max(spatial, kinetic)
    },
  )
  const contentFilter = useTransform(blurPx, blurFilter)
  const fieldOpacity = useTransform(morph, [0, 0.18, 0.55, 1], [0, 0.2, 1, 1])
  const closeOpacity = useTransform(morph, [0, 0.18, 0.55, 1], [0, 0, 1, 1])
  const tabsOpacity = useTransform(morph, [0, 0.45, 0.82, 1], [1, 1, 0.15, 0])
  const tabsFilter = contentFilter

  const springOpen: Transition = {
    type: "spring",
    duration: mix(SEARCH_SPEED.min.open, SEARCH_SPEED.max.open, speedT),
    bounce: mix(SEARCH_SPEED.min.bounceOpen, SEARCH_SPEED.max.bounceOpen, speedT),
  }
  const springClose: Transition = {
    type: "spring",
    duration: mix(SEARCH_SPEED.min.close, SEARCH_SPEED.max.close, speedT),
    bounce: mix(SEARCH_SPEED.min.bounceClose, SEARCH_SPEED.max.bounceClose, speedT),
  }
  const morphTransition = reduceMotion ? reduced : open ? springOpen : springClose
  const press: Transition = {
    duration: MOTION.pressDuration * scale,
    ease: MOTION.ease,
  }
  const chipTransition: Transition = reduceMotion
    ? reduced
    : {
        type: "spring",
        duration: MOTION.chipDuration * scale,
        bounce: MOTION.chipBounce,
      }
  const layoutTransition: Transition = !ready
    ? instant
    : reduceMotion
      ? reduced
      : {
          width: morphTransition,
          x: morphTransition,
          scale: press,
        }

  openRef.current = open

  useLayoutEffect(() => {
    const el = tabsInnerRef.current
    if (!el) return
    const apply = () => {
      if (openRef.current) return
      const width = el.offsetWidth
      if (width < SIZE) return
      setPillW(width)
      pillWMv.set(width)
      setReady(true)
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [pillWMv])

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

  const targetX = pillW + GAP
  const sceneW = TABS_X + pillW
  const searchLayout = {
    width: open ? pillW : SIZE,
    x: 0,
    scale: open ? 1 : pressScale("search"),
  }
  const tabsLayout = {
    width: open ? SIZE : pillW,
    x: open ? targetX : TABS_X,
    scale: open ? pressScale("close") : 1,
  }

  return (
    <div className="cluster search-scene" style={{ width: sceneW }}>
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

      <div className={reduceMotion ? "gooey gooey-search gooey-flat" : "gooey gooey-search"}>
        <motion.div
          className="blob"
          initial={false}
          animate={searchLayout}
          transition={layoutTransition}
        />
        <motion.div
          className="blob"
          initial={false}
          animate={tabsLayout}
          transition={layoutTransition}
          onUpdate={(latest) => {
            if (typeof latest.width === "number") tabsWidth.set(latest.width)
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
          animate={searchLayout}
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
            width: open ? pillW : SIZE,
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
              <motion.span
                className="hit-content search-placeholder"
                style={{ opacity: query ? 0 : fieldOpacity }}
              >
                Search
              </motion.span>
              <input
                ref={inputRef}
                className="search-input"
                type="search"
                name="q"
                value={query}
                placeholder="Search…"
                autoComplete="off"
                spellCheck={false}
                tabIndex={open ? 0 : -1}
                aria-hidden={!open}
                aria-label="Search"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hit hit-tabs"
          initial={false}
          animate={{
            width: open ? SIZE : pillW,
            x: open ? targetX : TABS_X,
          }}
          transition={layoutTransition}
          style={{ pointerEvents: open ? "none" : "auto" }}
          aria-hidden={open}
        >
          <motion.div className="hit-blur" style={{ filter: tabsFilter }}>
            <div className="hit-clip">
              <motion.div
                ref={tabsInnerRef}
                className="tabs-inner"
                style={{ opacity: tabsOpacity }}
              >
                <button
                  type="button"
                  className={tab === "popular" ? "tab tab-on" : "tab"}
                  tabIndex={open ? -1 : 0}
                  aria-pressed={tab === "popular"}
                  onClick={() => setTab("popular")}
                >
                  <span className="tab-label">
                    {tab === "popular" && (
                      <motion.span
                        className="tab-chip"
                        layoutId="tab-chip"
                        initial={false}
                        transition={chipTransition}
                      />
                    )}
                    <FlameIcon />
                    Popular
                  </span>
                </button>
                <button
                  type="button"
                  className={tab === "favorites" ? "tab tab-on" : "tab"}
                  tabIndex={open ? -1 : 0}
                  aria-pressed={tab === "favorites"}
                  onClick={() => setTab("favorites")}
                >
                  <span className="tab-label">
                    {tab === "favorites" && (
                      <motion.span
                        className="tab-chip"
                        layoutId="tab-chip"
                        initial={false}
                        transition={chipTransition}
                      />
                    )}
                    <HeartIcon />
                    Favorites
                  </span>
                </button>
              </motion.div>
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
          animate={tabsLayout}
          transition={layoutTransition}
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
