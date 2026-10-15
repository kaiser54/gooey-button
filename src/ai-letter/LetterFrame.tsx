import { Switch } from "@base-ui/react/switch"
import { useEffect, useRef, useState } from "react"
import "quill/dist/quill.core.css"
import "./letter.css"
import { AiChat } from "./AiChat"
import { AiChatProvider } from "./ai-chat-context"
import { LetterEditorProvider, useLetterEditor } from "./editor-context"
import { setForcedError } from "./mock-ai"

function Editor() {
  const { attach, counts } = useLetterEditor()
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    attach(hostRef.current)
  }, [attach])

  return (
    <>
      <div className="letter-editor min-h-[18rem] flex-1 overflow-hidden rounded-well bg-well shadow-well">
        <div ref={hostRef} className="h-full" />
      </div>
      <p className="mt-3 text-xs text-mute" aria-live="polite">
        {counts.words} words · {counts.chars} characters
      </p>
    </>
  )
}

/**
 * The real API gates on auth and premium; this exposes the same failure paths
 * so the 403 / 429 / 500 states in the toolbar stay reachable.
 */
function ForceErrorToggle() {
  const [forced, setForced] = useState(false)

  useEffect(() => {
    setForcedError(forced ? 403 : null)
    return () => setForcedError(null)
  }, [forced])

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-base leading-6 font-normal text-mute select-none">
      <span>Force error</span>
      <Switch.Root
        className="group relative flex h-5.5 w-9 shrink-0 cursor-pointer items-center rounded-pill border border-line bg-track p-0.5 transition-[background-color,border-color] duration-slow ease-out-quart hover:border-control/20 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-control data-checked:border-control data-checked:bg-control motion-reduce:duration-reduced"
        checked={forced}
        onCheckedChange={setForced}
        aria-label="Force AI error"
      >
        <Switch.Thumb className="size-4 rounded-full bg-pill shadow-thumb transition-transform duration-slow ease-out-quart group-data-checked:translate-x-3.5 motion-reduce:duration-reduced" />
      </Switch.Root>
    </label>
  )
}

export function LetterFrame() {
  return (
    <LetterEditorProvider>
      <AiChatProvider>
        <section
          id="letter"
          aria-labelledby="letter-heading"
          className="mt-12 scroll-mt-8"
        >
          <header className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2
                id="letter-heading"
                className="m-0 font-display text-2xl leading-8 font-normal tracking-display text-ink"
              >
                Inline AI
              </h2>
              <p className="mt-1 text-sm text-mute">
                Select any passage to summon the toolbar.
              </p>
            </div>
            <ForceErrorToggle />
          </header>

          <div className="flex flex-col">
            <Editor />
          </div>

          <AiChat />
        </section>
      </AiChatProvider>
    </LetterEditorProvider>
  )
}
