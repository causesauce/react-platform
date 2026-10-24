import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import App, { MemberCard } from "./App";

describe("MemberCard", () => {
  test("shows one card per team member, each headed by the name", () => {
    render(<App />);
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(3);
    expect(within(cards[0]).getByRole("heading", { name: "Ines Duarte" })).toBeInTheDocument();
    expect(within(cards[1]).getByRole("heading", { name: "Kofi Mensah" })).toBeInTheDocument();
    expect(within(cards[2]).getByRole("heading", { name: "Lena Vogel" })).toBeInTheDocument();
  });

  test("shows the role that was passed in", () => {
    render(<App />);
    const cards = screen.getAllByRole("article");
    expect(cards[0]).toHaveTextContent("Design lead");
    expect(cards[1]).toHaveTextContent("Engineer");
  });

  test("falls back to Contributor when no role is given", () => {
    render(<MemberCard name="Sam Okoro" avatarUrl="/avatars/sam.png" />);
    expect(screen.getByRole("article")).toHaveTextContent("Contributor");
  });

  test("shows the avatar with descriptive alt text", () => {
    render(<MemberCard name="Sam Okoro" role="Researcher" avatarUrl="/avatars/sam.png" />);
    expect(screen.getByRole("img", { name: "Sam Okoro's avatar" })).toHaveAttribute("src", "/avatars/sam.png");
  });
});
