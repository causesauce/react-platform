export type Book = {
  id: string;
  title: string;
  author: string;
  finished: boolean;
};

export const books: Book[] = [
  { id: "b1", title: "Piranesi", author: "Susanna Clarke", finished: true },
  { id: "b2", title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", finished: false },
  { id: "b3", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", finished: false },
  { id: "b4", title: "Project Hail Mary", author: "Andy Weir", finished: true },
];

export function ReadingList({ books }: { books: Book[] }) {
  // TODO: Split books into unfinished ("Up next") and finished ones with filter().
  // TODO: Render each group's books with map(). Each <li> reads "Title by Author"
  //       and needs a key that stays the same if the list is reordered.
  // TODO: When a group has no books, render <p>Nothing here yet.</p> instead of a <ul>.
  return (
    <div>
      <section aria-labelledby="up-next-heading">
        <h2 id="up-next-heading">Up next</h2>
        <ul>
          <li>{books[0].title}</li>
        </ul>
      </section>
      <section aria-labelledby="finished-heading">
        <h2 id="finished-heading">Finished</h2>
      </section>
    </div>
  );
}

export default function App() {
  return <ReadingList books={books} />;
}
