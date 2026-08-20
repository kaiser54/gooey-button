export const EASE_OUT = [0.23, 1, 0.32, 1] as const

export const CONTROL = {
  size: 56,
  gap: 16,
}

export const MOTION = {
  pressScale: 0.97,
  pressDuration: 0.12,
  reducedDuration: 0.2,
  chipDuration: 0.3,
  chipBounce: 0.18,
  cancelDelay: 0.04,
  blur: 10,
  ease: EASE_OUT,
} as const
