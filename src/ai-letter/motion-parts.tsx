import { AnimatePresence, motion, type Transition } from "motion/react"
import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useState,
  type ReactElement,
} from "react"

/**
 * Shared pill that slides between hovered children — posthearts' AnimatedBackground,
 * trimmed to the hover-only case the AI toolbar uses.
 */
export function AnimatedBackground({
  children,
  defaultValue,
  className,
  transition,
}: {
  children: ReactElement<{ "data-id": string; className?: string }>[]
  defaultValue?: string
  className?: string
  transition?: Transition
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const uniqueId = useId()

  useEffect(() => {
    if (defaultValue !== undefined) setActiveId(defaultValue)
  }, [defaultValue])

  return Children.map(children, (child, index) => {
    const id = child.props["data-id"]
    return cloneElement(
      child,
      {
        key: index,
        className: `relative inline-flex ${child.props.className ?? ""}`,
        onMouseEnter: () => setActiveId(id),
        onMouseLeave: () => setActiveId(null),
      } as never,
      <>
        <AnimatePresence initial={false}>
          {activeId === id && (
            <motion.div
              layoutId={`ai-bg-${uniqueId}`}
              className={`absolute inset-0 ${className ?? ""}`}
              transition={transition}
              initial={{ opacity: defaultValue ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <span className="z-10">{(child.props as { children?: never }).children}</span>
      </>,
    )
  })
}

/** Sweeping highlight that reads as "the model is working". */
export function ShimmeringText({
  text,
  className,
  duration = 1.4,
}: {
  text: string
  className?: string
  duration?: number
}) {
  return (
    <motion.span
      className={className}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-hint) 0%, var(--color-hint) 40%, var(--color-pill) 50%, var(--color-hint) 60%, var(--color-hint) 100%)",
        backgroundSize: "250% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
      initial={{ backgroundPosition: "150% 0%" }}
      animate={{ backgroundPosition: "-50% 0%" }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      {text}
    </motion.span>
  )
}
