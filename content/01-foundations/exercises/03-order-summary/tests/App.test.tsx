import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderSummary } from "./App";

describe("OrderSummary", () => {
  test("shows only the empty message when the cart is empty", () => {
    const { container } = render(<OrderSummary itemCount={0} total={0} />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
    expect(container.textContent).toBe("Your cart is empty.");
  });

  test("shows the item count and total", () => {
    render(<OrderSummary itemCount={3} total={64.5} />);
    expect(screen.getByText("3 items")).toBeInTheDocument();
    expect(screen.getByText("Total: €64.50")).toBeInTheDocument();
  });

  test("uses the singular for a single item", () => {
    render(<OrderSummary itemCount={1} total={19} />);
    expect(screen.getByText("1 item")).toBeInTheDocument();
  });

  test("offers free shipping from a total of 50", () => {
    render(<OrderSummary itemCount={2} total={50} />);
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
  });

  test("does not offer free shipping below 50", () => {
    render(<OrderSummary itemCount={2} total={49.99} />);
    expect(screen.queryByText("Free shipping")).not.toBeInTheDocument();
  });
});
