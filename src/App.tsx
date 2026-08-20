import { DeleteMorph } from "./DeleteMorph"
import { SearchMorph } from "./SearchMorph"
import { SlowMotionToggle } from "./slow-motion"
import { SkipLink, Well } from "./ui"

const ITEMS = [
  { id: "delete", node: <DeleteMorph /> },
  { id: "search", node: <SearchMorph /> },
] as const

function App() {
  return (
    <>
      <SkipLink />
      <main className="mx-auto w-[min(62.5rem,calc(100%-6rem))] py-20 max-[720px]:w-[min(62.5rem,calc(100%-2.5rem))]">
        <header className="mb-12 flex items-center justify-between gap-4">
          <h1 className="m-0 font-display text-2xl font-normal leading-8 tracking-display text-balance text-ink">
            Interactions
          </h1>
          <SlowMotionToggle />
        </header>

        <ul
          id="studies"
          className="m-0 grid list-none grid-cols-1 gap-12 scroll-mt-8 p-0 min-[720px]:grid-cols-2"
        >
          {ITEMS.map((item) => (
            <li key={item.id}>
              <Well>{item.node}</Well>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}

export default App
