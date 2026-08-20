import type { ReactNode } from "react"

export function Well({ children }: { children: ReactNode }) {
  return (
    <div className="grid aspect-square place-items-center overflow-hidden rounded-well bg-well shadow-well">
      {children}
    </div>
  )
}
