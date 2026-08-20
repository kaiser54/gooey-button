export const SPEED = {
  min: { open: 1.2, close: 1, bounceOpen: 0.35, bounceClose: 0.3 },
  max: { open: 5, close: 4.2, bounceOpen: 0.12, bounceClose: 0.1 },
} as const

export const SLOW_SCALE = SPEED.max.open / SPEED.min.open

export function mix(from: number, to: number, t: number) {
  return from + (to - from) * t
}
