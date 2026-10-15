import { Popover } from "@base-ui/react/popover"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { MOTION } from "../design-system"
import { useSlowMotion } from "../slow-motion"
import { useAiChat } from "./ai-chat-context"
import { useLetterEditor } from "./editor-context"
import { ActionsView, ErrorView, InputView, LoaderView, ToneView } from "./views"

/**
 * Measures the swapping views so the shell can morph to whatever is inside it.
 * A callback ref, not an object ref: the measured node lives inside the popover
 * portal, so it only exists once the toolbar opens.
 */
function useMeasuredSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null
    if (!el) return
    const read = () =>
      setSize({ width: el.offsetWidth, height: el.offsetHeight })
    observerRef.current = new ResizeObserver(read)
    observerRef.current.observe(el)
    read()
  }, [])

  return [ref, size] as const
}

export function AiChat() {
  const { selection } = useLetterEditor()
  const { view, open, enhancing, error, setOpen, setView, handleDiscard } =
    useAiChat()
  const reduceMotion = useReducedMotion()
  const { scale } = useSlowMotion()
  const [contentRef, { width, height }] = useMeasuredSize()

  // Bigger height jumps get a slightly longer crossfade, so tall <-> short
  // view swaps don't feel snappier than short <-> short ones.
  const previousHeight = useRef(0)
  const [morphSeconds, setMorphSeconds] = useState(0.15)
  useLayoutEffect(() => {
    const delta = Math.abs(height - previousHeight.current)
    previousHeight.current = height
    setMorphSeconds(Math.min(Math.max(delta / 500, 0.15), 0.27))
  }, [height])
  const duration = morphSeconds * scale

  // The toolbar floats over a text selection, not a trigger element, so it is
  // anchored to a virtual element reporting the selection's viewport rect.
  const anchor = useMemo(() => {
    if (!selection) return null
    const { left, top, width, height: h } = selection.rect
    return {
      getBoundingClientRect: () =>
        new DOMRect(left, top, Math.max(width, 1), Math.max(h, 1)),
    }
  }, [selection])

  useEffect(() => {
    if (!open) setView("actions")
  }, [open, setView])

  if (!selection) return null

  const showLoader = enhancing || view === "improve" || view === "fix-spelling"
  const key = error ? "error" : showLoader ? "loader" : view

  return (
    <>
      {/* Quill's own selection styling disappears once the editor blurs, so the
          highlight is redrawn per visual line and kept while the toolbar is up. */}
      {selection.rects.map((rect, index) => (
        <div
          key={`${rect.left}-${rect.top}-${index}`}
          className="pointer-events-none fixed z-40 rounded-[2px] bg-control/15"
          style={{
            left: rect.left,
            top: rect.top - 2,
            width: Math.max(rect.width, 1),
            height: Math.max(rect.height, 1) + 4.5,
          }}
          aria-hidden="true"
        />
      ))}

      <Popover.Root
        open={open}
        onOpenChange={(next, details) => {
          if (next) {
            setOpen(true)
            return
          }
          // Escape, or a press somewhere unrelated, is a real dismissal.
          if (details?.reason === "escape-key") {
            handleDiscard()
            return
          }
          if (details?.reason === "outside-press") {
            const target = details.event?.target
            const inEditor =
              target instanceof Node &&
              document.querySelector(".letter-editor")?.contains(target)
            // A press inside the editor is the start of a new selection;
            // Quill's own selection-change clears this one.
            if (!inEditor) handleDiscard()
            return
          }
          // Focus moving into the toolbar must not close it.
          if (selection) return
          setOpen(false)
        }}
      >
        <Popover.Portal>
          <Popover.Positioner
            anchor={anchor}
            side="top"
            align="center"
            sideOffset={16}
            // Selection rects are viewport coords, so anchor in the same frame.
            positionMethod="fixed"
            className="z-50"
          >
            {/* The popup must not clip, or it eats the arrow; the inner shell
                is what clips while it morphs between views. */}
            <Popover.Popup
              initialFocus={false}
              className="relative rounded-well bg-ink p-1 shadow-lift outline-none"
            >
              <Popover.Arrow className="data-[side=bottom]:top-[-4px] data-[side=top]:bottom-[-4px]">
                <span className="block size-2.5 rotate-45 rounded-[2px] bg-ink" />
              </Popover.Arrow>

              <motion.div
                className="overflow-hidden"
                initial={false}
                animate={{
                  height: height === 0 ? 24 : height,
                  width: width === 0 ? 285 : width,
                }}
                transition={
                  reduceMotion
                    ? { duration: MOTION.reducedDuration * scale }
                    : { duration, ease: [0.25, 1, 0.5, 1] }
                }
              >
                <div ref={contentRef} className="w-max">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                      transition={
                        reduceMotion
                          ? { duration: MOTION.reducedDuration * scale }
                          : { duration, ease: [0.26, 0.08, 0.25, 1] }
                      }
                    >
                      {error ? (
                        <ErrorView />
                      ) : showLoader ? (
                        <LoaderView />
                      ) : view === "input" ? (
                        <InputView />
                      ) : view === "change-ai-tone" ? (
                        <ToneView />
                      ) : (
                        <ActionsView />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}
