export type AiChatView =
  | "actions"
  | "improve"
  | "input"
  | "change-ai-tone"
  | "fix-spelling"

export const TONES = [
  "Romantic",
  "Warm",
  "Playful",
  "Sincere",
  "Sweet",
  "Thoughtful",
  "Gentle",
  "Passionate",
] as const

export const ACTIONS: {
  intent: AiChatView
  label: string
  gradient?: boolean
}[] = [
  { label: "Improve", intent: "improve" },
  { label: "Change tone", intent: "change-ai-tone" },
  { label: "Fix spelling", intent: "fix-spelling" },
  { label: "Ask AI", intent: "input", gradient: true },
]

export const LOADER_TEXT: Partial<Record<AiChatView, string>> = {
  improve: "Improving…",
  "fix-spelling": "Fixing spelling…",
}
