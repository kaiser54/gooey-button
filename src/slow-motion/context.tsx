import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { SLOW_SCALE } from "./speeds"

const STORAGE_KEY = "slow-motion"

type SlowMotionContextValue = {
  slow: boolean
  speedT: number
  scale: number
  setSlow: (value: boolean) => void
  toggle: () => void
}

const SlowMotionContext = createContext<SlowMotionContextValue | null>(null)

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeStored(slow: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, slow ? "1" : "0")
  } catch {
    /* ignore quota / private mode */
  }
}

function applySlowToDocument(slow: boolean) {
  const root = document.documentElement
  root.toggleAttribute("data-slow", slow)
  root.style.setProperty("--slow-scale", String(slow ? SLOW_SCALE : 1))
}

export function SlowMotionProvider({ children }: { children: ReactNode }) {
  const [slow, setSlowState] = useState(() => {
    const initial = readStored()
    applySlowToDocument(initial)
    return initial
  })
  const setSlow = useCallback((value: boolean) => {
    setSlowState(value)
    writeStored(value)
  }, [])
  const toggle = useCallback(() => {
    setSlowState((current) => {
      const next = !current
      writeStored(next)
      return next
    })
  }, [])
  const scale = slow ? SLOW_SCALE : 1
  const value = useMemo(
    () => ({
      slow,
      speedT: slow ? 1 : 0,
      scale,
      setSlow,
      toggle,
    }),
    [slow, scale, setSlow, toggle],
  )

  useEffect(() => {
    applySlowToDocument(slow)
  }, [slow])

  return (
    <SlowMotionContext.Provider value={value}>
      {children}
    </SlowMotionContext.Provider>
  )
}

export function useSlowMotion() {
  const context = useContext(SlowMotionContext)
  if (!context) {
    throw new Error("useSlowMotion must be used within SlowMotionProvider")
  }
  return context
}
