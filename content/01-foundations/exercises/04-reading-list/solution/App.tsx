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

function BookGroup({ id, title, books }: { id: string; title: string; books: Book[] }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {books.length === 0 ? (
        <p>Nothing here yet.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              {book.title} by {book.author}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ReadingList({ books }: { books: Book[] }) {
  const upNext = books.filter((book) => !book.finished);
  const finished = books.filter((book) => book.finished);
  return (
    <div>
      <BookGroup id="up-next-heading" title="Up next" books={upNext} />
      <BookGroup id="finished-heading" title="Finished" books={finished} />
    </div>
  );
}

export default function App() {
  return <ReadingList books={books} />;
}
