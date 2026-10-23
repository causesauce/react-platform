import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import App, { Schedule } from "./App";

describe("Schedule", () => {
  test("shows one section per day, in order", () => {
    render(<App />);
    const days = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(days).toEqual(["Friday", "Saturday"]);
  });

  test("lists each day's sessions inside that day's section", () => {
    render(<App />);
    const friday = screen.getByRole("region", { name: "Friday" });
    const saturday = screen.getByRole("region", { name: "Saturday" });
    expect(within(friday).getAllByRole("listitem")).toHaveLength(3);
    expect(within(saturday).getAllByRole("listitem")).toHaveLength(3);
  });

  test("shows the time, title and speaker of a talk", () => {
    render(<App />);
    const friday = screen.getByRole("region", { name: "Friday" });
    const [keynote] = within(friday).getAllByRole("listitem");
    expect(keynote).toHaveTextContent("09:00");
    expect(keynote).toHaveTextContent("Opening keynote");
    expect(keynote).toHaveTextContent("with Mariam Haddad");
  });

  test("does not name a speaker for breaks", () => {
    render(<App />);
    const breakItem = screen.getByText(/Coffee break/).closest("li");
    expect(breakItem).not.toBeNull();
    expect(breakItem).toHaveTextContent("10:30");
    expect(breakItem).not.toHaveTextContent("with");
  });

  test("works for any schedule", () => {
    render(
      <Schedule
        sessions={[
          { id: "a", day: "Sunday", time: "14:00", title: "Closing panel", speaker: "Ana Lima" },
          { id: "b", day: "Monday", time: "10:00", title: "Workshop", speaker: "Ben Carter" },
          { id: "c", day: "Sunday", time: "15:00", title: "Farewell drinks", speaker: null },
        ]}
      />,
    );
    const days = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(days).toEqual(["Sunday", "Monday"]);
    expect(within(screen.getByRole("region", { name: "Sunday" })).getAllByRole("listitem")).toHaveLength(2);
  });
});
