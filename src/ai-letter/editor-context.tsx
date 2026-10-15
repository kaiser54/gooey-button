import Quill from "quill"
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

export interface SelectionRect {
  left: number
  top: number
  width: number
  height: number
}

export interface EditorSelection {
  /** Bounding rect of the selection, in viewport coords — anchors the toolbar. */
  rect: SelectionRect
  /** One rect per visual line, so the highlight survives the editor losing focus. */
  rects: SelectionRect[]
  text: string
  range: { index: number; length: number }
}

interface EditorContextValue {
  selection: EditorSelection | null
  counts: { words: number; chars: number }
  attach: (host: HTMLDivElement | null) => void
  clearSelection: () => void
  replaceSelection: (text: string) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

const SEED = `My dearest,

It rained all afternoon here and i kept the window open anyway, just to hear it. I think you would have liked that. The whole street smelled like wet stone and someone two floors down was practising the same four bars of piano over and over, never quite getting them right.

I have a lot of things to tell you and none of them are very big. Only that it was a good day, and that you were not in it, and that those two facts sat next to each other all evening without ever quite agreeing.`

function toRect(r: DOMRect): SelectionRect {
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

export function LetterEditorProvider({ children }: { children: ReactNode }) {
  const quillRef = useRef<Quill | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [selection, setSelection] = useState<EditorSelection | null>(null)
  const [counts, setCounts] = useState({ words: 0, chars: 0 })

  const measure = useCallback((quill: Quill) => {
    const text = quill.getText().trim()
    setCounts({
      words: text ? text.split(/\s+/).length : 0,
      chars: Math.max(quill.getLength() - 1, 0),
    })
  }, [])

  const attach = useCallback(
    (host: HTMLDivElement | null) => {
      hostRef.current = host
      if (!host || quillRef.current) return

      const quill = new Quill(host, {
        theme: "snow",
        modules: { toolbar: false },
        placeholder: "Express how you feel",
      })
      quillRef.current = quill
      quill.setText(SEED)
      quill.setSelection(0, 0)
      measure(quill)

      quill.on("text-change", () => measure(quill))

      quill.on("selection-change", (range, _old, source) => {
        if (source !== "user") return
        const editorEl = host.querySelector(".ql-editor")
        const domSelection = document.getSelection()

        // A collapsed range only clears the toolbar when the caret is still
        // inside the editor; clicking into the toolbar must not drop it.
        if (!range || range.length === 0) {
          if (
            editorEl &&
            domSelection?.anchorNode &&
            editorEl.contains(domSelection.anchorNode)
          ) {
            setSelection(null)
          }
          return
        }

        if (!domSelection || domSelection.rangeCount === 0) {
          setSelection(null)
          return
        }
        if (!editorEl || !editorEl.contains(domSelection.anchorNode)) return

        const text = quill.getText(range.index, range.length).trim()
        if (!text) {
          setSelection(null)
          return
        }

        const domRange = domSelection.getRangeAt(0)
        setSelection({
          rect: toRect(domRange.getBoundingClientRect()),
          rects: Array.from(domRange.getClientRects())
            .filter((r) => r.width > 0 && r.height > 0)
            .map(toRect),
          text,
          range: { index: range.index, length: range.length },
        })
      })
    },
    [measure],
  )

  const clearSelection = useCallback(() => {
    quillRef.current?.setSelection(0, 0)
    quillRef.current?.blur()
    setSelection(null)
  }, [])

  const replaceSelection = useCallback((text: string) => {
    const quill = quillRef.current
    const range = quill && selectionRef.current?.range
    if (!quill || !range) return
    quill.deleteText(range.index, range.length, "user")
    quill.insertText(range.index, text, "user")
    quill.setSelection(range.index + text.length, 0)
    quill.blur()
    setSelection(null)
  }, [])

  // Kept in a ref so replaceSelection stays stable across selection changes.
  const selectionRef = useRef(selection)
  selectionRef.current = selection

  // Viewport coords go stale the moment anything scrolls or resizes.
  useEffect(() => {
    if (!selection) return
    const drop = () => setSelection(null)
    // Capture is needed to catch the page and the editor scrolling, but it also
    // sees the toolbar's own height animation — those must not drop the selection.
    const onScroll = (event: Event) => {
      const target = event.target
      const isPage =
        target === document ||
        target === document.documentElement ||
        target === document.body
      const isEditor =
        target instanceof Element && target.classList.contains("ql-editor")
      if (isPage || isEditor) drop()
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", drop)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", drop)
    }
  }, [selection])

  const value = useMemo(
    () => ({ selection, counts, attach, clearSelection, replaceSelection }),
    [selection, counts, attach, clearSelection, replaceSelection],
  )

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  )
}

export function useLetterEditor() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useLetterEditor must be used within LetterEditorProvider")
  }
  return context
}
