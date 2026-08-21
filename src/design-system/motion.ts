export const EASE_OUT = [0.23, 1, 0.32, 1] as const

export const CONTROL = {
  size: 56,
  gap: 16,
}

export const MOTION = {
  hoverScale: 1,
  pressScale: 1.3,
  pressDuration: 0.32,
  reducedDuration: 0.2,
  chipDuration: 0.3,
  chipBounce: 0.18,
  cancelDelay: 0.04,
  holdDuration: 1.6,
  holdRelease: 0.2,
  blur: 10,
  ease: EASE_OUT,
} as const
