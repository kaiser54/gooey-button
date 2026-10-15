/**
 * Stand-in for posthearts' AIService. Same call signature and same response
 * shape as `POST /api/ai/write`, so swapping in the real endpoint is a
 * one-file change — but it runs locally, with no auth and no key.
 */

export type EnhanceAction = "improve" | "grammar" | "custom"

export interface EnhanceTextResponse {
  improved_text: string
  revision_id: string
  success: boolean
  message: string
}

/** Mirrors the API's documented failure modes so every UI state is reachable. */
export class AiApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "AiApiError"
    this.status = status
  }
}

const PREMIUM_REQUIRED =
  "AI enhancement is a premium feature. Please upgrade to premium to use AI text enhancement."

const MAX_SELECTION = 2000

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"))
      return
    }
    const id = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id)
        reject(new DOMException("Aborted", "AbortError"))
      },
      { once: true },
    )
  })
}

function sentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean)
}

function capitalize(text: string) {
  return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())
}

function tidy(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])(?=\S)/g, "$1 ")
    .trim()
}

const IMPROVE: [RegExp, string][] = [
  [/\bvery\s+/gi, ""],
  [/\breally\s+/gi, ""],
  [/\bgood\b/gi, "wonderful"],
  [/\bnice\b/gi, "lovely"],
  [/\bbig\b/gi, "immense"],
  [/\bsad\b/gi, "heavy-hearted"],
  [/\bhappy\b/gi, "luminous"],
  [/\ba lot\b/gi, "so much"],
  [/\bthing(s)?\b/gi, "moment$1"],
  [/\bi think\b/gi, "I know"],
  [/\bmiss you\b/gi, "ache for you"],
]

const SIMPLE: [RegExp, string][] = [
  [/\bimmense\b/gi, "big"],
  [/\bluminous\b/gi, "bright"],
  [/\bache for\b/gi, "miss"],
  [/\bnevertheless\b/gi, "still"],
  [/\bcommence\b/gi, "start"],
  [/\butilize\b/gi, "use"],
]

const FORMAL: [RegExp, string][] = [
  [/\bcan't\b/gi, "cannot"],
  [/\bwon't\b/gi, "will not"],
  [/\bdon't\b/gi, "do not"],
  [/\bI'm\b/g, "I am"],
  [/\byou're\b/gi, "you are"],
  [/\bkinda\b/gi, "somewhat"],
]

const CASUAL: [RegExp, string][] = [
  [/\bcannot\b/gi, "can't"],
  [/\bdo not\b/gi, "don't"],
  [/\bI am\b/g, "I'm"],
  [/\byou are\b/gi, "you're"],
  [/\bhowever\b/gi, "but"],
]

const TONE_OPENERS: Record<string, string> = {
  romantic: "There is no hour of my day that does not lean toward you.",
  warm: "I hope this finds you somewhere soft and unhurried.",
  playful: "Okay, brace yourself — this one's a little ridiculous.",
  sincere: "I want to say this plainly, without dressing it up.",
  sweet: "I keep thinking the smallest things about you.",
  thoughtful: "I have been turning this over for a while now.",
  gentle: "No rush on any of this — I just wanted you to know.",
  passionate: "I cannot hold this quietly any longer.",
}

function apply(text: string, subs: [RegExp, string][]) {
  return subs.reduce((acc, [pattern, next]) => acc.replace(pattern, next), text)
}

function improve(text: string) {
  const out = tidy(capitalize(apply(text, IMPROVE)))
  return /[.!?]$/.test(out) ? out : out + "."
}

function grammar(text: string) {
  let out = tidy(text)
  out = out.replace(/\bi\b/g, "I")
  out = out.replace(/\bteh\b/gi, "the")
  out = out.replace(/\brecieve\b/gi, "receive")
  out = out.replace(/\bdefinately\b/gi, "definitely")
  out = out.replace(/\bseperate\b/gi, "separate")
  out = out.replace(/\bits\s+been\b/gi, "it's been")
  out = capitalize(out)
  return /[.!?]$/.test(out) ? out : out + "."
}

function withTone(text: string, tone: string) {
  const opener = TONE_OPENERS[tone.toLowerCase()]
  const body = improve(text)
  return opener ? opener + " " + body : body
}

/** Reads the custom prompt for intent so the demo responds to what was asked. */
function custom(text: string, prompt: string) {
  const p = prompt.toLowerCase()

  // Tone is checked first: "make the tone more warm" also matches /more/ below.
  const toneMatch = Object.keys(TONE_OPENERS).find((t) => p.includes(t))
  if (toneMatch) return withTone(text, toneMatch)

  if (/\b(short|concise|brief|trim|tighten|cut)\b/.test(p)) {
    const parts = sentences(improve(text))
    const kept = parts.slice(0, Math.max(1, Math.ceil(parts.length / 2)))
    return tidy(kept.join(" "))
  }
  if (/\b(long|expand|elaborate|more|detail)\b/.test(p)) {
    return (
      improve(text) +
      " I keep finding new corners of it every time I sit with the thought."
    )
  }
  if (/\b(simple|simpler|plain|clear)\b/.test(p)) {
    return tidy(capitalize(apply(text, SIMPLE)))
  }
  if (/\b(formal|professional|polite)\b/.test(p)) {
    return tidy(capitalize(apply(text, FORMAL)))
  }
  if (/\b(casual|relaxed|fun|chill)\b/.test(p)) {
    return tidy(capitalize(apply(text, CASUAL)))
  }

  return improve(text)
}

/** Flipped by the frame's "Force error" switch so error states are reachable. */
let forcedError: number | null = null
export function setForcedError(status: number | null) {
  forcedError = status
}

function raiseForced() {
  if (forcedError === 403) throw new AiApiError(403, PREMIUM_REQUIRED)
  if (forcedError === 429)
    throw new AiApiError(
      429,
      "Too many letter generation attempts, please try again later.",
    )
  if (forcedError === 500)
    throw new AiApiError(500, "Failed to enhance text. Please try again.")
}

let revision = 0

export async function enhanceText(
  _letterId: string,
  selectedText: string,
  action?: EnhanceAction,
  customPrompt?: string,
  signal?: AbortSignal,
): Promise<EnhanceTextResponse> {
  raiseForced()

  const trimmed = selectedText.trim()
  if (!trimmed || trimmed.length > MAX_SELECTION) {
    throw new AiApiError(
      400,
      "Selected text is too long (max 2000 characters) or empty",
    )
  }
  if (!action && !customPrompt) {
    throw new AiApiError(400, "Either action or custom_prompt is required")
  }

  // Longer selections take longer, the way a real model does.
  await sleep(700 + Math.min(trimmed.length, 600) * 1.1, signal)
  raiseForced()

  let improved: string
  if (customPrompt) improved = custom(trimmed, customPrompt)
  else if (action === "grammar") improved = grammar(trimmed)
  else improved = improve(trimmed)

  revision += 1
  return {
    improved_text: improved,
    revision_id: "rev_" + revision.toString().padStart(6, "0"),
    success: true,
    message: "Text improved successfully",
  }
}
