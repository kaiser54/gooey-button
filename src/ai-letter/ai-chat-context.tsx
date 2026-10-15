import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { LOADER_TEXT, type AiChatView } from "./constants"
import { useLetterEditor } from "./editor-context"
import { AiApiError, enhanceText, type EnhanceAction } from "./mock-ai"

/** Delay before the toolbar appears, so it doesn't flicker while dragging a selection. */
const OPEN_DELAY_MS = 500

const LETTER_ID = "letter_demo"

interface AiChatContextValue {
  view: AiChatView
  open: boolean
  inputValue: string
  enhancing: boolean
  loaderText: string
  error: string | null
  /** True once a result is back: the input view swaps to Try again / Discard / Replace. */
  showingResult: boolean
  selectedText: string
  setView: (view: AiChatView) => void
  setOpen: (open: boolean) => void
  setInputValue: (value: string) => void
  handleDiscard: () => void
  handleReplace: (text: string) => void
  handleTryAgain: () => void
  handleToneClick: (tone: string) => void
  handleSendCustomPrompt: (prompt: string) => void
  handleTryAgainCustomPrompt: () => void
  handleAbortEnhance: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

/** The API strips its own quoting inconsistently; the source normalises the same way. */
function normalize(text: string) {
  let s = text.trim()
  if (s.length > 1 && s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1)
  return s.trim()
}

function errorMessage(err: unknown) {
  if (err instanceof AiApiError) return err.message
  return "Failed to enhance text. Please try again."
}

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError"
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  const { selection, clearSelection, replaceSelection } = useLetterEditor()

  const [view, setView] = useState<AiChatView>("actions")
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [enhancing, setEnhancing] = useState(false)
  const [loaderText, setLoaderText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showingResult, setShowingResult] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const lastPromptRef = useRef<string | null>(null)

  // The selection text is frozen when the request starts — replacing it later
  // must not depend on the selection still being live.
  const selectedText = selection?.text ?? ""
  const selectedTextRef = useRef(selectedText)
  if (selectedText) selectedTextRef.current = selectedText

  useEffect(() => {
    if (!selection) {
      setOpen(false)
      setView("actions")
      setError(null)
      return
    }
    const id = window.setTimeout(() => setOpen(true), OPEN_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [selection])

  useEffect(() => {
    if (view !== "input") setShowingResult(false)
  }, [view])

  const run = useCallback(
    (
      label: string,
      action: EnhanceAction | undefined,
      prompt: string | undefined,
    ) => {
      const text = selectedTextRef.current
      if (!text.trim()) return

      const controller = new AbortController()
      abortRef.current = controller
      setError(null)
      setLoaderText(label)
      setEnhancing(true)

      enhanceText(LETTER_ID, text, action, prompt, controller.signal)
        .then((res) => {
          if (controller.signal.aborted) return
          setEnhancing(false)
          abortRef.current = null
          setInputValue(normalize(res.improved_text))
          setShowingResult(true)
          setView("input")
        })
        .catch((err) => {
          if (isAbort(err)) return
          setEnhancing(false)
          abortRef.current = null
          setError(errorMessage(err))
          setView("actions")
        })
    },
    [],
  )

  // "improve" and "fix-spelling" are views that immediately fire a request.
  useEffect(() => {
    if (view !== "improve" && view !== "fix-spelling") return
    const action: EnhanceAction = view === "improve" ? "improve" : "grammar"
    run(LOADER_TEXT[view] ?? "Working…", action, undefined)
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [view, run])

  const handleDiscard = useCallback(() => {
    setError(null)
    setInputValue("")
    setShowingResult(false)
    lastPromptRef.current = null
    setOpen(false)
    setView("actions")
    clearSelection()
  }, [clearSelection])

  const handleReplace = useCallback(
    (text: string) => {
      replaceSelection(text)
      setOpen(false)
      setInputValue("")
      setShowingResult(false)
      setView("actions")
    },
    [replaceSelection],
  )

  const handleTryAgain = useCallback(() => {
    setError(null)
    setView("improve")
  }, [])

  const handleToneClick = useCallback(
    (tone: string) => {
      lastPromptRef.current = `Make the tone more ${tone.toLowerCase()}`
      run("Changing tone…", undefined, lastPromptRef.current)
    },
    [run],
  )

  const handleSendCustomPrompt = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return
      lastPromptRef.current = prompt
      run("Working…", undefined, prompt)
    },
    [run],
  )

  const handleTryAgainCustomPrompt = useCallback(() => {
    const last = lastPromptRef.current
    if (last?.trim()) run("Working…", undefined, last)
  }, [run])

  const handleAbortEnhance = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setEnhancing(false)
    setLoaderText("")
    setView("actions")
  }, [])

  const value = useMemo(
    () => ({
      view,
      open,
      inputValue,
      enhancing,
      loaderText,
      error,
      showingResult,
      selectedText,
      setView,
      setOpen,
      setInputValue,
      handleDiscard,
      handleReplace,
      handleTryAgain,
      handleToneClick,
      handleSendCustomPrompt,
      handleTryAgainCustomPrompt,
      handleAbortEnhance,
    }),
    [
      view,
      open,
      inputValue,
      enhancing,
      loaderText,
      error,
      showingResult,
      selectedText,
      handleDiscard,
      handleReplace,
      handleTryAgain,
      handleToneClick,
      handleSendCustomPrompt,
      handleTryAgainCustomPrompt,
      handleAbortEnhance,
    ],
  )

  return (
    <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
  )
}

export function useAiChat() {
  const context = useContext(AiChatContext)
  if (!context) throw new Error("useAiChat must be used within AiChatProvider")
  return context
}
