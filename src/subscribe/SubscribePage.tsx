import { useEffect, useId, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { FlowingGradient, Shader, Text } from "shaders/react"
import { MOTION } from "../design-system"
import { useSlowMotion } from "../slow-motion"

const WELCOME = "Welcome to Team plan."

export function SubscribePage() {
  const [paid, setPaid] = useState(false)
  const [gpu, setGpu] = useState(true)
  const reduced = useReducedMotion() ?? false
  const narrow = useNarrow()
  const { scale } = useSlowMotion()
  const reveal = reduced
    ? { duration: MOTION.reducedDuration }
    : { type: "spring" as const, duration: 0.55 * scale, bounce: MOTION.chipBounce }

  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-6 pb-[8vh]">
      <div className="flex w-full max-w-[40rem] flex-col items-center text-center">
        <PlanMark />

        <h1 className="sr-only">{paid ? WELCOME : "Team plan."}</h1>

        <div className="relative mt-10 h-[9.5rem] w-full sm:h-[7.25rem]">
          <motion.div
            className="absolute inset-0"
            aria-hidden
            initial={false}
            animate={{
              opacity: paid && gpu ? 1 : 0,
              y: paid || reduced ? 0 : 10,
            }}
            transition={reveal}
          >
            <ShaderHeadline
              narrow={narrow}
              reduced={reduced}
              onUnavailable={() => setGpu(false)}
            />
          </motion.div>

          <motion.p
            aria-hidden
            initial={false}
            animate={{
              opacity: paid && gpu ? 0 : 1,
              y: paid && gpu && !reduced ? -8 : 0,
            }}
            transition={reveal}
            className={`absolute inset-0 m-0 grid place-items-center font-display text-[2.75rem] leading-none tracking-display text-balance sm:text-[3.25rem] ${
              paid && !gpu
                ? "bg-[linear-gradient(100deg,var(--color-flare),var(--color-violet),var(--color-amber),var(--color-plan))] bg-clip-text font-semibold text-transparent"
                : "font-semibold text-ink"
            }`}
          >
            {paid ? WELCOME : "Team plan."}
          </motion.p>
        </div>

        <p
          aria-live="polite"
          className="m-0 mt-2 max-w-[26rem] text-[1.0625rem] leading-7 text-quiet"
        >
          {paid
            ? "You’ve unlocked additional usage and features. There’s so much you can now do."
            : "Additional usage and features for your whole team."}
        </p>

        <motion.button
          type="button"
          whileTap={reduced ? undefined : { scale: 0.985 }}
          transition={{ duration: MOTION.pressDuration }}
          onClick={() => setPaid((current) => !current)}
          className="mt-10 h-14 w-full cursor-pointer rounded-xl border-0 bg-plan font-sans text-[1.0625rem] font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          {paid ? (
            <>
              Get started <span aria-hidden>→</span>
            </>
          ) : (
            "Pay"
          )}
        </motion.button>
      </div>
    </main>
  )
}

function useNarrow() {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches,
  )

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)")
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return narrow
}

function ShaderHeadline({
  narrow,
  reduced,
  onUnavailable,
}: {
  narrow: boolean
  reduced: boolean
  onUnavailable: () => void
}) {
  return (
    <Shader
      className="h-full w-full"
      disableTelemetry
      onUnavailable={onUnavailable}
    >
      <Text
        id="welcome"
        text={WELCOME}
        fontFamily="Newsreader"
        fontWeight={700}
        fontSize={narrow ? 0.3 : 0.46}
        letterSpacing={-0.03}
        lineHeight={1.05}
        textAlign="center"
        width={narrow ? 0.94 : 0}
        color="#ffffff"
        visible={false}
      />
      <FlowingGradient
        maskSource="welcome"
        maskType="alpha"
        colorA="#ff5855"
        colorB="#7e75f6"
        colorC="#e99444"
        colorD="#7271f1"
        colorSpace="oklch"
        speed={reduced ? 0 : 0.45}
        distortion={0.7}
      />
    </Shader>
  )
}

function PlanMark() {
  const maskId = useId().replace(/:/g, "")

  return (
    <svg viewBox="0 0 200 108" className="h-16 w-auto" aria-hidden>
      <defs>
        <mask id={maskId}>
          <rect width="200" height="108" fill="black" />
          <circle cx="100" cy="56" r="24" fill="white" />
          <circle cx="86" cy="50" r="18" fill="black" />
        </mask>
      </defs>

      <polygon points="22,24 28,34 16,34" fill="var(--color-flare)" />
      <rect x="18" y="38" width="46" height="12" rx="2" fill="var(--color-flare)" />

      <circle
        cx="100"
        cy="56"
        r="24"
        fill="var(--color-mark)"
        mask={`url(#${maskId})`}
      />

      <polygon points="138,16 144,26 132,26" fill="var(--color-violet)" />
      <rect x="136" y="30" width="40" height="12" rx="2" fill="var(--color-violet)" />

      <polygon points="140,68 146,78 134,78" fill="var(--color-amber)" />
      <rect x="142" y="80" width="36" height="12" rx="2" fill="var(--color-amber)" />
    </svg>
  )
}
