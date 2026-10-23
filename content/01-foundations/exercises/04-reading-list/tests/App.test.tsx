import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import App, { ReadingList } from "./App";
import type { Book } from "./App";

function itemsIn(groupName: string) {
  const group = screen.getByRole("region", { name: groupName });
  return within(group)
    .queryAllByRole("listitem")
    .map((item) => item.textContent);
}

describe("ReadingList", () => {
  test("lists unfinished books under Up next", () => {
    render(<App />);
    expect(itemsIn("Up next")).toEqual([
      "The Left Hand of Darkness by Ursula K. Le Guin",
      "Braiding Sweetgrass by Robin Wall Kimmerer",
    ]);
  });

  test("lists finished books under Finished", () => {
    render(<App />);
    expect(itemsIn("Finished")).toEqual(["Piranesi by Susanna Clarke", "Project Hail Mary by Andy Weir"]);
  });

  test("works for any list of books", () => {
    const shelf: Book[] = [
      { id: "x1", title: "Kindred", author: "Octavia E. Butler", finished: false },
      { id: "x2", title: "Middlemarch", author: "George Eliot", finished: true },
      { id: "x3", title: "Beloved", author: "Toni Morrison", finished: false },
    ];
    render(<ReadingList books={shelf} />);
    expect(itemsIn("Up next")).toEqual(["Kindred by Octavia E. Butler", "Beloved by Toni Morrison"]);
    expect(itemsIn("Finished")).toEqual(["Middlemarch by George Eliot"]);
  });

  test("shows a message instead of an empty list", () => {
    render(<ReadingList books={[{ id: "x1", title: "Kindred", author: "Octavia E. Butler", finished: true }]} />);
    const upNext = screen.getByRole("region", { name: "Up next" });
    expect(within(upNext).getByText("Nothing here yet.")).toBeInTheDocument();
    expect(within(upNext).queryByRole("list")).not.toBeInTheDocument();
  });

  test("gives every list item a key", () => {
    const messages: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      messages.push(args.map(String).join(" "));
    };
    try {
      render(<App />);
    } finally {
      console.error = original;
    }
    expect(messages.join("\n")).not.toMatch(/unique "key" prop/);
  });
});
