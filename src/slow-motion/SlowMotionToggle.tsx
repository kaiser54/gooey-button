import { Switch } from "@base-ui/react/switch"
import { useSlowMotion } from "./context"

export function SlowMotionToggle() {
  const { slow, setSlow } = useSlowMotion()

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-base leading-6 font-normal text-mute select-none">
      <span>Slow</span>
      <Switch.Root
        className="group relative flex h-5.5 w-9 shrink-0 cursor-pointer items-center rounded-pill border border-line bg-track p-0.5 transition-[background-color,border-color] duration-slow ease-out-quart hover:border-control/20 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-control data-checked:border-control data-checked:bg-control motion-reduce:duration-reduced"
        checked={slow}
        onCheckedChange={(checked) => setSlow(checked)}
        aria-label="Slow motion"
      >
        <Switch.Thumb className="size-4 rounded-full bg-pill shadow-thumb transition-transform duration-slow ease-out-quart group-data-checked:translate-x-3.5 motion-reduce:duration-reduced" />
      </Switch.Root>
    </label>
  )
}
