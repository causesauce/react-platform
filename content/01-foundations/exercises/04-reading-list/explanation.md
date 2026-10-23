The solution prepares the data first and renders second. `filter` splits the books into two arrays before any JSX is written, and each group then becomes a plain `map` over its array. The page never needs an `if` inside a loop.

Both sections share one shape: a heading, then either a list or an empty-state message. So the shape lives in a `BookGroup` component, and `ReadingList` only decides which books go where. Changing the empty-state wording now means editing one place.

**Keys.** Each `<li>` gets `book.id`. That ID belongs to the book, so it stays the same if the list is sorted or a book moves from "Up next" to "Finished". The index from `map` would describe a position instead. After a reorder, React would match the wrong items, along with any state they held. The last test listens for React's "unique key" warning. That warning is how React tells you, during development, that it can't track the items in a list.

**Why sections and labelled headings.** `aria-labelledby` points each `<section>` at its heading, which turns it into a named region. Screen reader users can jump straight to "Finished", and the tests can look up a list by the name a person would use.
