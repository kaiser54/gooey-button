import { Input } from "@base-ui/react/input"
import { motion } from "motion/react"
import { useLayoutEffect, useRef } from "react"
import { MOTION } from "../design-system"
import { useSlowMotion } from "../slow-motion"
import { useAiChat } from "./ai-chat-context"
import { ACTIONS, TONES } from "./constants"
import { AnimatedBackground, ShimmeringText } from "./motion-parts"

/* Chrome shared by every control in the dark toolbar. */
const CHIP =
  "flex h-6 items-center gap-1 rounded-pill pr-3 pl-2 text-xs font-medium transition-[background-color,opacity] active:scale-[0.98]"
const CHIP_DARK = `${CHIP} bg-pill/10 text-pill hover:bg-pill/15`
const CHIP_LIGHT = `${CHIP} bg-pill text-ink disabled:pointer-events-none disabled:opacity-40`
const ROUND =
  "flex size-6 shrink-0 items-center justify-center rounded-full transition-[background-color,opacity] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
const TAB =
  "flex h-6 items-center justify-center rounded-pill px-2 py-[3px] text-xs font-medium whitespace-nowrap transition-[color,scale] active:scale-[0.98]"

function UndoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current [stroke-width:1.6]" aria-hidden="true">
      <path d="M6 3.5 3 6.5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6.5h5.5a4 4 0 0 1 0 8H7" strokeLinecap="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current [stroke-width:1.6]" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-current [stroke-width:1.8]" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current [stroke-width:1.8]" aria-hidden="true">
      <path d="M8 13V3.5M4 7l4-3.5L12 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 fill-none stroke-current [stroke-width:1.8]" aria-hidden="true">
      <path d="M10 3.5 5.5 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LoaderView() {
  const { loaderText, view, handleAbortEnhance } = useAiChat()
  const { scale } = useSlowMotion()
  const text = loaderText || (view === "improve" ? "Improving…" : "Working…")

  return (
    <div className="flex items-center justify-between">
      <ShimmeringText
        className="pl-3 text-xs font-medium"
        text={text}
        duration={1.4 * scale}
      />
      <button
        type="button"
        onClick={handleAbortEnhance}
        className={`${ROUND} bg-pill hover:bg-pill/90`}
        aria-label="Stop"
      >
        <span className="size-3 rounded-[4px] bg-ink" />
      </button>
    </div>
  )
}

export function ActionsView() {
  const { setView } = useAiChat()
  const { scale } = useSlowMotion()

  return (
    <div className="flex items-center">
      <AnimatedBackground
        defaultValue={ACTIONS[0].label}
        className="rounded-pill bg-pill/10"
        transition={{
          type: "spring",
          bounce: MOTION.chipBounce,
          duration: MOTION.chipDuration * scale,
        }}
      >
        {ACTIONS.map(({ label, intent, gradient }) => (
          <button
            key={label}
            data-id={label}
            type="button"
            className={`${TAB} ${
              gradient
                ? "bg-gradient-to-r from-[#66D0F7] via-[#FEEFC4] to-[#E38AF6] bg-clip-text text-transparent"
                : "text-pill/70 hover:text-pill"
            }`}
            onClick={() => setView(intent)}
          >
            {label}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  )
}

export function ToneView() {
  const { setView, handleToneClick } = useAiChat()
  const { scale } = useSlowMotion()

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={`${TAB} bg-pill/10 text-pill/70 hover:text-pill`}
        onClick={() => setView("actions")}
        aria-label="Back to actions"
      >
        <UndoIcon />
      </button>
      <div className="relative w-[248px] min-w-0">
        <div className="flex flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <AnimatedBackground
            defaultValue={TONES[0]}
            className="rounded-pill bg-pill/10"
            transition={{
              type: "spring",
              bounce: MOTION.chipBounce,
              duration: MOTION.chipDuration * scale,
            }}
          >
            {TONES.map((tone) => (
              <button
                key={tone}
                data-id={tone}
                type="button"
                className={`${TAB} text-pill/70 hover:text-pill`}
                onClick={() => handleToneClick(tone)}
              >
                {tone}
              </button>
            ))}
          </AnimatedBackground>
        </div>
        {/* Fades hint that the tone rail keeps scrolling past both edges. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-ink to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-ink to-transparent" />
      </div>
    </div>
  )
}

export function InputView() {
  const {
    inputValue,
    setInputValue,
    enhancing,
    showingResult,
    setView,
    handleDiscard,
    handleReplace,
    handleSendCustomPrompt,
    handleTryAgainCustomPrompt,
  } = useAiChat()

  const hasInput = inputValue.trim().length > 0
  const canSend = hasInput && !enhancing
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  // Grow to fit the result rather than cutting it off mid-line; the CSS
  // max-height still caps it and hands over to scrolling.
  useLayoutEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [inputValue])

  return (
    <div className="relative flex w-[364px] flex-col gap-2">
      <Input
        // Base UI's Input renders whatever element you hand it.
        render={<textarea rows={3} ref={fieldRef} />}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        placeholder={showingResult ? undefined : "Make it better"}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && canSend && !showingResult) {
            event.preventDefault()
            handleSendCustomPrompt(inputValue)
          }
        }}
        className="max-h-[15vh] min-h-[72px] w-full resize-none rounded-[12px] bg-pill/10 p-3 font-sans text-[13px] leading-5 text-pill outline-none placeholder:text-hint"
      />

      {showingResult ? (
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" className={CHIP_DARK} onClick={handleTryAgainCustomPrompt}>
            <UndoIcon />
            Try again
          </button>
          <button type="button" className={`${CHIP_DARK} ml-auto`} onClick={handleDiscard}>
            <CrossIcon />
            Discard
          </button>
          <button
            type="button"
            disabled={!hasInput}
            className={CHIP_LIGHT}
            onClick={() => handleReplace(inputValue)}
          >
            <CheckIcon />
            Replace
          </button>
        </div>
      ) : (
        <div className="flex w-full items-center justify-between gap-3">
          <button
            type="button"
            className={`${ROUND} bg-pill/10 text-pill/80 hover:text-pill`}
            onClick={() => setView("actions")}
            aria-label="Back to actions"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            disabled={!canSend}
            className={`${ROUND} bg-pill text-ink`}
            onClick={() => handleSendCustomPrompt(inputValue)}
            aria-label="Send prompt"
          >
            <ArrowUpIcon />
          </button>
        </div>
      )}
    </div>
  )
}

export function ErrorView() {
  const { error, handleTryAgain, handleDiscard } = useAiChat()
  const { scale } = useSlowMotion()

  return (
    <motion.div
      className="flex flex-col gap-2"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION.reducedDuration * scale, ease: MOTION.ease }}
    >
      <p
        role="alert"
        className="rounded-xl bg-danger/20 px-2 py-1 text-xs text-[color-mix(in_srgb,var(--color-danger)_45%,white)]"
      >
        {error}
      </p>
      <div className="flex w-full items-center justify-between gap-2">
        <button type="button" className={CHIP_DARK} onClick={handleTryAgain}>
          <UndoIcon />
          Try again
        </button>
        <button type="button" className={CHIP_DARK} onClick={handleDiscard}>
          <CrossIcon />
          Dismiss
        </button>
      </div>
    </motion.div>
  )
}
