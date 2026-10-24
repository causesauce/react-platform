import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

describe("Plant Swap page", () => {
  test("shows the site name as the main heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Plant Swap" })).toBeInTheDocument();
  });

  test("has a main navigation with three links", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
  });

  test("links point to the right pages", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/browse");
    expect(screen.getByRole("link", { name: "Offer a plant" })).toHaveAttribute("href", "/offer");
    expect(screen.getByRole("link", { name: "My swaps" })).toHaveAttribute("href", "/swaps");
  });

  test("keeps the introduction in the main content", () => {
    render(<App />);
    expect(screen.getByRole("main")).toHaveTextContent("Trade cuttings and seedlings with people near you.");
  });

  test("shows the copyright line in the footer", () => {
    render(<App />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 2026 Plant Swap community");
  });
});
